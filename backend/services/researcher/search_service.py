"""
Search Service - Orchestrates participant search.

This service coordinates the retrieval process and uses Hybrid Retrieval
(BM25 + SBERT) for the best results, enhanced with natural language understanding,
query preprocessing, filtering, and match explanations.
"""

from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from database import supabase
from services.retrieval.hybrid_retriever import HybridRetriever
from services.retrieval.prompt_interpreter import PromptInterpreter
from services.retrieval.query_processor import QueryProcessor
from services.retrieval.relevance_explainer import RelevanceExplainer

logger = logging.getLogger(__name__)


class SearchService:
    """
    Main search service that orchestrates retrieval.
    
    Uses Hybrid Retrieval (BM25 + SBERT) with Reciprocal Rank Fusion,
    enhanced with prompt interpretation, query preprocessing, and match explanations.
    """
    
    def __init__(self):
        """Initialize search service with all components."""
        self.participants = None
        self.hybrid_retriever = None
        self.prompt_interpreter = PromptInterpreter()
        self.query_processor = QueryProcessor()
        self.relevance_explainer = RelevanceExplainer()
        self._load_participants()
        self._initialize_retrievers()
    
    def _load_participants(self):
        """Load all participants from database."""
        logger.info("Loading participants from database...")
        try:
            response = supabase.table("participants").select("*").execute()
            self.participants = response.data
            logger.info(f"Loaded {len(self.participants)} participants")
        except Exception as e:
            logger.error(f"Failed to load participants: {e}")
            raise
    
    def _initialize_retrievers(self):
        """Initialize retrieval methods."""
        logger.info("Initializing Hybrid retriever...")
        try:
            self.hybrid_retriever = HybridRetriever(self.participants)
            logger.info("✅ Hybrid retriever initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Hybrid retriever: {e}")
            raise
    
    def search(
        self,
        query: str,
        top_k: int = 50,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Search for participants matching the query with natural language understanding.
        
        Pipeline:
        1. Extract structured filters from natural language query
        2. Preprocess query (normalize, expand synonyms)
        3. Merge explicit and extracted filters
        4. Execute hybrid search with filters
        5. Enrich results with match explanations
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            filters: Optional explicit filters (role, remote, tools, etc.)
        
        Returns:
            Dict with results and metadata including match_reasons
        """
        start_time = datetime.now()
        
        logger.info(f"Search query: '{query}' (top_k={top_k})")
        
        try:
            # Step 1: Interpret prompt to extract structured filters
            interpreted_query = self.prompt_interpreter.extract_intent(query)
            extracted_filters = interpreted_query.get("filters", {})
            search_query = interpreted_query.get("query", query)
            
            # Step 2: Preprocess query (normalize, expand synonyms)
            processed_query = self.query_processor.process_query(search_query)
            expanded_query = processed_query.get("expanded_query", search_query)
            query_terms = processed_query.get("terms", [])
            
            # Step 3: Merge explicit filters with extracted filters
            # Explicit filters take precedence
            merged_filters = {**extracted_filters, **(filters or {})}
            
            logger.debug(f"Extracted filters: {extracted_filters}")
            logger.debug(f"Merged filters: {merged_filters}")
            logger.debug(f"Expanded query: {expanded_query}")
            
            # Step 4: Execute hybrid search with filters
            results = self.hybrid_retriever.search(
                query=expanded_query,
                top_k=top_k,
                filters=merged_filters if merged_filters else None
            )
            
            # Step 5: Enrich results with full participant data and match explanations
            enriched_results = self._enrich_results(
                results,
                method="Hybrid",
                original_query=query,
                filters=merged_filters,
                query_terms=query_terms
            )
            
            # Calculate retrieval time
            retrieval_time = (datetime.now() - start_time).total_seconds() * 1000
            
            logger.info(f"Search completed: {len(enriched_results)} results in {retrieval_time:.0f}ms")
            
            return {
                "query": query,
                "expanded_query": expanded_query,
                "results": enriched_results,
                "count": len(enriched_results),
                "retrieval_time_ms": round(retrieval_time, 2),
                "method": "hybrid",
                "filters": merged_filters,
                "extracted_filters": extracted_filters
            }
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise
    
    def _enrich_results(
        self,
        results: List[Dict[str, Any]],
        method: str,
        original_query: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None,
        query_terms: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Enrich results with full participant data and match explanations.
        
        Args:
            results: List of {participant_id, score, rank}
            method: Retrieval method used
            original_query: Original search query (for explanations)
            filters: Applied filters (for explanations)
            query_terms: Extracted query terms (for explanations)
        
        Returns:
            List of enriched results with full participant data and match_reasons
        """
        enriched = []
        
        for result in results:
            # Find full participant data
            participant = next(
                (p for p in self.participants if p['id'] == result['participant_id']),
                None
            )
            
            if participant:
                # Generate match explanations
                match_reasons = []
                if original_query:
                    match_reasons = self.relevance_explainer.explain_match(
                        participant,
                        original_query,
                        filters,
                        query_terms
                    )
                
                enriched.append({
                    "participant": participant,
                    "score": result['score'],
                    "rank": result['rank'],
                    "retrieval_method": method,
                    "match_reasons": match_reasons
                })
        
        return enriched
    
    def get_participant_by_id(self, participant_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single participant by ID.
        
        Args:
            participant_id: Participant UUID
        
        Returns:
            Participant data or None
        """
        try:
            response = supabase.table("participants").select("*").eq("id", participant_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Failed to get participant {participant_id}: {e}")
            return None
    
    def reload_data(self):
        """
        Reload participants from database and reinitialize retrievers.
        
        Useful when data changes or for testing.
        """
        logger.info("Reloading search service...")
        self._load_participants()
        self._initialize_retrievers()
        logger.info("✅ Search service reloaded")


# Global search service instance
# Initialized once when the app starts
_search_service = None

def get_search_service() -> SearchService:
    """
    Get or create the global search service instance.
    
    Returns:
        SearchService instance
    """
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service

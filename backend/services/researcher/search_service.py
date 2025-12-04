"""
Search Service - Orchestrates participant search.

This service coordinates the retrieval process and uses Hybrid Retrieval
(BM25 + SBERT) for the best results.
"""

from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from database import supabase
from services.retrieval.hybrid_retriever import HybridRetriever

logger = logging.getLogger(__name__)


class SearchService:
    """
    Main search service that orchestrates retrieval.
    
    Uses Hybrid Retrieval (BM25 + SBERT) with Reciprocal Rank Fusion.
    """
    
    def __init__(self):
        """Initialize search service and load participants."""
        self.participants = None
        self.hybrid_retriever = None
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
        Search for participants matching the query.
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            filters: Optional filters (role, remote, tools, etc.)
        
        Returns:
            Dict with results and metadata
        """
        start_time = datetime.now()
        
        logger.info(f"Search query: '{query}' (top_k={top_k})")
        
        try:
            # Use Hybrid Retriever
            results = self.hybrid_retriever.search(query, top_k=top_k, filters=filters)
            
            # Enrich results with full participant data
            enriched_results = self._enrich_results(results, method="Hybrid")
            
            # Calculate retrieval time
            retrieval_time = (datetime.now() - start_time).total_seconds() * 1000
            
            logger.info(f"Search completed: {len(enriched_results)} results in {retrieval_time:.0f}ms")
            
            return {
                "query": query,
                "results": enriched_results,
                "count": len(enriched_results),
                "retrieval_time_ms": round(retrieval_time, 2),
                "method": "hybrid",
                "filters": filters
            }
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise
    
    def _enrich_results(
        self, 
        results: List[Dict[str, Any]], 
        method: str
    ) -> List[Dict[str, Any]]:
        """
        Enrich results with full participant data.
        
        Args:
            results: List of {participant_id, score, rank}
            method: Retrieval method used
        
        Returns:
            List of enriched results with full participant data
        """
        enriched = []
        
        for result in results:
            # Find full participant data
            participant = next(
                (p for p in self.participants if p['id'] == result['participant_id']),
                None
            )
            
            if participant:
                enriched.append({
                    "participant": participant,
                    "score": result['score'],
                    "rank": result['rank'],
                    "retrieval_method": method
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

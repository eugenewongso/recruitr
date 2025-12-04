"""
Sentence-BERT Retriever - Semantic search using embeddings.

Implements semantic search using Sentence-BERT and Supabase pgvector.
"""

import logging
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from database import supabase
from config import settings
from .base_retriever import BaseRetriever

logger = logging.getLogger(__name__)

class SBERTRetriever(BaseRetriever):
    """
    Semantic search using Sentence-BERT embeddings and Supabase pgvector.
    """
    
    def __init__(self):
        """
        Initialize SBERT retriever.
        """
        self.model_name = settings.sbert_model
        self.model = None
        self._load_model()
        
    def _load_model(self):
        """
        Load Sentence-BERT model.
        """
        logger.info(f"Loading SBERT model: {self.model_name}...")
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info("✅ SBERT model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load SBERT model: {e}")
            raise
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a text.
        
        Args:
            text: Input text
            
        Returns:
            384-dimensional embedding vector
        """
        if not self.model:
            raise RuntimeError("SBERT model not loaded")
            
        # Generate embedding (returns numpy array)
        embedding = self.model.encode(text)
        
        # Convert to list for JSON serialization
        return embedding.tolist()
    
    def search(
        self,
        query: str,
        top_k: int = 50,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Semantic search using Supabase pgvector.
        
        Args:
            query: Search query
            top_k: Number of results
            filters: Optional filters (remote, tools, role)
            
        Returns:
            List of dicts with participant_id and score
        """
        logger.debug(f"SBERT search query: '{query}'")
        
        try:
            # 1. Generate query embedding
            query_embedding = self.generate_embedding(query)
            
            # 2. Prepare filters
            filter_remote = filters.get("remote") if filters else None
            filter_tools = filters.get("tools") if filters else None
            filter_role = filters.get("role") if filters else None
            
            # 3. Call Supabase RPC
            # match_participants(query_embedding, match_threshold, match_count, filter_remote, filter_tools, filter_role)
            params = {
                "query_embedding": query_embedding,
                "match_threshold": 0.0,  # Return everything ranked by similarity
                "match_count": top_k,
                "filter_remote": filter_remote,
                "filter_tools": filter_tools,
                "filter_role": filter_role
            }
            
            response = supabase.rpc("match_participants", params).execute()
            
            # 4. Format results
            results = []
            if response.data:
                for i, item in enumerate(response.data):
                    results.append({
                        "participant_id": item["id"],
                        "score": item["similarity"],
                        "rank": i + 1
                    })
            
            logger.info(f"SBERT returned {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"SBERT search failed: {e}")
            return []
    
    def get_name(self) -> str:
        """Return the name of this retriever."""
        return f"SBERT ({self.model_name})"

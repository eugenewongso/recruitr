"""
Hybrid Retriever - Combines BM25 and SBERT using Rank Fusion.

Implements hybrid search with Reciprocal Rank Fusion (RRF) to combine
lexical (BM25) and semantic (SBERT) search results.
"""

import logging
from typing import List, Dict, Any, Optional
from .bm25_retriever import BM25Retriever
from .sbert_retriever import SBERTRetriever
from config import settings

logger = logging.getLogger(__name__)

class HybridRetriever:
    """
    Hybrid search combining BM25 (lexical) and SBERT (semantic) with RRF.
    """
    
    def __init__(self, participants: List[Dict[str, Any]]):
        """
        Initialize hybrid retriever with both BM25 and SBERT.
        
        Args:
            participants: List of participant dictionaries
        """
        logger.info("Initializing Hybrid Retriever...")
        self.participants = participants
        self.bm25 = BM25Retriever(participants)
        self.sbert = SBERTRetriever()
        self.participants_dict = {p['id']: p for p in participants}
        logger.info("✅ Hybrid Retriever initialized")
        
    def search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search using Reciprocal Rank Fusion.
        
        Args:
            query: Search query
            filters: Optional filters
            top_k: Number of final results
            
        Returns:
            Ranked list of participants with fused scores
        """
        logger.info(f"Hybrid search query: '{query}'")
        
        # 1. Get BM25 results (get 2x top_k to allow for fusion overlaps)
        # BM25 now supports post-retrieval filtering
        bm25_results = self.bm25.search(query, top_k=top_k * 2, filters=filters)
        
        # 2. Get SBERT results
        # SBERT supports filters natively in the DB query
        sbert_results = self.sbert.search(query, top_k=top_k * 2, filters=filters)
        
        # 3. Apply Reciprocal Rank Fusion
        fused_results = self.reciprocal_rank_fusion(bm25_results, sbert_results, k=settings.rrf_k)
        
        # 4. Limit to top_k
        return fused_results[:top_k]
    
    def reciprocal_rank_fusion(
        self,
        bm25_results: List[Dict[str, Any]],
        sbert_results: List[Dict[str, Any]],
        k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Combine rankings using Reciprocal Rank Fusion.
        
        RRF Formula:
            score(item) = Σ 1 / (k + rank_i(item))
        
        Args:
            bm25_results: Results from BM25
            sbert_results: Results from SBERT
            k: RRF constant (default: 60)
            
        Returns:
            List of participants sorted by fused score
        """
        fused_scores = {}
        
        # Helper to process results
        def process_results(results):
            for rank, result in enumerate(results):
                p_id = result['participant_id']
                if p_id not in fused_scores:
                    fused_scores[p_id] = 0.0
                # Rank starts at 0, so we add 1 to match formula expectation (1-based rank)
                fused_scores[p_id] += 1.0 / (k + rank + 1)
        
        # Process both lists
        process_results(bm25_results)
        process_results(sbert_results)
        
        # Create result list
        results = []
        for p_id, score in fused_scores.items():
            results.append({
                "participant_id": p_id,
                "score": score,
                "rank": 0  # Will be set below
            })
            
        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Add final rank
        for i, result in enumerate(results):
            result['rank'] = i + 1
            
        return results

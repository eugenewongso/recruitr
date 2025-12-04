"""
Base Retriever Interface
Defines the contract that all retrievers must follow for swappability.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseRetriever(ABC):
    """
    Abstract base class for all retrieval methods.
    
    This ensures all retrievers have the same interface, making them
    easily swappable (BM25 → TF-IDF → Elasticsearch, etc.)
    """
    
    @abstractmethod
    def search(self, query: str, top_k: int = 50) -> List[Dict[str, Any]]:
        """
        Search for participants matching the query.
        
        Args:
            query: Search query string
            top_k: Number of results to return
            
        Returns:
            List of dicts with 'participant_id' and 'score' keys
            [
                {"participant_id": "uuid-123", "score": 0.95},
                {"participant_id": "uuid-456", "score": 0.87},
                ...
            ]
        """
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Return the name of this retriever (for logging/evaluation)."""
        pass






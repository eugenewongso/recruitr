"""
Information Retrieval Services.

This package contains the implementations of different retrieval algorithms
(BM25, SBERT, Hybrid) and the common interface they share.
"""

from .base_retriever import BaseRetriever
from .bm25_retriever import BM25Retriever
from .sbert_retriever import SBERTRetriever
from .hybrid_retriever import HybridRetriever

__all__ = [
    "BaseRetriever",
    "BM25Retriever", 
    "SBERTRetriever",
    "HybridRetriever"
]


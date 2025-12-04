"""
BM25 Retriever - Lexical keyword-based search.

Implements the Okapi BM25 algorithm for probabilistic keyword matching.
Good for: exact term matching, tool names, specific keywords.

References:
- BM25 Algorithm: https://en.wikipedia.org/wiki/Okapi_BM25
- rank-bm25 library: https://github.com/dorianbrown/rank_bm25
"""

from rank_bm25 import BM25Okapi
from typing import List, Dict, Any
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import logging

from .base_retriever import BaseRetriever

# Set up logging
logger = logging.getLogger(__name__)


class BM25Retriever(BaseRetriever):
    """
    BM25-based lexical search for participants.
    
    This implements the Okapi BM25 algorithm which ranks documents based on
    keyword occurrence, rarity (IDF), and document length.
    
    Attributes:
        participants: List of participant dictionaries from database
        corpus: List of searchable text documents (one per participant)
        tokenized_corpus: Tokenized version of corpus for BM25
        bm25: BM25Okapi instance for scoring
        stop_words: Set of common words to filter out
    """
    
    def __init__(
        self, 
        participants: List[Dict[str, Any]],
        k1: float = 1.5,
        b: float = 0.75,
        remove_stopwords: bool = True
    ):
        """
        Initialize BM25 retriever with participant corpus.
        
        Args:
            participants: List of participant dictionaries from database
            k1: BM25 term frequency saturation parameter (default 1.5)
            b: BM25 length normalization parameter (default 0.75)
            remove_stopwords: Whether to filter out common words
            
        Note:
            Default parameters (k1=1.5, b=0.75) work well for most use cases.
            Adjust if needed based on evaluation results.
        """
        self.participants = participants
        self.k1 = k1
        self.b = b
        self.remove_stopwords = remove_stopwords
        
        # Download NLTK data if needed
        self._ensure_nltk_data()
        
        # Get stopwords if filtering
        self.stop_words = set(stopwords.words('english')) if remove_stopwords else set()
        
        # Build the search index
        logger.info(f"Building BM25 index for {len(participants)} participants...")
        self.corpus = self._build_corpus()
        self.tokenized_corpus = self._tokenize_corpus()
        self.bm25 = BM25Okapi(self.tokenized_corpus)
        logger.info("BM25 index built successfully")
    
    def _ensure_nltk_data(self):
        """Download required NLTK data if not present."""
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            logger.info("Downloading NLTK data...")
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
    
    def _build_corpus(self) -> List[str]:
        """
        Build searchable documents from participant data.
        
        Combines relevant fields into a single searchable text string.
        
        Returns:
            List of document strings (one per participant)
        """
        corpus = []
        for participant in self.participants:
            doc = self._create_document(participant)
            corpus.append(doc)
        return corpus
    
    def _create_document(self, participant: Dict[str, Any]) -> str:
        """
        Create a searchable document from a single participant with field weighting.
        
        Combines: role, industry, company, tools, skills, description
        
        Field weights (by repetition):
        - Role: 3x (most important)
        - Tools: 2x (very important)
        - Skills: 1.5x (important)
        - Company/Industry: 1x (normal)
        - Description: 0.5x (less important)
        
        Args:
            participant: Participant dictionary
            
        Returns:
            Searchable text document with weighted fields
        """
        parts = []
        
        # Add role (3x weight - most important)
        if participant.get('role'):
            parts.extend([participant['role']] * 3)
        
        # Add industry and company (1x weight)
        if participant.get('industry'):
            parts.append(participant['industry'])
        if participant.get('company_name'):
            parts.append(participant['company_name'])
        
        # Add work type (1x weight)
        if participant.get('remote'):
            parts.append('remote')
        else:
            parts.append('onsite office')
        
        # Add tools (2x weight - very important for matching)
        if participant.get('tools'):
            parts.extend(participant['tools'] * 2)
        
        # Add skills (1.5x weight - important)
        if participant.get('skills'):
            skills = participant['skills']
            parts.extend(skills)
            # Add half of skills again for 1.5x total weight
            parts.extend(skills[:len(skills)//2 + 1])
        
        # Add description (0.5x weight - less important, naturally weighted lower due to length)
        if participant.get('description'):
            parts.append(participant['description'])
        
        # Combine into single document
        return ' '.join(str(part) for part in parts)
    
    def _tokenize_corpus(self) -> List[List[str]]:
        """
        Tokenize all documents in the corpus.
        
        Converts text into lowercase tokens, optionally removing stopwords.
        
        Returns:
            List of token lists (one per document)
        """
        tokenized = []
        for doc in self.corpus:
            tokens = self._tokenize_text(doc)
            tokenized.append(tokens)
        return tokenized
    
    def _tokenize_text(self, text: str) -> List[str]:
        """
        Tokenize a single text string.
        
        Args:
            text: Input text
            
        Returns:
            List of lowercase tokens
        """
        # Tokenize and lowercase
        tokens = word_tokenize(text.lower())
        
        # Remove stopwords if configured
        if self.remove_stopwords:
            tokens = [t for t in tokens if t not in self.stop_words and t.isalnum()]
        
        return tokens
    
    def search(self, query: str, top_k: int = 50, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Search for participants using BM25 with optional filtering.
        
        Args:
            query: Search query string (e.g., "Product Manager Figma remote")
            top_k: Number of results to return
            filters: Optional filters dict with keys:
                - remote (bool): Filter by remote/onsite
                - tools (list): Filter by required tools
                - role (str): Filter by role
                - min_team_size (int): Minimum team size
                - max_team_size (int): Maximum team size
                - company_size (list): Company size ranges
                - min_experience_years (int): Minimum years of experience
                - max_experience_years (int): Maximum years of experience
            
        Returns:
            List of dicts with participant_id and score:
            [
                {"participant_id": "uuid-123", "score": 2.45},
                {"participant_id": "uuid-456", "score": 1.87},
                ...
            ]
            
        Note:
            Scores are BM25 relevance scores (higher = better match).
            Typical range: 0-10, but can be higher for very relevant docs.
        """
        logger.debug(f"BM25 search query: '{query}'")
        
        # Tokenize query
        tokenized_query = self._tokenize_text(query)
        
        # Get BM25 scores for all documents
        scores = self.bm25.get_scores(tokenized_query)
        
        # Combine with participant IDs and sort
        results = []
        for i, score in enumerate(scores):
            if score > 0:  # Only include documents with non-zero scores
                results.append({
                    "participant_id": self.participants[i]['id'],
                    "score": float(score),
                    "rank": 0  # Will be set later
                })
        
        # Sort by score (descending)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Apply filters if provided
        if filters:
            results = self._apply_filters(results, filters)
        
        # Add ranks and limit to top_k
        for rank, result in enumerate(results[:top_k], start=1):
            result['rank'] = rank
        
        # Log results (handle empty results case)
        top_results = results[:top_k]
        if top_results:
            logger.info(f"BM25 returned {len(top_results)} results (top score: {top_results[0]['score']:.2f})")
        else:
            logger.info("BM25 returned 0 results (no matches found)")
        
        return top_results
    
    def _apply_filters(self, results: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Apply post-retrieval filters to results.
        
        Args:
            results: List of search results with participant_id
            filters: Dictionary of filter criteria
            
        Returns:
            Filtered list of results
        """
        # Create a mapping of participant_id to participant data for quick lookup
        participants_dict = {p['id']: p for p in self.participants}
        
        filtered_results = []
        for result in results:
            participant = participants_dict.get(result['participant_id'])
            if not participant:
                continue
            
            # Apply each filter
            if not self._matches_filters(participant, filters):
                continue
            
            filtered_results.append(result)
        
        return filtered_results
    
    def _matches_filters(self, participant: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """
        Check if a participant matches all filter criteria.
        
        Args:
            participant: Participant dictionary
            filters: Filter criteria
            
        Returns:
            True if participant matches all filters
        """
        # Remote filter
        if 'remote' in filters:
            if participant.get('remote') != filters['remote']:
                return False
        
        # Tools filter (participant must have all required tools)
        if 'tools' in filters and filters['tools']:
            participant_tools = participant.get('tools', [])
            if not participant_tools:
                return False
            # Check if participant has all required tools (case-insensitive)
            participant_tools_lower = [t.lower() for t in participant_tools]
            for required_tool in filters['tools']:
                if required_tool.lower() not in participant_tools_lower:
                    return False
        
        # Role filter (case-insensitive partial match)
        if 'role' in filters and filters['role']:
            participant_role = participant.get('role', '').lower()
            filter_role = filters['role'].lower()
            if filter_role not in participant_role and participant_role not in filter_role:
                return False
        
        # Team size filter
        if 'min_team_size' in filters:
            team_size = participant.get('team_size', 0)
            if team_size < filters['min_team_size']:
                return False
        
        if 'max_team_size' in filters:
            team_size = participant.get('team_size', 0)
            if team_size > filters['max_team_size']:
                return False
        
        # Company size filter
        if 'company_size' in filters and filters['company_size']:
            participant_size = participant.get('company_size')
            if participant_size not in filters['company_size']:
                return False
        
        # Experience years filter
        if 'min_experience_years' in filters:
            experience = participant.get('experience_years', 0)
            if experience < filters['min_experience_years']:
                return False
        
        if 'max_experience_years' in filters:
            experience = participant.get('experience_years', 0)
            if experience > filters['max_experience_years']:
                return False
        
        return True
    
    def get_name(self) -> str:
        """Return the name of this retriever."""
        return f"BM25 (k1={self.k1}, b={self.b})"
    
    def get_top_terms(self, query: str, top_n: int = 10) -> List[str]:
        """
        Get the most important query terms (for debugging/analysis).
        
        Args:
            query: Search query
            top_n: Number of terms to return
            
        Returns:
            List of important terms
        """
        tokens = self._tokenize_text(query)
        # In a full implementation, you'd calculate IDF scores here
        # For now, just return unique tokens
        return list(set(tokens))[:top_n]

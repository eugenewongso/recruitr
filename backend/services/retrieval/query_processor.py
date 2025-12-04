"""
Query Processor - Normalize and expand search queries.

Handles query preprocessing including normalization, synonym expansion,
and term extraction for improved search quality.
"""

import re
from typing import List, Dict, Any


class QueryProcessor:
    """
    Preprocesses search queries with normalization and synonym expansion.
    
    Example:
        Input: "Find WFH PMs using Figma"
        Output: {
            original_query: "Find WFH PMs using Figma",
            normalized_query: "find wfh pms using figma",
            expanded_query: "find remote work from home product manager pms using figma",
            terms: ["find", "remote", "work", "from", "home", "product", "manager", "pms", "using", "figma"]
        }
    """
    
    def __init__(self):
        """Initialize with synonym mappings."""
        # Synonym expansion mapping
        self.synonym_map = {
            # Roles
            "pm": "product manager",
            "pms": "product manager",
            "ux": "user experience",
            "ui": "user interface",
            "dev": "developer",
            "eng": "engineer",
            "qa": "quality assurance",
            "devops": "development operations",
            "swe": "software engineer",
            "fe": "frontend",
            "be": "backend",
            
            # Work arrangements
            "wfh": "remote work from home",
            "work from home": "remote",
            "remote work": "remote",
            "telecommute": "remote",
            
            # Experience
            "sr": "senior",
            "jr": "junior",
            "lead": "senior lead",
            
            # Tools (common abbreviations)
            "js": "javascript",
            "ts": "typescript",
            "k8s": "kubernetes",
            "aws": "amazon web services",
            "gcp": "google cloud platform",
        }
    
    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a search query with normalization and expansion.
        
        Args:
            query: Raw search query string
            
        Returns:
            Dictionary containing:
                - original_query: Unchanged input
                - normalized_query: Lowercased and cleaned
                - expanded_query: With synonyms expanded
                - terms: List of individual terms
        """
        # Normalize the query
        normalized = self._normalize_text(query)
        
        # Expand synonyms
        expanded = self._expand_synonyms(normalized)
        
        # Extract terms
        terms = self._extract_terms(expanded)
        
        return {
            "original_query": query,
            "normalized_query": normalized,
            "expanded_query": expanded,
            "terms": terms
        }
    
    def _normalize_text(self, text: str) -> str:
        """
        Normalize text: lowercase, trim, remove extra spaces.
        
        Args:
            text: Input text
            
        Returns:
            Normalized text
        """
        # Lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove special punctuation but keep hyphens and underscores
        text = re.sub(r'[^\w\s\-]', ' ', text)
        
        # Clean up extra spaces again
        text = ' '.join(text.split())
        
        return text
    
    def _expand_synonyms(self, text: str) -> str:
        """
        Expand synonyms and abbreviations in the text.
        
        Args:
            text: Normalized text
            
        Returns:
            Text with synonyms expanded
        """
        expanded_parts = []
        words = text.split()
        
        i = 0
        while i < len(words):
            word = words[i]
            
            # Check for multi-word phrases (e.g., "work from home")
            matched = False
            for phrase_len in range(min(4, len(words) - i), 0, -1):
                phrase = ' '.join(words[i:i+phrase_len])
                if phrase in self.synonym_map:
                    # Add both original and expanded
                    expanded_parts.append(phrase)
                    expanded_parts.append(self.synonym_map[phrase])
                    i += phrase_len
                    matched = True
                    break
            
            if not matched:
                # Check single word
                if word in self.synonym_map:
                    expanded_parts.append(word)
                    expanded_parts.append(self.synonym_map[word])
                else:
                    expanded_parts.append(word)
                i += 1
        
        return ' '.join(expanded_parts)
    
    def _extract_terms(self, text: str) -> List[str]:
        """
        Extract individual terms from text.
        
        Args:
            text: Processed text
            
        Returns:
            List of terms
        """
        # Split on whitespace and filter empty strings
        terms = [term for term in text.split() if term]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_terms = []
        for term in terms:
            if term not in seen:
                seen.add(term)
                unique_terms.append(term)
        
        return unique_terms


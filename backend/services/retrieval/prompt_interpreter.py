"""
Prompt Interpreter - Extract structured filters from natural language.

TODO: Implement query understanding to extract intents and filters.
"""

import re
from typing import Dict, List, Optional


class PromptInterpreter:
    """
    Extracts structured filters from natural language search queries.
    """
    
    def __init__(self):
        """
        Initialize with keyword mappings.
        
        TODO: Define keyword patterns for:
            - Roles (PM, engineer, designer)
            - Tools (Trello, Asana, etc.)
            - Work arrangement (remote, onsite)
            - Team size
            - Company size
        """
        self.role_keywords = []  # TODO: Add role keywords
        self.tool_keywords = []  # TODO: Add tool keywords
        
    def extract_intent(self, prompt: str) -> Dict:
        """
        Extract structured filters from natural language prompt.
        
        TODO:
            - Parse for remote/onsite indicators
            - Extract mentioned tools
            - Extract role keywords
            - Extract team size (regex for numbers)
            - Extract company size indicators
        
        Args:
            prompt: Natural language search query
            
        Returns:
            Dictionary with:
                - query: Original prompt (for semantic search)
                - filters: Structured filters
        
        Example:
            Input: "Find remote PMs using Trello who manage 5-10 people"
            Output: {
                "query": "Find remote PMs using Trello who manage 5-10 people",
                "filters": {
                    "remote": True,
                    "tools": ["Trello"],
                    "role": "Product Manager",
                    "min_team_size": 5,
                    "max_team_size": 10
                }
            }
        """
        # TODO: Implement prompt parsing
        pass
    
    def _extract_remote(self, prompt: str) -> Optional[bool]:
        """Extract remote/onsite preference."""
        # TODO: Check for "remote", "work from home", etc.
        pass
    
    def _extract_tools(self, prompt: str) -> List[str]:
        """Extract mentioned tools."""
        # TODO: Match against tool_keywords
        pass
    
    def _extract_team_size(self, prompt: str) -> Dict[str, Optional[int]]:
        """Extract team size range."""
        # TODO: Use regex to find patterns like "5-10 people", "team of 7"
        pass


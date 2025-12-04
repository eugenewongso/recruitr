"""
Prompt Interpreter - Extract structured filters from natural language.

Parses natural language search queries to extract structured filters
for remote work, tools, roles, team size, company size, and experience.
"""

import re
from typing import Dict, List, Optional


class PromptInterpreter:
    """
    Extracts structured filters from natural language search queries.
    
    Example:
        "Find remote PMs using Trello with 3-5 years experience"
        → {remote: True, tools: ["Trello"], role: "Product Manager", 
           min_experience_years: 3, max_experience_years: 5}
    """
    
    def __init__(self):
        """Initialize with keyword mappings for roles, tools, etc."""
        # Role abbreviations and mappings
        self.role_mapping = {
            "pm": "Product Manager",
            "pms": "Product Manager",
            "product manager": "Product Manager",
            "ux": "UX Designer",
            "ux designer": "UX Designer",
            "ui designer": "UI Designer",
            "designer": "UX Designer",
            "dev": "Software Engineer",
            "developer": "Software Engineer",
            "engineer": "Software Engineer",
            "software engineer": "Software Engineer",
            "em": "Engineering Manager",
            "eng manager": "Engineering Manager",
            "engineering manager": "Engineering Manager",
            "ds": "Data Scientist",
            "data scientist": "Data Scientist",
            "project manager": "Project Manager",
            "marketing manager": "Marketing Manager",
            "customer success manager": "Customer Success Manager",
            "sales manager": "Sales Manager",
            "frontend": "Frontend Engineer",
            "backend": "Backend Engineer",
            "fullstack": "Full Stack Engineer",
            "qa": "QA Engineer",
            "devops": "DevOps Engineer",
        }
        
        # Common tools and software
        self.tool_keywords = [
            "Trello", "Asana", "Jira", "Notion", "Monday.com", "ClickUp",
            "Slack", "Microsoft Teams", "Zoom", "Google Meet",
            "Figma", "Sketch", "Adobe XD", "InVision",
            "GitHub", "GitLab", "Bitbucket",
            "Salesforce", "HubSpot", "Intercom",
            "Google Analytics", "Mixpanel", "Amplitude",
            "Airtable", "Coda", "Confluence",
            "Docker", "Kubernetes", "AWS", "Azure", "GCP",
            "React", "Vue", "Angular", "Python", "JavaScript",
        ]
        
        # Company size patterns
        self.company_size_patterns = {
            "small": ["1-10", "10-50"],
            "medium": ["50-200", "200-500"],
            "large": ["500-1000", "1000+"],
            "startup": ["1-10", "10-50", "50-200"],
            "enterprise": ["500-1000", "1000+"],
        }
        
    def extract_intent(self, prompt: str) -> Dict:
        """
        Extract structured filters from natural language prompt.
        
        Args:
            prompt: Natural language search query
            
        Returns:
            Dictionary with:
                - query: Original prompt (for semantic search)
                - filters: Extracted structured filters
        """
        prompt_lower = prompt.lower()
        
        filters = {}
        
        # Extract remote preference
        remote = self._extract_remote(prompt_lower)
        if remote is not None:
            filters["remote"] = remote
        
        # Extract tools
        tools = self._extract_tools(prompt)
        if tools:
            filters["tools"] = tools
        
        # Extract role
        role = self._extract_role(prompt_lower)
        if role:
            filters["role"] = role
        
        # Extract team size
        team_size = self._extract_team_size(prompt_lower)
        if team_size.get("min") is not None:
            filters["min_team_size"] = team_size["min"]
        if team_size.get("max") is not None:
            filters["max_team_size"] = team_size["max"]
        
        # Extract company size
        company_sizes = self._extract_company_size(prompt_lower)
        if company_sizes:
            filters["company_size"] = company_sizes
        
        # Extract experience years
        experience = self._extract_experience_years(prompt_lower)
        if experience.get("min") is not None:
            filters["min_experience_years"] = experience["min"]
        if experience.get("max") is not None:
            filters["max_experience_years"] = experience["max"]
        
        return {
            "query": prompt,
            "filters": filters
        }
    
    def _extract_remote(self, prompt: str) -> Optional[bool]:
        """Extract remote/onsite preference."""
        remote_keywords = ["remote", "work from home", "wfh", "distributed", "telecommute"]
        onsite_keywords = ["onsite", "on-site", "office", "in-person", "on site"]
        
        has_remote = any(keyword in prompt for keyword in remote_keywords)
        has_onsite = any(keyword in prompt for keyword in onsite_keywords)
        
        if has_remote and not has_onsite:
            return True
        elif has_onsite and not has_remote:
            return False
        return None
    
    def _extract_tools(self, prompt: str) -> List[str]:
        """Extract mentioned tools (case-sensitive for proper nouns)."""
        found_tools = []
        for tool in self.tool_keywords:
            if tool.lower() in prompt.lower():
                found_tools.append(tool)
        return found_tools
    
    def _extract_role(self, prompt: str) -> Optional[str]:
        """Extract role with abbreviation support."""
        for keyword, role in self.role_mapping.items():
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, prompt):
                return role
        return None
    
    def _extract_team_size(self, prompt: str) -> Dict[str, Optional[int]]:
        """
        Extract team size range from patterns like:
        - "5-10 people"
        - "manage 7"
        - "team of 5"
        - "5 to 10 direct reports"
        """
        result = {"min": None, "max": None}
        
        # Pattern: "X-Y people/team/reports"
        range_match = re.search(r'(\d+)\s*-\s*(\d+)\s*(people|team|reports|direct)', prompt)
        if range_match:
            result["min"] = int(range_match.group(1))
            result["max"] = int(range_match.group(2))
            return result
        
        # Pattern: "X to Y people"
        to_match = re.search(r'(\d+)\s+to\s+(\d+)\s*(people|team|reports)', prompt)
        if to_match:
            result["min"] = int(to_match.group(1))
            result["max"] = int(to_match.group(2))
            return result
        
        # Pattern: "manage/lead X" or "team of X"
        single_match = re.search(r'(manage|lead|team of)\s+(\d+)', prompt)
        if single_match:
            size = int(single_match.group(2))
            result["min"] = size
            result["max"] = size
            return result
        
        return result
    
    def _extract_company_size(self, prompt: str) -> Optional[List[str]]:
        """Extract company size indicators."""
        for keyword, sizes in self.company_size_patterns.items():
            if keyword in prompt:
                return sizes
        
        # Also check for explicit size ranges like "50-200"
        size_match = re.search(r'company.*?(\d+)\s*-\s*(\d+)', prompt)
        if size_match:
            return [f"{size_match.group(1)}-{size_match.group(2)}"]
        
        return None
    
    def _extract_experience_years(self, prompt: str) -> Dict[str, Optional[int]]:
        """
        Extract experience years from patterns like:
        - "3-5 years"
        - "5+ years experience"
        - "with 3 years of experience"
        """
        result = {"min": None, "max": None}
        
        # Pattern: "X-Y years"
        range_match = re.search(r'(\d+)\s*-\s*(\d+)\s*years?', prompt)
        if range_match:
            result["min"] = int(range_match.group(1))
            result["max"] = int(range_match.group(2))
            return result
        
        # Pattern: "X+ years" or "X or more years"
        plus_match = re.search(r'(\d+)\s*\+?\s*(or more)?\s*years?', prompt)
        if plus_match:
            result["min"] = int(plus_match.group(1))
            return result
        
        # Pattern: "with X years"
        with_match = re.search(r'with\s+(\d+)\s*years?', prompt)
        if with_match:
            years = int(with_match.group(1))
            result["min"] = years
            result["max"] = years
            return result
        
        return result


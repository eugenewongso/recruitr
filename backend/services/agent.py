"""
AI Agent service for orchestrating research projects.
Uses LLM to understand user goals and execute search strategies.
"""

import json
import logging
from typing import Dict, List, Any

from services.gemini_helper import get_gemini_model

logger = logging.getLogger(__name__)


class ResearchAgent:
    """AI agent that helps users find research participants."""
    
    def __init__(self):
        """Initialize the research agent."""
        self.model = None
        logger.info("Research agent initialized")
    
    def _get_model(self):
        """Lazy load the Gemini model."""
        if self.model is None:
            self.model = get_gemini_model()
        return self.model
    
    async def parse_research_goal(self, goal: str) -> Dict[str, Any]:
        """
        Parse natural language research goal into structured strategy.
        
        Args:
            goal: User's research goal in natural language
            
        Returns:
            Dict containing project_name, description, search_queries, target_count, reasoning
            
        Raises:
            ValueError: If goal cannot be parsed or API is unavailable
        """
        try:
            model = self._get_model()
            
            prompt = self._build_goal_parsing_prompt(goal)
            response = model.generate_content(prompt)
            
            # Extract and parse JSON from response
            result = self._extract_json_from_response(response.text)
            
            # Validate required fields
            required_fields = ['project_name', 'description', 'search_queries', 'target_count']
            if not all(field in result for field in required_fields):
                raise ValueError(f"Missing required fields in AI response: {required_fields}")
            
            logger.info(f"Successfully parsed research goal: '{result['project_name']}'")
            return result
            
        except Exception as e:
            logger.error(f"Failed to parse research goal: {e}")
            raise ValueError(f"Unable to process research goal. Please try rephrasing. Error: {str(e)}")
    
    async def rank_participants(
        self,
        participants: List[Dict[str, Any]],
        goal: str,
        target_count: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Rank and filter participants based on relevance to research goal.
        
        Uses a composite scoring system:
        - Search relevance score (weighted 10x)
        - Profile completeness
        - Experience level
        - Skills diversity
        
        Args:
            participants: List of participant dictionaries from search
            goal: Original research goal for context
            target_count: Number of top participants to return
            
        Returns:
            Sorted list of top N participants
        """
        if not participants:
            return []
        
        try:
            # Score each participant
            scored = [(p, self._calculate_participant_score(p)) for p in participants]
            
            # Sort by score descending
            scored.sort(key=lambda x: x[1], reverse=True)
            
            # Return top N with original structure
            top_participants = [p for p, _ in scored[:target_count]]
            
            logger.info(
                f"Ranked {len(participants)} participants, returning top {len(top_participants)}"
            )
            return top_participants
            
        except Exception as e:
            logger.error(f"Error ranking participants: {e}")
            # Fallback: return first N participants
            return participants[:target_count]
    
    def _calculate_participant_score(self, participant: Dict[str, Any]) -> float:
        """
        Calculate composite score for a participant.
        
        Scoring factors:
        - Base search relevance (10x weight)
        - Bio completeness (+2)
        - Skills count (+0.5 per skill)
        - Experience years (+0.1 per year, max +2)
        - Has company (+1)
        """
        score = 0.0
        
        # Primary ranking: search relevance score
        score += participant.get('score', 0) * 10
        
        # Profile completeness bonus
        if participant.get('bio') and len(participant.get('bio', '')) > 20:
            score += 2
        
        # Skills diversity
        skills = participant.get('skills', [])
        if skills:
            score += len(skills) * 0.5
        
        # Experience level
        years = participant.get('experience_years', 0)
        if years > 0:
            score += min(years * 0.1, 2)  # Cap at +2
        
        # Company affiliation
        if participant.get('company'):
            score += 1
        
        return score
    
    async def generate_project_summary(
        self,
        project_name: str,
        goal: str,
        participants: List[Dict[str, Any]]
    ) -> str:
        """
        Generate a human-friendly summary of project results.
        
        Args:
            project_name: Name of the project
            goal: Original research goal
            participants: List of found participants
            
        Returns:
            Natural language summary message
        """
        count = len(participants)
        
        if count == 0:
            return (
                "No participants found matching your criteria. "
                "Try broadening your search or adjusting the goal."
            )
        
        # Extract insights from top participants
        roles = set()
        companies = set()
        
        for p in participants[:10]:
            if p.get('role'):
                roles.add(p['role'])
            if p.get('company'):
                companies.add(p['company'])
        
        # Build summary parts
        parts = [f"Found {count} participants"]
        
        if roles:
            role_list = ', '.join(list(roles)[:3])
            parts.append(f"including {role_list}")
        
        if companies:
            company_list = ', '.join(list(companies)[:3])
            parts.append(f"from companies like {company_list}")
        
        parts.append("Ranked by relevance to your research goal.")
        
        return ' '.join(parts)
    
    @staticmethod
    def _build_goal_parsing_prompt(goal: str) -> str:
        """Build the prompt for parsing research goals."""
        return f"""You are a UX research assistant helping researchers find study participants.

Given a research goal, generate a structured search strategy.

The participant database contains professionals with:
- Job titles, companies, roles
- Skills and tools
- Work experience
- Location and remote status
- Professional bio

Research goal: {goal}

Return a JSON object with this exact structure:
{{
  "project_name": "Concise project name (3-6 words)",
  "description": "Brief 1-2 sentence description",
  "search_queries": ["query1", "query2", "query3"],
  "target_count": 15,
  "reasoning": "Explanation of search strategy"
}}

Make search queries diverse to capture different aspects of the goal.
Use specific terms related to roles, skills, tools, and experience levels."""
    
    @staticmethod
    def _extract_json_from_response(response_text: str) -> Dict[str, Any]:
        """
        Extract JSON from LLM response, handling markdown code blocks.
        
        Args:
            response_text: Raw text from LLM
            
        Returns:
            Parsed JSON dictionary
            
        Raises:
            json.JSONDecodeError: If JSON is invalid
        """
        text = response_text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```json"):
            text = text.split("```json", 1)[1].split("```", 1)[0]
        elif text.startswith("```"):
            text = text.split("```", 1)[1].split("```", 1)[0]
        
        return json.loads(text.strip())


# Singleton instance management
_agent_instance = None


def get_agent() -> ResearchAgent:
    """
    Get or create the singleton agent instance.
    
    Returns:
        ResearchAgent instance
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = ResearchAgent()
    return _agent_instance

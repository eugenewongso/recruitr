"""
Recommendation Service - Personalized search query suggestions.

Analyzes user behavior (searches, saved participants, clicks) to generate
personalized search query suggestions. Falls back to generic defaults for new users.
"""

from typing import List, Dict, Any, Optional
import logging
from collections import Counter
from datetime import datetime
import random

from database import supabase

logger = logging.getLogger(__name__)


class RecommendationService:
    """
    Generates personalized search query suggestions based on user behavior.
    
    Uses pattern detection from:
    - Search history
    - Saved participants
    - Common attributes in user interactions
    
    Falls back to generic suggestions for new users.
    """
    
    # Minimum activity threshold for personalization
    MIN_SEARCHES = 3
    MIN_SAVED_PARTICIPANTS = 1
    
    # Query templates for generation
    QUERY_TEMPLATES = [
        "{remote} {role}",
        "{role} using {tool}",
        "{role} with {experience}+ years experience",
        "{role} at {company_size} companies",
        "{role} in {industry}",
        "{remote} {role} using {tool}",
        "{role} at {company_size} with {experience}+ years experience",
    ]
    
    # Default suggestions for new users (generic, diverse)
    DEFAULT_SUGGESTIONS = [
        "Remote professionals with 5+ years experience",
        "Managers at mid-size companies",
        "Specialists using Salesforce",
        "Recent graduates with relevant skills",
        "Project managers in consulting",
        "Analysts at startups",
    ]
    
    def __init__(self):
        """Initialize recommendation service."""
        pass
    
    def get_search_suggestions(
        self,
        user_id: str,
        limit: int = 4
    ) -> Dict[str, Any]:
        """
        Get personalized search query suggestions for a user.
        
        Args:
            user_id: User UUID
            limit: Number of suggestions to return
            
        Returns:
            Dict containing:
                - suggestions: List of query strings
                - is_personalized: Boolean indicating if personalized
                - based_on: Dict with activity counts
        """
        try:
            # Analyze user behavior
            behavior = self._analyze_user_behavior(user_id)
            
            # Check if we have enough data for personalization
            is_personalized = (
                behavior['search_count'] >= self.MIN_SEARCHES or
                behavior['saved_count'] >= self.MIN_SAVED_PARTICIPANTS
            )
            
            logger.info(
                f"🎯 Personalization decision: {is_personalized} "
                f"(searches: {behavior['search_count']}/{self.MIN_SEARCHES}, "
                f"saved: {behavior['saved_count']}/{self.MIN_SAVED_PARTICIPANTS})"
            )
            
            if is_personalized:
                # Extract patterns from behavior
                patterns = self._extract_patterns(behavior)
                
                # Generate personalized queries
                suggestions = self._generate_queries(patterns, limit * 2)
                
                # Return top N unique suggestions
                suggestions = list(dict.fromkeys(suggestions))[:limit]
            else:
                # Return default suggestions for new users
                suggestions = self.DEFAULT_SUGGESTIONS[:limit]
            
            logger.info(f"Generated {len(suggestions)} suggestions for user {user_id} (personalized: {is_personalized})")
            
            return {
                "suggestions": suggestions,
                "is_personalized": is_personalized,
                "based_on": {
                    "searches": behavior['search_count'],
                    "saved_participants": behavior['saved_count']
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate suggestions for user {user_id}: {e}")
            # Fallback to defaults on error
            return {
                "suggestions": self.DEFAULT_SUGGESTIONS[:limit],
                "is_personalized": False,
                "based_on": {
                    "searches": 0,
                    "saved_participants": 0
                }
            }
    
    def _analyze_user_behavior(self, user_id: str) -> Dict[str, Any]:
        """
        Analyze user's search history and saved participants.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dict containing behavior data:
                - search_count: Number of searches
                - saved_count: Number of saved participants
                - search_queries: List of past queries
                - saved_participants: List of saved participant data
        """
        try:
            logger.info(f"🔍 Analyzing behavior for user: {user_id}")
            
            # Fetch recent search history (last 20)
            search_response = supabase.table("search_history").select("*").eq(
                "user_id", user_id
            ).order("created_at", desc=True).limit(20).execute()
            
            searches = search_response.data or []
            logger.info(f"📊 Found {len(searches)} searches in history for user {user_id}")
            
            # Fetch saved participants with full participant data
            saved_response = supabase.table("saved_participants").select(
                "participant_id"
            ).eq("researcher_id", user_id).execute()
            
            saved_ids = [s['participant_id'] for s in (saved_response.data or [])]
            logger.info(f"💾 Found {len(saved_ids)} saved participants for user {user_id}")
            
            # Fetch full participant details for saved participants
            saved_participants = []
            if saved_ids:
                participants_response = supabase.table("participants").select("*").in_(
                    "id", saved_ids
                ).execute()
                saved_participants = participants_response.data or []
            
            # Debug: log first few search queries
            if searches:
                sample_queries = [s.get('query_text', 'N/A')[:50] for s in searches[:3]]
                logger.info(f"📝 Sample queries: {sample_queries}")
            
            behavior_data = {
                "search_count": len(searches),
                "saved_count": len(saved_participants),
                "search_queries": [s.get('query_text', '') for s in searches],  # Fixed: use query_text
                "saved_participants": saved_participants
            }
            
            logger.info(f"✅ Behavior analysis complete: {len(searches)} searches, {len(saved_participants)} saved")
            return behavior_data
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze behavior for user {user_id}: {e}", exc_info=True)
            return {
                "search_count": 0,
                "saved_count": 0,
                "search_queries": [],
                "saved_participants": []
            }
    
    def _extract_patterns(self, behavior: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract patterns from user behavior data.
        
        Args:
            behavior: User behavior data from _analyze_user_behavior
            
        Returns:
            Dict containing detected patterns:
                - top_roles: Most common roles
                - top_tools: Most common tools
                - remote_preference: remote, onsite, or None
                - experience_preference: experience level
                - company_size_preference: preferred company sizes
                - top_industries: Most common industries
        """
        saved_participants = behavior['saved_participants']
        search_queries = behavior['search_queries']
        
        # Extract roles from BOTH saved participants AND search queries
        roles = []
        
        # 1. Roles from saved participants (weight: 2x)
        for p in saved_participants:
            if p.get('role'):
                roles.append(p['role'])
                roles.append(p['role'])  # Add twice for 2x weight
        
        # 2. Roles mentioned in search queries (weight: 1x, but more diverse)
        role_keywords = {
            'product manager': 'Product Manager',
            'pm': 'Product Manager',
            'ux designer': 'UX Designer',
            'ux': 'UX Designer',
            'product designer': 'Product Designer',
            'software engineer': 'Software Engineer',
            'engineer': 'Software Engineer',
            'developer': 'Software Engineer',
            'data scientist': 'Data Scientist',
            'nurse': 'Nurse Practitioner',
            'medical': 'Medical Director',
            'healthcare': 'Healthcare Administrator',
            'teacher': 'Academic Advisor',
            'analyst': 'Business Analyst',
            'accountant': 'Accountant',
            'financial': 'Financial Analyst',
            'marketing': 'Marketing Manager',
            'sales': 'Sales Manager',
            'manager': 'Operations Manager',
        }
        
        for query in search_queries:
            query_lower = query.lower()
            for keyword, role in role_keywords.items():
                if keyword in query_lower:
                    roles.append(role)
        
        role_counter = Counter(roles)
        logger.info(f"🎭 Role analysis: {dict(role_counter.most_common(5))}")
        
        # Count tools (flatten lists)
        tools = []
        for p in saved_participants:
            if p.get('tools') and isinstance(p['tools'], list):
                tools.extend(p['tools'])
        tool_counter = Counter(tools)
        
        # Analyze remote preference
        remote_count = sum(1 for p in saved_participants if p.get('remote'))
        onsite_count = len(saved_participants) - remote_count
        remote_preference = None
        if len(saved_participants) > 0:
            if remote_count > onsite_count * 1.5:  # Strong remote preference
                remote_preference = "remote"
            elif onsite_count > remote_count * 1.5:  # Strong onsite preference
                remote_preference = "onsite"
        
        # Experience level preference
        experience_levels = [p.get('experience_years', 0) for p in saved_participants if p.get('experience_years')]
        avg_experience = sum(experience_levels) / len(experience_levels) if experience_levels else 0
        experience_preference = None
        if avg_experience >= 7:
            experience_preference = "7"
        elif avg_experience >= 5:
            experience_preference = "5"
        elif avg_experience >= 3:
            experience_preference = "3"
        
        # Company size preference
        company_sizes = [p.get('company_size') for p in saved_participants if p.get('company_size')]
        company_size_counter = Counter(company_sizes)
        
        # Industry preference
        industries = [p.get('industry') for p in saved_participants if p.get('industry')]
        industry_counter = Counter(industries)
        
        return {
            "top_roles": [role for role, _ in role_counter.most_common(3)],
            "top_tools": [tool for tool, _ in tool_counter.most_common(3)],
            "remote_preference": remote_preference,
            "experience_preference": experience_preference,
            "company_size_preference": [size for size, _ in company_size_counter.most_common(2)],
            "top_industries": [ind for ind, _ in industry_counter.most_common(2)]
        }
    
    def _generate_queries(self, patterns: Dict[str, Any], count: int = 8) -> List[str]:
        """
        Generate search queries based on extracted patterns.
        
        Args:
            patterns: Patterns from _extract_patterns
            count: Number of queries to generate
            
        Returns:
            List of generated query strings
        """
        queries = []
        
        # Helper to map company size to readable format
        def format_company_size(size: str) -> str:
            size_map = {
                "1-10": "startup",
                "10-50": "small",
                "50-200": "mid-size",
                "200-500": "mid-size",
                "500-1000": "large",
                "1000+": "enterprise"
            }
            return size_map.get(size, "mid-size")
        
        # Generate diverse queries - max 2 per role for variety
        template_options = ['remote', 'tool', 'experience', 'size', 'industry']
        # Shuffle template order for variety
        random.shuffle(template_options)
        
        for idx, role in enumerate(patterns['top_roles'][:4]):  # Max 4 roles
            if not role:
                continue
            
            # Pick 1-2 different template types per role (use shuffled order)
            for offset in range(2):
                template_type = template_options[(idx + offset) % len(template_options)]
                query = None
                
                if template_type == 'remote' and patterns.get('remote_preference'):
                    query = f"{patterns['remote_preference'].capitalize()} {role}"
                elif template_type == 'tool' and patterns.get('top_tools'):
                    # Rotate through different tools
                    tool_idx = (idx + offset) % len(patterns['top_tools'])
                    query = f"{role} using {patterns['top_tools'][tool_idx]}"
                elif template_type == 'experience' and patterns.get('experience_preference'):
                    query = f"{role} with {patterns['experience_preference']}+ years experience"
                elif template_type == 'size' and patterns.get('company_size_preference'):
                    size = format_company_size(patterns['company_size_preference'][0])
                    query = f"{role} at {size} companies"
                elif template_type == 'industry' and patterns.get('top_industries'):
                    # Rotate through different industries
                    industry_idx = (idx + offset) % len(patterns['top_industries'])
                    query = f"{role} in {patterns['top_industries'][industry_idx]}"
                else:
                    query = role  # Fallback to just the role
                
                if query and query not in queries:
                    queries.append(query)
        
        # If we don't have enough queries, add some generic ones
        if len(queries) < count:
            generic = [
                "Experienced professionals with leadership skills",
                "Mid-level specialists at growing companies",
                "Remote workers with strong communication skills",
                "Managers with 5+ years experience"
            ]
            queries.extend(generic)
        
        # Shuffle queries for variety on each request
        random.shuffle(queries)
        
        final_queries = queries[:count]
        logger.info(f"🎯 Generated {len(final_queries)} diverse queries from {len(patterns['top_roles'])} roles (shuffled for variety)")
        return final_queries


# Global instance
_recommendation_service = None

def get_recommendation_service() -> RecommendationService:
    """
    Get or create the global recommendation service instance.
    
    Returns:
        RecommendationService instance
    """
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
    return _recommendation_service


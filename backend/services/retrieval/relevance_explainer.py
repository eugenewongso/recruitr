"""
Relevance Explainer - Generate human-readable match explanations.

Explains why a participant matches the search query by highlighting
matched fields and criteria.
"""

from typing import List, Dict, Any, Optional


class RelevanceExplainer:
    """
    Generates explanations for why participants match search queries.
    
    Provides human-readable reasons highlighting matched fields,
    tools, skills, and other criteria.
    """
    
    def explain_match(
        self,
        participant: Dict[str, Any],
        original_query: str,
        filters: Optional[Dict[str, Any]] = None,
        query_terms: Optional[List[str]] = None
    ) -> List[str]:
        """
        Generate a list of reasons why this participant matches the query.
        
        Args:
            participant: Participant dictionary
            original_query: Original search query string
            filters: Applied filters dictionary
            query_terms: List of query terms (optional)
            
        Returns:
            List of match reason strings (max 5 most relevant)
            
        Example:
            ["Role: Product Manager", "Uses Trello, Figma", "Remote worker", 
             "Skills: UX Design, Python", "5 years of experience"]
        """
        reasons = []
        
        # Role match
        if participant.get('role'):
            reasons.append(f"Role: {participant['role']}")
        
        # Tool matches
        tools = participant.get('tools', [])
        if tools:
            # If filters specified tools, highlight those
            if filters and 'tools' in filters and filters['tools']:
                matched_tools = [t for t in tools if t in filters['tools']]
                if matched_tools:
                    reasons.append(f"Uses {', '.join(matched_tools)}")
            # Otherwise check if any tools mentioned in query
            elif query_terms:
                matched_tools = [t for t in tools if t.lower() in [term.lower() for term in query_terms]]
                if matched_tools:
                    reasons.append(f"Uses {', '.join(matched_tools[:3])}")
            # Or just show some tools
            elif len(tools) > 0:
                reasons.append(f"Uses {', '.join(tools[:3])}")
        
        # Remote status
        if participant.get('remote'):
            reasons.append("Remote worker")
        
        # Skills match
        skills = participant.get('skills', [])
        if skills and query_terms:
            # Find skills that match query terms
            matched_skills = [s for s in skills if any(term.lower() in s.lower() for term in query_terms)]
            if matched_skills:
                reasons.append(f"Skills: {', '.join(matched_skills[:3])}")
            elif len(skills) > 0:
                reasons.append(f"Skills: {', '.join(skills[:3])}")
        elif skills:
            reasons.append(f"Skills: {', '.join(skills[:3])}")
        
        # Company match
        if participant.get('company_name'):
            # Check if company mentioned in query
            if query_terms and any(term.lower() in participant['company_name'].lower() for term in query_terms):
                reasons.append(f"Works at {participant['company_name']}")
        
        # Experience
        experience = participant.get('experience_years')
        if experience:
            reasons.append(f"{experience} years of experience")
        
        # Team size (if it matches filters)
        if filters and 'min_team_size' in filters:
            team_size = participant.get('team_size')
            if team_size:
                reasons.append(f"Manages team of {team_size}")
        
        # Company size (if relevant)
        if filters and 'company_size' in filters:
            company_size = participant.get('company_size')
            if company_size and company_size in filters['company_size']:
                reasons.append(f"Company size: {company_size}")
        
        # Location match (if mentioned in query)
        if participant.get('location') and query_terms:
            location = participant['location']
            if any(term.lower() in location.lower() for term in query_terms):
                reasons.append(f"Location: {location}")
        
        # Limit to top 5 most relevant reasons
        return reasons[:5]
    
    def explain_batch(
        self,
        results: List[Dict[str, Any]],
        original_query: str,
        filters: Optional[Dict[str, Any]] = None,
        query_terms: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Add match explanations to a batch of search results.
        
        Args:
            results: List of result dictionaries with 'participant' key
            original_query: Original search query
            filters: Applied filters
            query_terms: Query terms
            
        Returns:
            Results with added 'match_reasons' field
        """
        enriched = []
        for result in results:
            participant = result.get('participant', {})
            match_reasons = self.explain_match(
                participant, original_query, filters, query_terms
            )
            enriched.append({
                **result,
                'match_reasons': match_reasons
            })
        return enriched


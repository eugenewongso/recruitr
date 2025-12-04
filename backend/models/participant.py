"""
Participant data models.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class Participant(BaseModel):
    """Participant profile model."""
    id: str
    name: str
    email: Optional[EmailStr] = None
    
    # Professional info
    role: str
    industry: Optional[str] = None
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    
    # Work details
    remote: bool = False
    team_size: Optional[int] = None
    experience_years: Optional[int] = None
    
    # Skills & tools
    tools: List[str] = []
    skills: List[str] = []
    
    # Searchable description
    description: Optional[str] = None
    
    # Account linking (Phase 2)
    user_id: Optional[str] = None
    is_synthetic: bool = True
    accepting_interviews: bool = True
    
    # Metadata
    created_at: datetime
    updated_at: datetime


class ParticipantWithScore(Participant):
    """Participant with search relevance score."""
    relevance_score: float
    match_reasons: List[str] = []


class ParticipantCreate(BaseModel):
    """Create participant request."""
    name: str
    email: Optional[EmailStr] = None
    role: str
    industry: Optional[str] = None
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    remote: bool = False
    team_size: Optional[int] = None
    experience_years: Optional[int] = None
    tools: List[str] = []
    skills: List[str] = []
    description: Optional[str] = None


class ParticipantUpdate(BaseModel):
    """Update participant request."""
    name: Optional[str] = None
    role: Optional[str] = None
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    remote: Optional[bool] = None
    team_size: Optional[int] = None
    experience_years: Optional[int] = None
    tools: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    description: Optional[str] = None
    accepting_interviews: Optional[bool] = None


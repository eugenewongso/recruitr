"""
User and authentication models.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role types."""
    RESEARCHER = "researcher"
    PARTICIPANT = "participant"


class UserProfile(BaseModel):
    """User profile model."""
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    
    # Researcher fields
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    
    # Participant linking (Phase 2)
    participant_profile_id: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True


class SignupRequest(BaseModel):
    """Signup request model."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.RESEARCHER
    
    # Researcher fields
    company_name: Optional[str] = None
    job_title: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response model."""
    user: UserProfile
    access_token: str
    refresh_token: Optional[str] = None


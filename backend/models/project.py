"""
Project models for AI-assisted research projects.
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class CreateProjectRequest(BaseModel):
    """Request to create a new project with natural language goal."""
    goal: str  # Natural language description of research goal
    name: Optional[str] = None  # Optional project name


class ProjectStrategy(BaseModel):
    """AI-generated strategy for finding participants."""
    search_queries: List[str]
    filters: Optional[Dict[str, Any]] = None
    target_count: int = 15
    reasoning: str  # Why the AI chose this strategy


class Project(BaseModel):
    """Project model."""
    id: str
    user_id: str
    name: str
    description: str
    goal: str
    status: str  # draft, in_progress, completed, archived
    ai_generated_strategy: Optional[Dict[str, Any]] = None
    participant_ids: List[str] = []
    participants: List[Dict[str, Any]] = []
    search_queries: List[str] = []
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class ProjectListResponse(BaseModel):
    """Response for listing projects."""
    projects: List[Project]
    count: int


class UpdateProjectRequest(BaseModel):
    """Request to update a project."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    participant_ids: Optional[List[str]] = None
    participants: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None


class AgentResponse(BaseModel):
    """Response from the AI agent after creating a project."""
    project_id: str
    project_name: str
    strategy: ProjectStrategy
    participants: List[Dict[str, Any]]
    total_found: int
    message: str


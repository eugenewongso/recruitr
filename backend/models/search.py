"""
Search request and response models.
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from .participant import ParticipantWithScore


class SearchFilters(BaseModel):
    """Optional structured filters for search."""
    remote: Optional[bool] = None
    tools: Optional[List[str]] = None
    role: Optional[str] = None
    min_team_size: Optional[int] = None
    max_team_size: Optional[int] = None
    company_size: Optional[str] = None
    min_experience: Optional[int] = None


class SearchRequest(BaseModel):
    """Search participants request."""
    query: str
    top_k: Optional[int] = 50  # Number of results to return (max results to fetch)
    page: Optional[int] = 1  # Page number (1-indexed)
    limit: Optional[int] = 20  # Results per page
    filters: Optional[Dict[str, Any]] = None  # Optional filters


class SearchResponse(BaseModel):
    """Search results response."""
    query: str
    count: int  # Number of results in this page
    total_count: int  # Total number of results available
    results: List[Dict[str, Any]]  # Results with participant data
    retrieval_time_ms: float  # Time taken in milliseconds
    method: str  # Retrieval method used (BM25, SBERT, Hybrid)
    filters: Optional[Dict[str, Any]] = None
    page: int  # Current page number
    limit: int  # Results per page
    total_pages: int  # Total number of pages


class SearchHistory(BaseModel):
    """Saved search record."""
    id: str
    researcher_id: str
    query: str
    filters: Optional[Dict[str, Any]] = None
    results_count: int
    created_at: datetime


class LogSearchRequest(BaseModel):
    """Request to log a search to history."""
    query_text: str
    filters: Optional[Dict[str, Any]] = None
    search_type: str = "hybrid"
    results_count: int = 0
    top_result_ids: Optional[List[str]] = None


class SearchHistoryItem(BaseModel):
    """Search history item response."""
    id: str
    user_id: str
    query_text: str
    filters: Optional[Dict[str, Any]] = None
    search_type: str
    results_count: int
    top_result_ids: Optional[List[str]] = None
    created_at: str


class SearchHistoryResponse(BaseModel):
    """Search history list response."""
    history: List[SearchHistoryItem]
    count: int
    total_count: int = 0
    page: int = 1
    limit: int = 50
    total_pages: int = 1


class GenerateOutreachRequest(BaseModel):
    """Request to generate outreach message."""
    participant_id: str
    project_name: str
    project_description: str
    tone: str = "friendly"  # friendly, professional, casual
    length: str = "medium"  # short, medium, long


class GenerateOutreachResponse(BaseModel):
    """Generated outreach message response."""
    message: str
    participant: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None


class GenerateQuestionsRequest(BaseModel):
    """Request to generate interview questions."""
    participant_id: str
    project_type: str
    research_goals: List[str]
    num_questions: int = 10


class InterviewQuestion(BaseModel):
    """Single interview question."""
    question: str
    category: str
    follow_up: Optional[str] = None


class GenerateQuestionsResponse(BaseModel):
    """Generated questions response."""
    questions: List[InterviewQuestion]
    participant: Dict[str, Any]


class ExportRequest(BaseModel):
    """Export participants request."""
    search_id: Optional[str] = None
    participant_ids: Optional[List[str]] = None
    format: str = "csv"  # csv, json, xlsx
    fields: Optional[List[str]] = None


class SaveParticipantRequest(BaseModel):
    """Request to save a participant."""
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class GenerateOutreachRequest(BaseModel):
    """Request model for generating outreach emails"""
    participant_ids: List[str]


class GeneratedEmail(BaseModel):
    """Response model for a generated outreach email"""
    subject: str
    body: str
    participant_name: str


class GenerateOutreachResponse(BaseModel):
    """Response model for bulk outreach generation"""
    emails: List[GeneratedEmail]
    count: int


class SaveDraftRequest(BaseModel):
    """Request model for saving an outreach draft"""
    name: str
    participant_ids: List[str]
    participants: List[Dict[str, Any]]
    generated_emails: Optional[List[GeneratedEmail]] = None


class OutreachDraft(BaseModel):
    """Outreach draft model"""
    id: str
    user_id: str
    name: str
    participant_ids: List[str]
    participants: List[Dict[str, Any]]
    generated_emails: Optional[List[GeneratedEmail]] = None
    created_at: str
    updated_at: str


class DraftListResponse(BaseModel):
    """Response model for listing drafts"""
    drafts: List[OutreachDraft]
    count: int


class CreateNotificationRequest(BaseModel):
    """Request model for creating a notification"""
    title: str
    message: str
    type: str = "info"  # info, success, alert, warning
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None


class Notification(BaseModel):
    """Notification model"""
    id: str
    user_id: str
    title: str
    message: str
    type: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    read: bool
    created_at: str
    read_at: Optional[str] = None


class NotificationsResponse(BaseModel):
    """Response model for listing notifications"""
    notifications: List[Notification]
    count: int
    unread_count: int


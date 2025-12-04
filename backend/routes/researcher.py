"""
Researcher API routes.

Endpoints for researcher-specific functionality.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
import logging

from models.search import (
    SearchRequest,
    SearchResponse,
    GenerateOutreachRequest,
    GenerateOutreachResponse,
    SaveParticipantRequest,
    SaveDraftRequest,
    OutreachDraft,
    DraftListResponse,
    LogSearchRequest,
    SearchHistoryResponse,
    CreateNotificationRequest,
    Notification,
    NotificationsResponse
)
from datetime import datetime, timedelta
from services.researcher.search_service import get_search_service
from database import supabase
from middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search_participants(
    request: SearchRequest,
    user = Depends(get_current_user)
):
    """
    Search for participants using natural language.
    Protected route: Requires valid auth token.
    """
    try:
        logger.info(f"Search request by {user.id}: '{request.query}'")
        
        # Get search service
        search_service = get_search_service()
        
        # Perform search (fetch all results up to top_k)
        search_results = search_service.search(
            query=request.query,
            top_k=request.top_k or 50,
            filters=request.filters
        )
        
        # Apply pagination
        page = request.page or 1
        limit = request.limit or 20
        total_results = search_results['count']
        
        # Calculate pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_results = search_results['results'][start_index:end_index]
        total_pages = (total_results + limit - 1) // limit  # Ceiling division
        
        # Format response with pagination metadata
        response = SearchResponse(
            query=search_results['query'],
            results=paginated_results,
            count=len(paginated_results),
            total_count=total_results,
            retrieval_time_ms=search_results['retrieval_time_ms'],
            method=search_results['method'],
            filters=request.filters,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
        logger.info(f"Search successful: {total_results} total results, returning page {page} ({len(paginated_results)} results)")
        return response
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/participant/{participant_id}")
async def get_participant(participant_id: str):
    """
    Get a single participant by ID.
    
    Args:
        participant_id: UUID of the participant
        
    Returns:
        Full participant data
    """
    try:
        search_service = get_search_service()
        participant = search_service.get_participant_by_id(participant_id)
        
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Participant {participant_id} not found"
            )
        
        return participant
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get participant: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/searches/log")
async def log_search(
    request: LogSearchRequest,
    user = Depends(get_current_user)
):
    """
    Log a search to history.
    Protected route.
    """
    try:
        logger.info(f"💾 Logging search for user: {user.id}, query: '{request.query_text}'")
        
        result = supabase.table("search_history").insert({
            "user_id": user.id,
            "query_text": request.query_text,
            "filters": request.filters or {},
            "search_type": request.search_type,
            "results_count": request.results_count,
            "top_result_ids": request.top_result_ids or [],
        }).execute()
        
        logger.info(f"✅ Search logged with ID: {result.data[0]['id']}")
        return {"message": "Search logged successfully", "id": result.data[0]["id"]}
    except Exception as e:
        logger.error(f"Failed to log search: {e}")
        # Don't fail the search if logging fails
        return {"message": "Search logging failed", "error": str(e)}


@router.get("/searches", response_model=SearchHistoryResponse)
async def get_search_history(
    page: int = 1,
    limit: int = 50,
    user = Depends(get_current_user)
):
    """
    Get search history for current user.
    Protected route.
    """
    try:
        logger.info(f"📥 Fetching search history for user: {user.id}, page: {page}, limit: {limit}")
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get total count
        count_result = supabase.table("search_history") \
            .select("id", count="exact") \
            .eq("user_id", user.id) \
            .execute()
        
        total_count = count_result.count or 0
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        
        # Get paginated data
        result = supabase.table("search_history") \
            .select("*") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        logger.info(f"📊 Found {len(result.data)} search history items")
        if len(result.data) == 0 and total_count > 0:
             logger.warning(f"⚠️ No results for user {user.id} on page {page}, but total count is {total_count}")
        
        return SearchHistoryResponse(
            history=result.data,
            count=len(result.data),
            total_count=total_count,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error(f"Failed to fetch search history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch search history: {str(e)}"
        )


@router.delete("/searches/{search_id}")
async def delete_search_history(
    search_id: str,
    user = Depends(get_current_user)
):
    """
    Delete a specific search from history.
    Protected route.
    """
    try:
        supabase.table("search_history") \
            .delete() \
            .eq("id", search_id) \
            .eq("user_id", user.id) \
            .execute()
        
        return {"message": "Search deleted from history"}
    except Exception as e:
        logger.error(f"Failed to delete search: {e}")
    raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete search: {str(e)}"
    )


@router.post("/save/{participant_id}")
async def save_participant(
    participant_id: str, 
    request: Optional[SaveParticipantRequest] = None,
    user = Depends(get_current_user)
):
    """
    Save/bookmark a participant.
    Protected route.
    """
    try:
        researcher_id = user.id
        
        # Check if already saved
        existing = supabase.table("saved_participants").select("*")\
            .eq("researcher_id", researcher_id)\
            .eq("participant_id", participant_id)\
            .execute()
            
        if existing.data:
            return {"message": "Participant already saved"}

        data = {
            "researcher_id": researcher_id,
            "participant_id": participant_id,
            "notes": request.notes if request else None,
            "tags": request.tags if request else None
        }
        supabase.table("saved_participants").insert(data).execute()
        return {"message": "Participant saved successfully"}
    except Exception as e:
        logger.error(f"Save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/save/{participant_id}")
async def unsave_participant(
    participant_id: str, 
    user = Depends(get_current_user)
):
    """
    Remove participant from saved.
    Protected route.
    """
    try:
        researcher_id = user.id
        
        supabase.table("saved_participants").delete()\
            .eq("researcher_id", researcher_id)\
            .eq("participant_id", participant_id)\
            .execute()
        return {"message": "Participant removed from saved"}
    except Exception as e:
        logger.error(f"Unsave failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved")
async def get_saved_participants(user = Depends(get_current_user)):
    """
    Get all saved participants for current user.
    Protected route.
    """
    try:
        researcher_id = user.id
        
        # Fetch saved participants with their details
        # Note: Join syntax depends on Supabase Python client version
        # Simple join:
        response = supabase.table("saved_participants")\
            .select("*, participants(*)")\
            .eq("researcher_id", researcher_id)\
            .execute()
            
        return response.data
    except Exception as e:
        logger.error(f"Get saved failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-outreach", response_model=GenerateOutreachResponse)
async def generate_outreach(
    request: GenerateOutreachRequest,
    user = Depends(get_current_user)
):
    """
    Generate AI-powered outreach emails for selected participants.
    
    Uses OpenAI GPT-4 to create personalized recruitment emails based on
    participant profiles and researcher context.
    """
    try:
        from services.researcher.outreach_service import OutreachService
        
        # Get researcher profile for personalization
        researcher_profile = supabase.table("profiles") \
            .select("full_name, company_name") \
            .eq("id", user.id) \
            .single() \
            .execute()
        
        researcher_name = researcher_profile.data.get("full_name", "Researcher")
        researcher_company = researcher_profile.data.get("company_name")
        
        # Fetch participant details
        participants_data = []
        for participant_id in request.participant_ids:
            result = supabase.table("participants") \
                .select("*") \
                .eq("id", participant_id) \
                .single() \
                .execute()
            
            if result.data:
                participants_data.append(result.data)
        
        if not participants_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No valid participants found"
            )
        
        # Generate outreach emails
        outreach_service = OutreachService()
        emails = await outreach_service.generate_bulk_outreach(
            participants=participants_data,
            researcher_name=researcher_name,
            researcher_company=researcher_company,
        )
        
        return GenerateOutreachResponse(
            emails=emails,
            count=len(emails)
        )
        
    except ValueError as e:
        # Gemini API key not configured
        logger.error(f"Gemini configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please add GEMINI_API_KEY to your .env file."
        )
    except Exception as e:
        logger.error(f"Error generating outreach: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate outreach emails: {str(e)}"
        )


@router.post("/drafts", response_model=OutreachDraft)
async def save_draft(
    request: SaveDraftRequest,
    user = Depends(get_current_user)
):
    """
    Save an outreach draft with participants and optionally generated emails.
    """
    try:
        result = supabase.table("outreach_drafts").insert({
            "user_id": user.id,
            "name": request.name,
            "participant_ids": request.participant_ids,
            "participants": [p for p in request.participants],
            "generated_emails": [e.dict() for e in request.generated_emails] if request.generated_emails else None,
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Error saving draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save draft: {str(e)}"
        )


@router.get("/drafts", response_model=DraftListResponse)
async def get_drafts(user = Depends(get_current_user)):
    """
    Get all outreach drafts for the current user.
    """
    try:
        result = supabase.table("outreach_drafts") \
            .select("*") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True) \
            .execute()
        
        return DraftListResponse(
            drafts=result.data,
            count=len(result.data)
        )
    except Exception as e:
        logger.error(f"Error fetching drafts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch drafts: {str(e)}"
        )


@router.get("/drafts/{draft_id}", response_model=OutreachDraft)
async def get_draft(
    draft_id: str,
    user = Depends(get_current_user)
):
    """
    Get a specific draft by ID.
    """
    try:
        result = supabase.table("outreach_drafts") \
            .select("*") \
            .eq("id", draft_id) \
            .eq("user_id", user.id) \
            .single() \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Draft not found"
            )
        
        return result.data
    except Exception as e:
        logger.error(f"Error fetching draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch draft: {str(e)}"
        )


@router.put("/drafts/{draft_id}", response_model=OutreachDraft)
async def update_draft(
    draft_id: str,
    request: SaveDraftRequest,
    user = Depends(get_current_user)
):
    """
    Update an existing draft.
    """
    try:
        result = supabase.table("outreach_drafts") \
            .update({
                "name": request.name,
                "participant_ids": request.participant_ids,
                "participants": [p for p in request.participants],
                "generated_emails": [e.dict() for e in request.generated_emails] if request.generated_emails else None,
            }) \
            .eq("id", draft_id) \
            .eq("user_id", user.id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Draft not found"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update draft: {str(e)}"
        )


@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: str,
    user = Depends(get_current_user)
):
    """
    Delete a draft.
    """
    try:
        supabase.table("outreach_drafts") \
            .delete() \
            .eq("id", draft_id) \
            .eq("user_id", user.id) \
            .execute()
        
        return {"message": "Draft deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete draft: {str(e)}"
    )


@router.post("/generate-questions")
async def generate_questions():
    """
    Generate AI-suggested interview questions.
    
    TODO: Call LLM service to generate questions
    """
    # TODO: Implement question generation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Generate questions not yet implemented"
    )


@router.get("/notifications", response_model=NotificationsResponse)
async def get_notifications(
    limit: int = 50,
    unread_only: bool = False,
    user = Depends(get_current_user)
):
    """
    Get notifications for the current user.
    Protected route.
    """
    try:
        query = supabase.table("notifications") \
            .select("*") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True)
        
        if unread_only:
            query = query.eq("read", False)
        
        query = query.limit(limit)
        result = query.execute()
        
        # Count unread notifications
        unread_result = supabase.table("notifications") \
            .select("id", count="exact") \
            .eq("user_id", user.id) \
            .eq("read", False) \
            .execute()
        
        return NotificationsResponse(
            notifications=result.data,
            count=len(result.data),
            unread_count=unread_result.count or 0
        )
    except Exception as e:
        logger.error(f"Failed to fetch notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notifications: {str(e)}"
        )


@router.post("/notifications", response_model=Notification)
async def create_notification(
    request: CreateNotificationRequest,
    user = Depends(get_current_user)
):
    """
    Create a notification for the current user.
    Protected route.
    """
    try:
        result = supabase.table("notifications").insert({
            "user_id": user.id,
            "title": request.title,
            "message": request.message,
            "type": request.type,
            "related_entity_type": request.related_entity_type,
            "related_entity_id": request.related_entity_id,
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create notification: {str(e)}"
        )


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user = Depends(get_current_user)
):
    """
    Mark a notification as read.
    Protected route.
    """
    try:
        result = supabase.table("notifications") \
            .update({
                "read": True,
                "read_at": datetime.now().isoformat()
            }) \
            .eq("id", notification_id) \
            .eq("user_id", user.id) \
            .execute()
        
        return {"message": "Notification marked as read"}
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(user = Depends(get_current_user)):
    """
    Mark all notifications as read for the current user.
    Protected route.
    """
    try:
        supabase.table("notifications") \
            .update({
                "read": True,
                "read_at": datetime.now().isoformat()
            }) \
            .eq("user_id", user.id) \
            .eq("read", False) \
            .execute()
        
        return {"message": "All notifications marked as read"}
    except Exception as e:
        logger.error(f"Failed to mark all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark all notifications as read: {str(e)}"
        )


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    user = Depends(get_current_user)
):
    """
    Delete a notification.
    Protected route.
    """
    try:
        supabase.table("notifications") \
            .delete() \
            .eq("id", notification_id) \
            .eq("user_id", user.id) \
            .execute()
        
        return {"message": "Notification deleted"}
    except Exception as e:
        logger.error(f"Failed to delete notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete notification: {str(e)}"
        )


@router.get("/profile")
async def get_profile(user = Depends(get_current_user)):
    """
    Get current user's profile.
    Protected route.
    """
    try:
        result = supabase.table("profiles") \
            .select("*") \
            .eq("id", user.id) \
            .single() \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}"
        )


@router.put("/profile")
async def update_profile(
    profile_data: dict,
    user = Depends(get_current_user)
):
    """
    Update current user's profile.
    Protected route.
    """
    try:
        # Only allow updating specific fields
        allowed_fields = ["full_name", "company_name", "job_title"]
        update_data = {
            key: value for key, value in profile_data.items() 
            if key in allowed_fields
        }
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now().isoformat()
        
        result = supabase.table("profiles") \
            .update(update_data) \
            .eq("id", user.id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.get("/analytics")
async def get_analytics(user = Depends(get_current_user)):
    """
    Get analytics data for the current user.
    Protected route.
    """
    try:
        user_id = user.id
        
        # Calculate date ranges
        now = datetime.now()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        # Total searches (all time)
        total_searches_result = supabase.table("search_history") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .execute()
        total_searches = total_searches_result.count or 0
        
        # Searches this month
        searches_this_month_result = supabase.table("search_history") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .gte("created_at", thirty_days_ago.isoformat()) \
            .execute()
        searches_this_month = searches_this_month_result.count or 0
        
        # Recent searches (last 7 days)
        recent_searches_result = supabase.table("search_history") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .gte("created_at", seven_days_ago.isoformat()) \
            .execute()
        recent_searches = recent_searches_result.count or 0
        
        # Total saved participants
        saved_participants_result = supabase.table("saved_participants") \
            .select("id", count="exact") \
            .eq("researcher_id", user_id) \
            .execute()
        saved_participants = saved_participants_result.count or 0
        
        # Get search history for analysis
        search_history = supabase.table("search_history") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(100) \
            .execute()
        
        # Calculate high quality matches (results with > 5 results)
        high_quality_matches = sum(
            1 for search in search_history.data 
            if search.get("results_count", 0) >= 5
        )
        
        # Get activity data by day for the last 30 days
        activity_by_day = {}
        for search in search_history.data:
            created_at = datetime.fromisoformat(search["created_at"].replace("Z", "+00:00"))
            date_key = created_at.strftime("%Y-%m-%d")
            activity_by_day[date_key] = activity_by_day.get(date_key, 0) + 1
        
        # Most active day of week
        day_of_week_counts = {}
        for search in search_history.data:
            created_at = datetime.fromisoformat(search["created_at"].replace("Z", "+00:00"))
            day_name = created_at.strftime("%A")
            day_of_week_counts[day_name] = day_of_week_counts.get(day_name, 0) + 1
        
        most_active_day = max(day_of_week_counts.items(), key=lambda x: x[1])[0] if day_of_week_counts else "N/A"
        
        # Average matches per search
        total_results = sum(search.get("results_count", 0) for search in search_history.data)
        avg_matches = round(total_results / len(search_history.data), 1) if search_history.data else 0
        
        # Analyze most searched terms (simple keyword extraction)
        from collections import Counter
        all_queries = [search.get("query_text", "") for search in search_history.data]
        
        # Extract roles (simple heuristic - look for common role keywords)
        role_keywords = ["product manager", "designer", "developer", "engineer", "manager", 
                        "analyst", "researcher", "marketer", "sales", "recruiter"]
        role_mentions = Counter()
        for query in all_queries:
            query_lower = query.lower()
            for role in role_keywords:
                if role in query_lower:
                    role_mentions[role] += 1
        
        most_searched_role = role_mentions.most_common(1)[0][0].title() if role_mentions else "N/A"
        
        # Extract tool mentions
        tool_keywords = ["figma", "sketch", "adobe", "notion", "jira", "slack", 
                        "trello", "asana", "miro", "invision"]
        tool_mentions = Counter()
        for query in all_queries:
            query_lower = query.lower()
            for tool in tool_keywords:
                if tool in query_lower:
                    tool_mentions[tool] += 1
        
        most_used_tool_filter = tool_mentions.most_common(1)[0][0].title() if tool_mentions else "N/A"
        
        return {
            "stats": {
                "total_searches": total_searches,
                "searches_this_month": searches_this_month,
                "recent_searches": recent_searches,
                "saved_participants": saved_participants,
                "high_quality_matches": high_quality_matches,
            },
            "insights": {
                "most_active_day": most_active_day,
                "avg_matches_per_search": avg_matches,
                "most_searched_role": most_searched_role,
                "most_used_tool_filter": most_used_tool_filter,
            },
            "activity_data": [
                {"date": date, "count": count}
                for date, count in sorted(activity_by_day.items())
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics: {str(e)}"
        )

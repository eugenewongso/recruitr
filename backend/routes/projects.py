"""
Projects API routes - AI-assisted research projects.
Allows researchers to create projects using natural language goals.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from middleware.auth import get_current_user
from database import supabase
from models.project import (
    CreateProjectRequest,
    Project,
    ProjectListResponse,
    UpdateProjectRequest,
    AgentResponse,
    ProjectStrategy
)
from services.agent import get_agent
from services.researcher.search_service import get_search_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/projects", response_model=AgentResponse)
async def create_project_with_agent(
    request: CreateProjectRequest,
    user = Depends(get_current_user)
):
    """
    Create a new research project using AI agent.
    
    The agent will:
    1. Parse the natural language goal
    2. Generate targeted search queries
    3. Execute searches to find candidates
    4. Rank and select top participants
    5. Create the project with results
    
    Returns:
        AgentResponse with project details, strategy, and participants
    """
    try:
        logger.info(f"Creating AI project for user {user.id}")
        
        # Step 1: Parse research goal with AI
        agent = get_agent()
        strategy_data = await agent.parse_research_goal(request.goal)
        
        project_name = request.name or strategy_data.get("project_name", "Research Project")
        description = strategy_data.get("description", request.goal)
        search_queries = strategy_data.get("search_queries", [request.goal])
        target_count = strategy_data.get("target_count", 15)
        reasoning = strategy_data.get("reasoning", "")
        
        logger.info(f"Generated strategy with {len(search_queries)} queries")
        
        # Step 2: Execute searches and collect candidates
        search_service = get_search_service()
        all_participants = []
        seen_ids = set()
        
        for query in search_queries:
            try:
                search_response = search_service.search(
                    query=query,
                    top_k=50,  # Get more candidates per query
                    filters=None
                )
                
                # Extract and deduplicate participants
                results = search_response.get('results', [])
                
                for result in results:
                    participant_data = result.get('participant', {})
                    participant_id = participant_data.get('id')
                    
                    if participant_id and participant_id not in seen_ids:
                        seen_ids.add(participant_id)
                        all_participants.append({
                            **participant_data,
                            'score': result.get('score', 0)
                        })
                
            except Exception as e:
                logger.warning(f"Search failed for query '{query}': {e}")
                continue
        
        logger.info(f"Found {len(all_participants)} unique participants")
        
        # Step 3: Rank and filter to top candidates
        top_participants = await agent.rank_participants(
            all_participants,
            request.goal,
            target_count
        )
        
        # Step 4: Generate human-friendly summary
        summary = await agent.generate_project_summary(
            project_name,
            request.goal,
            top_participants
        )
        
        # Step 5: Save project to database
        project_data = {
            "user_id": user.id,
            "name": project_name,
            "description": description,
            "goal": request.goal,
            "status": "draft",
            "ai_generated_strategy": {
                "search_queries": search_queries,
                "target_count": target_count,
                "reasoning": reasoning
            },
            "participant_ids": [p.get('id') for p in top_participants if p.get('id')],
            "participants": top_participants,
            "search_queries": search_queries
        }
        
        result = supabase.table("projects").insert(project_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project"
            )
        
        project = result.data[0]
        logger.info(f"Created project {project['id']} with {len(top_participants)} participants")
        
        # Return structured response
        return AgentResponse(
            project_id=project['id'],
            project_name=project_name,
            strategy=ProjectStrategy(
                search_queries=search_queries,
                target_count=target_count,
                reasoning=reasoning
            ),
            participants=top_participants,
            total_found=len(all_participants),
            message=summary
        )
        
    except ValueError as e:
        # User-facing errors (e.g., invalid goal, API issues)
        logger.error(f"Agent error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected errors
        logger.error(f"Failed to create project: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project. Please try again."
        )


@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(user = Depends(get_current_user)):
    """
    Get all projects for the current user.
    
    Returns:
        List of projects ordered by creation date (newest first)
    """
    try:
        result = supabase.table("projects") \
            .select("*") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True) \
            .execute()
        
        return ProjectListResponse(
            projects=result.data,
            count=len(result.data)
        )
        
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve projects"
        )


@router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, user = Depends(get_current_user)):
    """
    Get a specific project by ID.
    
    Args:
        project_id: UUID of the project
        
    Returns:
        Project details including strategy and participants
    """
    try:
        result = supabase.table("projects") \
            .select("*") \
            .eq("id", project_id) \
            .eq("user_id", user.id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project"
        )


@router.patch("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    request: UpdateProjectRequest,
    user = Depends(get_current_user)
):
    """
    Update project fields.
    
    Args:
        project_id: UUID of the project
        request: Fields to update (only non-None fields are updated)
        
    Returns:
        Updated project
    """
    try:
        # Build update data from non-None fields
        update_data = {}
        for field in ['name', 'description', 'status', 'participant_ids', 'participants', 'notes']:
            value = getattr(request, field, None)
            if value is not None:
                update_data[field] = value
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = supabase.table("projects") \
            .update(update_data) \
            .eq("id", project_id) \
            .eq("user_id", user.id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user = Depends(get_current_user)):
    """
    Delete a project.
    
    Args:
        project_id: UUID of the project
        
    Returns:
        Success message
    """
    try:
        result = supabase.table("projects") \
            .delete() \
            .eq("id", project_id) \
            .eq("user_id", user.id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project"
        )

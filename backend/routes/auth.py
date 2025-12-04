"""
Authentication routes.

TODO: Implement authentication endpoints using Supabase Auth.
"""

from fastapi import APIRouter, HTTPException, status
from models.user import SignupRequest, LoginRequest, AuthResponse

router = APIRouter()


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    Create a new user account.
    
    TODO:
        - Call Supabase auth.sign_up()
        - Create profile in profiles table
        - Return user and tokens
    
    Args:
        request: SignupRequest with email, password, role, etc.
        
    Returns:
        AuthResponse with user profile and tokens
    """
    # TODO: Implement signup with Supabase
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Signup not yet implemented"
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Sign in to existing account.
    
    TODO:
        - Call Supabase auth.sign_in_with_password()
        - Get user profile from profiles table
        - Return user and tokens
    
    Args:
        request: LoginRequest with email and password
        
    Returns:
        AuthResponse with user profile and tokens
    """
    # TODO: Implement login with Supabase
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login not yet implemented"
    )


@router.post("/logout")
async def logout():
    """
    Sign out current user.
    
    TODO: Call Supabase auth.sign_out()
    """
    # TODO: Implement logout
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Logout not yet implemented"
    )


@router.post("/refresh")
async def refresh_token():
    """
    Refresh access token.
    
    TODO: Call Supabase auth.refresh_session()
    """
    # TODO: Implement token refresh
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token not yet implemented"
    )


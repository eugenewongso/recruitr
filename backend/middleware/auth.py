"""
Authentication Middleware.

Verifies JWT tokens from Supabase Auth.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client, create_client
from config import settings

# Define the security scheme
security = HTTPBearer()

# Initialize a separate Supabase client for auth verification if needed,
# or reuse the global one. Here we create a fresh one or reuse.
# Note: We use the service key to initialize the client, but we verify the *user's* token.
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify the JWT token and return the user object.
    
    This function:
    1. Extracts the Bearer token from the Authorization header.
    2. Calls Supabase Auth to verify the token is valid and not expired.
    3. Returns the user object if valid.
    """
    token = credentials.credentials
    
    try:
        # Verify the token by getting the user details
        # This validates the signature and expiration
        response = supabase.auth.get_user(token)
        
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return response.user

    except Exception as e:
        # Log the error for debugging (optional)
        # print(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


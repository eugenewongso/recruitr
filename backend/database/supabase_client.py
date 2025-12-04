"""
Supabase client initialization and helper functions.
"""

from supabase import create_client, Client
from config import settings
from typing import Optional

# Global Supabase client instance
_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """
    Get or create Supabase client instance.
    
    Returns:
        Client: Supabase client
    """
    global _supabase_client
    
    if _supabase_client is None:
        _supabase_client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_key
        )
    
    return _supabase_client


def get_supabase_client() -> Client:
    """Alias for get_supabase() for consistency."""
    return get_supabase()


# Initialize client on module import
supabase: Client = get_supabase()


"""
Configuration management for Recruitr backend.
Loads environment variables and provides application settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "Recruitr"
    environment: str = "development"
    api_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"
    
    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: Optional[str] = None
    
    # LLM APIs (Optional)
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    
    # IR Algorithm Parameters
    bm25_k1: float = 1.5
    bm25_b: float = 0.75
    rrf_k: int = 60
    retrieval_top_k: int = 50
    results_limit: int = 10
    
    # Sentence-BERT Model
    sbert_model: str = "all-MiniLM-L6-v2"
    
    # Security
    jwt_secret: Optional[str] = None
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:3002"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()


"""
Recruitr Backend - FastAPI Application
Main entry point for the Recruitr API server.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Google Gemini globally
if settings.gemini_api_key:
    try:
        genai.configure(api_key=settings.gemini_api_key)
        logger.info("✅ Google Gemini API configured globally")
    except Exception as e:
        logger.error(f"❌ Failed to configure Google Gemini: {e}")
else:
    logger.warning("⚠️ GEMINI_API_KEY not found. AI features will be disabled.")

# Import routes (will be implemented)
# from routes import auth, researcher, participant

app = FastAPI(
    title="Recruitr API",
    description="AI-Assisted Participant Finder for User Research",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "Welcome to Recruitr API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.environment
    }


# Include routers
from routes import researcher, projects

app.include_router(researcher.router, prefix="/researcher", tags=["Researcher"])
app.include_router(projects.router, prefix="/researcher", tags=["Projects"])
# app.include_router(auth.router, prefix="/auth", tags=["Authentication"])  # TODO
# app.include_router(participant.router, prefix="/participant", tags=["Participant"])  # Phase 2


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )


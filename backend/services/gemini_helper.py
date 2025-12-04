"""
Shared helper for Google Gemini API initialization.
Provides a clean, reusable way to get Gemini models.
"""

import logging
import google.generativeai as genai
from typing import Optional

logger = logging.getLogger(__name__)

# List of models to try in order of preference
AVAILABLE_MODELS = [
    'gemini-2.0-flash-exp',      # Latest experimental (fastest)
    'gemini-1.5-flash-latest',   # Latest stable flash
    'gemini-1.5-flash',          # Stable flash
    'gemini-1.5-pro',            # More capable
]


def get_gemini_model(model_name: Optional[str] = None) -> genai.GenerativeModel:
    """
    Get a Gemini model instance, trying fallbacks if needed.
    
    Args:
        model_name: Specific model to use, or None to auto-detect
        
    Returns:
        GenerativeModel instance
        
    Raises:
        ValueError: If no compatible model is found
    """
    models_to_try = [model_name] if model_name else AVAILABLE_MODELS
    
    for name in models_to_try:
        if not name:
            continue
            
        try:
            model = genai.GenerativeModel(name)
            logger.debug(f"✅ Loaded Gemini model: {name}")
            return model
        except Exception as e:
            logger.debug(f"Model {name} not available: {e}")
            continue
    
    raise ValueError(
        f"No compatible Gemini model found. Tried: {', '.join(filter(None, models_to_try))}"
    )


"""
Outreach Email Generation Service using Google Gemini.
Generates personalized recruitment emails for research participants.
"""

import logging
from typing import List, Dict, Optional
import google.generativeai as genai

from services.gemini_helper import get_gemini_model

logger = logging.getLogger(__name__)


class OutreachService:
    """Service for generating personalized outreach emails using AI."""
    
    def __init__(self):
        """Initialize the outreach service."""
        self.model = None
        logger.info("Outreach service initialized")
    
    def _get_model(self):
        """Lazy load the Gemini model."""
        if self.model is None:
            self.model = get_gemini_model()
        return self.model
    
    async def generate_outreach_email(
        self,
        participant_name: str,
        participant_role: str,
        participant_company: Optional[str],
        participant_description: Optional[str],
        researcher_name: str,
        researcher_company: Optional[str],
    ) -> Dict[str, str]:
        """
        Generate a personalized outreach email for a participant.
        
        Args:
            participant_name: Name of the participant
            participant_role: Job role of the participant
            participant_company: Company name (optional)
            participant_description: Brief description of participant (optional)
            researcher_name: Name of the researcher
            researcher_company: Researcher's company/organization (optional)
        
        Returns:
            Dictionary with 'subject', 'body', and 'participant_name' keys
        """
        try:
            model = self._get_model()
            
            # Generate email body
            body_prompt = self._build_email_body_prompt(
                participant_name,
                participant_role,
                participant_company,
                participant_description,
                researcher_name,
                researcher_company,
            )
            
            body_response = model.generate_content(
                body_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=500,
                )
            )
            
            email_body = body_response.text.strip()
            
            # Generate subject line
            subject_prompt = self._build_subject_line_prompt(
                participant_name,
                participant_role,
            )
            
            subject_response = model.generate_content(
                subject_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.6,
                    max_output_tokens=50,
                )
            )
            
            subject = subject_response.text.strip().strip('"\'').strip()
            
            # Format complete email
            complete_body = self._format_email(
                participant_name,
                email_body,
                researcher_name,
            )
            
            return {
                "subject": subject,
                "body": complete_body,
                "participant_name": participant_name,
            }
            
        except Exception as e:
            logger.error(f"AI email generation failed: {e}")
            return self._generate_fallback_email(
                participant_name,
                participant_role,
                participant_company,
                researcher_name,
            )
    
    async def generate_bulk_outreach(
        self,
        participants: List[Dict],
        researcher_name: str,
        researcher_company: Optional[str],
    ) -> List[Dict[str, str]]:
        """
        Generate outreach emails for multiple participants.
        
        Args:
            participants: List of participant dictionaries with keys:
                - name, role, company_name (optional), description (optional)
            researcher_name: Name of the researcher
            researcher_company: Researcher's company/organization (optional)
        
        Returns:
            List of email dictionaries with 'subject', 'body', 'participant_name' keys
        """
        emails = []
        
        for participant in participants:
            email = await self.generate_outreach_email(
                participant_name=participant.get("name"),
                participant_role=participant.get("role"),
                participant_company=participant.get("company_name"),
                participant_description=participant.get("description"),
                researcher_name=researcher_name,
                researcher_company=researcher_company,
            )
            emails.append(email)
        
        return emails
    
    @staticmethod
    def _build_email_body_prompt(
        participant_name: str,
        participant_role: str,
        participant_company: Optional[str],
        participant_description: Optional[str],
        researcher_name: str,
        researcher_company: Optional[str],
    ) -> str:
        """Build the prompt for generating email body."""
        # Build participant context
        participant_context = f"{participant_name} is a {participant_role}"
        if participant_company:
            participant_context += f" at {participant_company}"
        if participant_description:
            participant_context += f". {participant_description}"
        
        # Build researcher context
        researcher_context = researcher_name
        if researcher_company:
            researcher_context += f" from {researcher_company}"
        
        return f"""You are an expert UX researcher who writes compelling, personalized recruitment emails.

Participant Details:
{participant_context}

Researcher: {researcher_context}

Requirements:
- Write in first person from the researcher's perspective
- Be professional but friendly and approachable
- Explain why their specific experience is valuable
- Mention that compensation will be provided
- Keep it concise (150-200 words)
- Request a 30-45 minute interview
- Include a clear call to action

Generate ONLY the email body. Do not include a subject line, greeting, or signature."""
    
    @staticmethod
    def _build_subject_line_prompt(
        participant_name: str,
        participant_role: str,
    ) -> str:
        """Build the prompt for generating subject line."""
        return f"""You are an expert at writing effective email subject lines.

Generate a compelling email subject line for a UX research recruitment email to {participant_name}, a {participant_role}.

Requirements:
- Professional tone
- Clear about the purpose (user research invitation)
- Mention compensation
- Under 70 characters
- Generate ONLY the subject line text, no quotes or extra formatting"""
    
    @staticmethod
    def _format_email(
        participant_name: str,
        email_body: str,
        researcher_name: str,
    ) -> str:
        """Format the complete email with greeting and signature."""
        first_name = participant_name.split()[0]
        greeting = f"Hi {first_name},"
        signature = f"\n\nBest regards,\n{researcher_name}"
        return f"{greeting}\n\n{email_body}{signature}"
    
    @staticmethod
    def _generate_fallback_email(
        participant_name: str,
        participant_role: str,
        participant_company: Optional[str],
        researcher_name: str,
    ) -> Dict[str, str]:
        """
        Generate a template-based email if AI generation fails.
        
        Returns:
            Dictionary with subject and body
        """
        first_name = participant_name.split()[0]
        company_text = f" at {participant_company}" if participant_company else ""
        
        subject = (
            f"Invitation to participate in UX research - "
            f"{participant_role} insights needed"
        )
        
        body = f"""Hi {first_name},

I came across your profile and was impressed by your experience as a {participant_role}{company_text}.

We're currently conducting user research and would love to get your insights. Your expertise in {participant_role.lower()} would be invaluable to our project.

Would you be available for a 30-45 minute virtual interview? We offer compensation for your time and participation.

Looking forward to hearing from you!

Best regards,
{researcher_name}"""
        
        return {
            "subject": subject,
            "body": body,
            "participant_name": participant_name,
        }

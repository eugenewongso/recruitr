"""
Generate synthetic participant data for Recruitr.
Creates realistic participant profiles and uploads them to Supabase.
"""

import json
import random
from typing import List, Dict
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentence_transformers import SentenceTransformer
from database import supabase
from config import settings


# Sample data for generation
FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery",
    "Quinn", "Cameron", "Skyler", "Emerson", "Dakota", "Rowan", "Sage", "River"
]

LAST_NAMES = [
    "Chen", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Martinez",
    "Rodriguez", "Davis", "Miller", "Anderson", "Taylor", "Thomas", "Lee", "Patel"
]

ROLES = [
    # Tech
    "Product Manager",
    "Software Engineer",
    "UX Designer",
    "Product Designer",
    "Engineering Manager",
    "Data Scientist",
    "Project Manager",
    # Business
    "Account Manager",
    "Operations Manager",
    "Business Analyst",
    "Strategy Consultant",
    # Marketing & Sales
    "Marketing Manager",
    "Content Marketing Manager",
    "Sales Manager",
    "Customer Success Manager",
    "Brand Manager",
    # Healthcare
    "Nurse Practitioner",
    "Medical Director",
    "Clinical Coordinator",
    "Healthcare Administrator",
    # Education
    "Curriculum Developer",
    "Academic Advisor",
    "Program Director",
    "Instructional Designer",
    # Finance
    "Financial Analyst",
    "Accountant",
    "Investment Manager",
    "Finance Manager",
    # Non-Profit
    "Program Manager",
    "Grant Writer",
    "Community Organizer",
    "Development Director",
    # Creative
    "Content Creator",
    "Copywriter",
    "Brand Strategist",
    "Creative Director",
    # Retail & Supply Chain
    "Store Manager",
    "Merchandiser",
    "Supply Chain Coordinator",
    "Inventory Manager"
]

INDUSTRIES = [
    "SaaS",
    "E-commerce",
    "Fintech",
    "Healthcare",
    "Education",
    "Enterprise Software",
    "Consumer Apps",
    "Marketing Tech",
    "Developer Tools",
    "Productivity",
    "Consulting",
    "Non-Profit",
    "Retail",
    "Manufacturing",
    "Real Estate",
    "Media & Publishing",
    "Hospitality",
    "Financial Services",
    "Pharmaceuticals",
    "Telecommunications"
]

COMPANY_SIZES = ["1-10", "10-50", "50-200", "200-500", "500-1000", "1000+"]

TOOLS = [
    # Project Management
    "Trello", "Asana", "Jira", "Notion", "Monday.com", "ClickUp",
    # Communication
    "Slack", "Microsoft Teams", "Zoom", "Google Meet",
    # Design
    "Figma", "Sketch", "Adobe XD", "InVision", "Canva",
    # Development
    "GitHub", "GitLab", "Bitbucket",
    # CRM & Marketing
    "Salesforce", "HubSpot", "Intercom", "Mailchimp", "Marketo",
    # Analytics
    "Google Analytics", "Mixpanel", "Amplitude", "Tableau", "Power BI",
    # Document & Collaboration
    "Airtable", "Coda", "Confluence", "Google Workspace", "Microsoft Office",
    # Finance & Accounting
    "QuickBooks", "Xero", "SAP", "Oracle Financials",
    # Healthcare Specific
    "Epic", "Cerner", "MEDITECH",
    # Education Specific
    "Canvas", "Blackboard", "Moodle", "Google Classroom",
    # HR & Recruiting
    "Workday", "BambooHR", "Greenhouse", "Lever",
    # E-commerce & Retail
    "Shopify", "WooCommerce", "Square", "NetSuite"
]

SKILLS = [
    # Tech & Product
    "Product Strategy", "Roadmap Planning", "User Research", "Data Analysis",
    "Project Management", "Agile/Scrum", "UX Design", "UI Design",
    "Prototyping", "A/B Testing", "SQL", "Python", "JavaScript",
    # Leadership & Soft Skills
    "Leadership", "Communication", "Stakeholder Management", "Team Building",
    "Conflict Resolution", "Change Management",
    # Business & Strategy
    "Strategic Planning", "Business Development", "Market Research", "Competitive Analysis",
    "Financial Modeling", "Budget Management", "Process Improvement",
    # Marketing & Creative
    "Content Strategy", "SEO/SEM", "Social Media Marketing", "Brand Development",
    "Copywriting", "Graphic Design", "Video Production",
    # Sales & Customer Success
    "Sales Strategy", "Negotiation", "Account Management", "Customer Retention",
    "Relationship Building",
    # Healthcare
    "Patient Care", "Clinical Research", "Healthcare Compliance", "Medical Terminology",
    # Education
    "Curriculum Design", "Educational Technology", "Assessment Development",
    # Finance
    "Financial Analysis", "Accounting", "Tax Planning", "Audit", "Risk Management",
    # Operations
    "Supply Chain Management", "Inventory Control", "Quality Assurance", "Logistics"
]


def generate_participant(index: int) -> Dict:
    """Generate a single synthetic participant profile."""
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    name = f"{first_name} {last_name}"
    
    role = random.choice(ROLES)
    industry = random.choice(INDUSTRIES)
    company_size = random.choice(COMPANY_SIZES)
    remote = random.choice([True, False, True])  # 66% chance of remote
    team_size = random.randint(2, 50)
    experience_years = random.randint(1, 15)
    
    # Select 3-6 tools with role-specific common tools
    # Ensure common tools like Slack are more frequently included
    common_tools = ["Slack", "Zoom", "Google Meet"]
    role_specific_tools = {
        "UX Designer": ["Figma", "Sketch", "Adobe XD", "InVision"],
        "Product Designer": ["Figma", "Sketch", "Adobe XD", "InVision"],
        "Product Manager": ["Trello", "Asana", "Jira", "Notion"],
        "Software Engineer": ["GitHub", "GitLab", "Jira"],
        "Engineering Manager": ["Jira", "GitHub", "GitLab"],
        "Data Scientist": ["Python", "Jupyter", "SQL"],
        "Marketing Manager": ["HubSpot", "Google Analytics", "Salesforce"],
        "Sales Manager": ["Salesforce", "HubSpot", "Intercom"],
    }
    
    # Start with 1-2 common communication tools
    selected_tools = random.sample(common_tools, k=random.randint(1, 2))
    
    # Add 1-2 role-specific tools if available
    if role in role_specific_tools:
        selected_tools.extend(random.sample(role_specific_tools[role], k=min(2, len(role_specific_tools[role]))))
    
    # Add 1-3 more random tools from the full list
    remaining_tools = [t for t in TOOLS if t not in selected_tools]
    selected_tools.extend(random.sample(remaining_tools, k=random.randint(1, min(3, len(remaining_tools)))))
    
    # Select 3-5 skills
    selected_skills = random.sample(SKILLS, k=random.randint(3, 5))
    
    # Generate email
    email = f"{first_name.lower()}.{last_name.lower()}{index}@example.com"
    
    # Generate company name
    company_suffix = random.choice(["Tech", "Labs", "Inc", "Software", "Systems", "Solutions"])
    company_name = f"{random.choice(['Build', 'Create', 'Smart', 'Fast', 'Quick', 'Pro'])}{company_suffix}"
    
    # Generate description
    work_location = "remotely" if remote else "in-office"
    description = (
        f"{role} at {company_name}, a {industry.lower()} company with {company_size} employees. "
        f"Works {work_location} and manages a team of {team_size} people. "
        f"{experience_years} years of experience in the field. "
        f"Uses {', '.join(selected_tools[:3])} for daily work. "
        f"Specializes in {', '.join(selected_skills[:3])}."
    )
    
    return {
        "name": name,
        "email": email,
        "role": role,
        "industry": industry,
        "company_name": company_name,
        "company_size": company_size,
        "remote": remote,
        "team_size": team_size,
        "experience_years": experience_years,
        "tools": selected_tools,
        "skills": selected_skills,
        "description": description,
        "is_synthetic": True
    }


def generate_embeddings(descriptions: List[str]) -> List[List[float]]:
    """Generate Sentence-BERT embeddings for descriptions."""
    print(f"Loading Sentence-BERT model: {settings.sbert_model}")
    model = SentenceTransformer(settings.sbert_model)
    
    print("Generating embeddings...")
    embeddings = model.encode(descriptions, show_progress_bar=True)
    
    return embeddings.tolist()


def upload_to_supabase(participants: List[Dict]):
    """Upload participants to Supabase."""
    print(f"\nUploading {len(participants)} participants to Supabase...")
    
    try:
        # Insert in batches of 50
        batch_size = 50
        for i in range(0, len(participants), batch_size):
            batch = participants[i:i + batch_size]
            response = supabase.table("participants").insert(batch).execute()
            print(f"Uploaded batch {i // batch_size + 1}/{(len(participants) + batch_size - 1) // batch_size}")
        
        print("✅ Successfully uploaded all participants!")
        
    except Exception as e:
        print(f"❌ Error uploading to Supabase: {e}")
        raise


def main():
    """Main function to generate and upload synthetic data."""
    print("=" * 50)
    print("Recruitr - Synthetic Participant Generator")
    print("=" * 50)
    
    # Number of participants to generate
    num_participants = 200
    print(f"\nGenerating {num_participants} synthetic participants...")
    
    # Generate participants
    participants = [generate_participant(i) for i in range(num_participants)]
    
    # Save to JSON file (for backup)
    output_file = "participants.json"
    with open(output_file, "w") as f:
        json.dump(participants, f, indent=2)
    print(f"✅ Saved to {output_file}")
    
    # Generate embeddings
    descriptions = [p["description"] for p in participants]
    embeddings = generate_embeddings(descriptions)
    
    # Add embeddings to participants
    for participant, embedding in zip(participants, embeddings):
        participant["embedding"] = embedding
    
    # Upload to Supabase
    upload_to_supabase(participants)
    
    # Print statistics
    print("\n" + "=" * 50)
    print("Statistics:")
    print("=" * 50)
    print(f"Total participants: {len(participants)}")
    print(f"Remote workers: {sum(1 for p in participants if p['remote'])}")
    print(f"On-site workers: {sum(1 for p in participants if not p['remote'])}")
    print(f"Unique roles: {len(set(p['role'] for p in participants))}")
    print(f"Unique industries: {len(set(p['industry'] for p in participants))}")
    print("\n✅ Setup complete! Your Recruitr database is ready.")


if __name__ == "__main__":
    main()


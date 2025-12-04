"""
Generate synthetic participant data WITHOUT embeddings (quick version).
We'll add embeddings later when implementing SBERT.
"""

import json
import random
from typing import List, Dict
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import supabase
from config import settings


# Sample data for generation
FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery",
    "Quinn", "Cameron", "Skyler", "Emerson", "Dakota", "Rowan", "Sage", "River",
    "Blake", "Phoenix", "Hunter", "Aspen"
]

LAST_NAMES = [
    "Chen", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Martinez",
    "Rodriguez", "Davis", "Miller", "Anderson", "Taylor", "Thomas", "Lee", "Patel",
    "Wilson", "Moore", "Jackson", "White"
]

ROLES = [
    "Product Manager",
    "Software Engineer",
    "UX Designer",
    "Product Designer",
    "Engineering Manager",
    "Data Scientist",
    "Project Manager",
    "Marketing Manager",
    "Customer Success Manager",
    "Sales Manager"
]

INDUSTRIES = [
    "SaaS",
    "E-commerce",
    "Fintech",
    "Healthcare",
    "Education",
    "Enterprise Software",
    "Marketing Tech",
    "Consumer Tech"
]

COMPANY_SIZES = ["1-10", "10-50", "51-200", "201-500", "500+"]

TOOLS = [
    "Figma", "Sketch", "Adobe XD", "InVision",
    "Jira", "Asana", "Trello", "Monday.com",
    "Slack", "Microsoft Teams", "Zoom",
    "Google Analytics", "Mixpanel", "Amplitude",
    "Salesforce", "HubSpot", "Intercom",
    "GitHub", "GitLab", "Bitbucket",
    "AWS", "Azure", "Google Cloud"
]

SKILLS = [
    "Product Strategy", "User Research", "Data Analysis",
    "A/B Testing", "Agile", "Scrum", "SQL",
    "Python", "JavaScript", "React", "Leadership",
    "Communication", "Stakeholder Management"
]


def generate_participant() -> Dict:
    """Generate a single synthetic participant."""
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    role = random.choice(ROLES)
    industry = random.choice(INDUSTRIES)
    remote = random.choice([True, False])
    
    # Generate description
    work_location = "remote" if remote else "on-site"
    selected_tools = random.sample(TOOLS, k=random.randint(3, 6))
    selected_skills = random.sample(SKILLS, k=random.randint(3, 5))
    
    description = (
        f"{role} with {random.randint(2, 10)} years of experience in {industry}. "
        f"Currently working {work_location} at a {random.choice(COMPANY_SIZES)}-person company. "
        f"Experienced with {', '.join(selected_tools[:3])}. "
        f"Strong background in {', '.join(selected_skills[:2])}."
    )
    
    participant = {
        "name": name,
        "email": f"{name.lower().replace(' ', '.')}@example.com",
        "role": role,
        "industry": industry,
        "company_name": f"{random.choice(['Tech', 'Digital', 'Smart', 'Innovate', 'Cloud'])} {random.choice(['Solutions', 'Labs', 'Systems', 'Ventures'])}",
        "company_size": random.choice(COMPANY_SIZES),
        "remote": remote,
        "team_size": random.randint(3, 15),
        "experience_years": random.randint(2, 15),
        "tools": selected_tools,
        "skills": selected_skills,
        "description": description,
        "is_synthetic": True,
        "accepting_interviews": True
    }
    
    return participant


def main():
    """Generate and upload participants."""
    print("🎲 Generating 200 synthetic participants...")
    
    participants = [generate_participant() for _ in range(200)]
    
    print(f"✅ Generated {len(participants)} participants")
    print("\n📤 Uploading to Supabase...")
    
    try:
        # Upload in batches of 50
        batch_size = 50
        for i in range(0, len(participants), batch_size):
            batch = participants[i:i + batch_size]
            result = supabase.table("participants").insert(batch).execute()
            print(f"   Uploaded batch {i//batch_size + 1} ({len(batch)} participants)")
        
        print("\n🎉 Success! Data uploaded to Supabase")
        print(f"   Total participants: {len(participants)}")
        print("\n💡 Next steps:")
        print("   1. Check Supabase dashboard → Table Editor → participants")
        print("   2. You should see 200 rows")
        print("   3. Now you can implement BM25 search!")
        print("\n   Note: Embeddings will be added later when implementing SBERT")
        
    except Exception as e:
        print(f"\n❌ Error uploading to Supabase:")
        print(f"   {str(e)}")
        print("\n💡 Make sure:")
        print("   1. You ran the schema.sql in Supabase SQL Editor")
        print("   2. Your .env file has correct SUPABASE_URL and SUPABASE_SERVICE_KEY")
        sys.exit(1)


if __name__ == "__main__":
    main()


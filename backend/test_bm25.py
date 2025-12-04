"""
Test script for BM25 Retriever
Quick test to verify BM25 search is working correctly.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import supabase
from services.retrieval.bm25_retriever import BM25Retriever


def load_participants():
    """Load all participants from Supabase."""
    print("📥 Loading participants from database...")
    response = supabase.table("participants").select("*").execute()
    participants = response.data
    print(f"✅ Loaded {len(participants)} participants\n")
    return participants


def test_bm25_search(retriever, query, top_k=5):
    """Test a single search query."""
    print(f"🔍 Query: \"{query}\"")
    print("-" * 60)
    
    results = retriever.search(query, top_k=top_k)
    
    if not results:
        print("❌ No results found\n")
        return
    
    for i, result in enumerate(results, 1):
        # Get full participant data
        participant_id = result['participant_id']
        participant = next(p for p in retriever.participants if p['id'] == participant_id)
        
        print(f"{i}. {participant['name']} - {participant['role']}")
        print(f"   Score: {result['score']:.2f}")
        print(f"   Company: {participant['company_name']} ({participant['company_size']} employees)")
        print(f"   Remote: {'Yes' if participant['remote'] else 'No'}")
        print(f"   Tools: {', '.join(participant['tools'][:3])}")
        print()


def main():
    print("=" * 60)
    print("🧪 BM25 Retriever Test")
    print("=" * 60)
    print()
    
    # Load participants
    participants = load_participants()
    
    # Initialize BM25
    print("🏗️  Building BM25 index...")
    retriever = BM25Retriever(participants)
    print(f"✅ BM25 initialized: {retriever.get_name()}\n")
    
    # Test queries
    test_queries = [
        "Product Manager Figma",
        "remote Software Engineer",
        "UX Designer with Sketch",
        "Data Scientist Python",
        "Engineering Manager team leadership"
    ]
    
    for query in test_queries:
        test_bm25_search(retriever, query, top_k=3)
        print()
    
    print("=" * 60)
    print("✅ BM25 Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()






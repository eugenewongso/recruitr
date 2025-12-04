"""Simple BM25 test - minimal version"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("1. Importing modules...")
from database import supabase
from services.retrieval.bm25_retriever import BM25Retriever

print("2. Loading participants...")
response = supabase.table("participants").select("*").limit(10).execute()
participants = response.data
print(f"   Loaded {len(participants)} participants")

print("3. Creating BM25 retriever...")
retriever = BM25Retriever(participants)
print(f"   ✅ Retriever created: {retriever.get_name()}")

print("4. Testing search...")
results = retriever.search("Product Manager", top_k=3)
print(f"   ✅ Search returned {len(results)} results")

print("\n5. Results:")
for r in results[:3]:
    p = next(p for p in participants if p['id'] == r['participant_id'])
    print(f"   - {p['name']} ({p['role']}) - Score: {r['score']:.2f}")

print("\n✅ BM25 is WORKING!")






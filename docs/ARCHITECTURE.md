# Recruitr Architecture

## System Overview

Recruitr is a three-tier web application for AI-assisted participant search in user research.

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Tailwind
│   (Port 5173)   │  User Interface
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│   Backend       │  Python + FastAPI
│   (Port 8000)   │  IR Algorithms, LLM, Business Logic
└────────┬────────┘
         │ Supabase Client
         ↓
┌─────────────────┐
│   Database      │  Supabase (PostgreSQL + pgvector)
│   (Cloud)       │  Data Storage, Vector Search
└─────────────────┘
```

---

## Component Architecture

### Frontend (React + TypeScript)

**Technology:** React 18, TypeScript, Vite, Tailwind CSS

**Responsibilities:**

- User interface and interaction
- Authentication state management
- API communication with backend
- Search query input and results display
- Data visualization and export

**Key Patterns:**

- Component-based architecture
- React Context for global state (auth)
- Custom hooks for reusable logic
- Type-safe API calls with TypeScript

**Directory Structure:**

```
src/
├── components/     # Reusable UI components
├── pages/          # Route/page components
├── services/       # API integration
├── hooks/          # Custom React hooks
├── context/        # Global state (Context API)
├── types/          # TypeScript definitions
└── utils/          # Helper functions
```

---

### Backend (Python + FastAPI)

**Technology:** FastAPI, Python 3.9+, Supabase Client

**Responsibilities:**

- Information retrieval (BM25, SBERT, Hybrid)
- Rank fusion algorithms
- Prompt interpretation and query understanding
- LLM integration for message/question generation
- Authentication and authorization
- Data access layer

**Key Patterns:**

- Service layer architecture
- Dependency injection (FastAPI)
- Pydantic models for validation
- Separation of concerns (routes, services, models)

**Directory Structure:**

```
backend/
├── models/         # Pydantic schemas
├── services/       # Business logic
│   ├── retrieval/  # IR algorithms
│   ├── researcher/ # Researcher features
│   └── participant/# Participant features
├── routes/         # API endpoints
├── database/       # DB client
├── middleware/     # Auth, logging
└── utils/          # Helpers
```

---

### Database (Supabase + pgvector)

**Technology:** PostgreSQL 15, pgvector extension, Supabase

**Responsibilities:**

- Persistent data storage
- Vector similarity search
- Row-level security (RLS)
- User authentication (via Supabase Auth)

**Key Tables:**

- `profiles` - User accounts with roles
- `participants` - Participant profiles + embeddings
- `searches` - Search history
- `saved_participants` - Bookmarks
- `interview_requests` - (Phase 2)

**Key Features:**

- pgvector for semantic search
- RLS for data access control
- Custom SQL functions for hybrid queries

---

## Information Retrieval Pipeline

### Search Flow

```
1. User Input
   "Find remote PMs using Trello"
         ↓
2. Prompt Interpreter (Backend)
   Extracts: {role: "PM", remote: true, tools: ["Trello"]}
         ↓
3. Parallel Retrieval
   ├→ BM25 Retriever      → Score: [0.85, 0.72, ...]
   └→ SBERT Retriever     → Score: [0.92, 0.88, ...]
         ↓
4. Rank Fusion (RRF)
   Combines scores → Final ranking
         ↓
5. Results Enhancement
   • Relevance scores
   • AI-generated outreach (LLM)
   • Interview questions (LLM)
         ↓
6. Frontend Display
   Ranked participant cards
```

### IR Components

#### 1. BM25 Retriever (`services/retrieval/bm25_retriever.py`)

**Algorithm:** Okapi BM25  
**Purpose:** Lexical (keyword-based) search

**Process:**

```python
1. Create document corpus from participants
2. Tokenize documents and query
3. Calculate TF-IDF scores
4. Apply BM25 ranking formula
5. Return top-k results with scores
```

**Parameters:**

- `k1 = 1.5` (term frequency saturation)
- `b = 0.75` (length normalization)

#### 2. SBERT Retriever (`services/retrieval/sbert_retriever.py`)

**Algorithm:** Sentence-BERT embeddings + cosine similarity  
**Purpose:** Semantic (meaning-based) search

**Process:**

```python
1. Load pre-trained SBERT model (all-MiniLM-L6-v2)
2. Generate 384-dim embeddings for query
3. Query Supabase pgvector for similar embeddings
4. Return top-k results with similarity scores
```

**Model:** `all-MiniLM-L6-v2` (384 dimensions)

#### 3. Hybrid Retriever (`services/retrieval/hybrid_retriever.py`)

**Algorithm:** Reciprocal Rank Fusion (RRF)  
**Purpose:** Combine BM25 and SBERT rankings

**Process:**

```python
1. Get BM25 rankings: [p1, p3, p2, ...]
2. Get SBERT rankings: [p2, p1, p4, ...]
3. Apply RRF formula:
   score(p) = Σ 1/(k + rank_i(p))
   where k=60, rank_i is position in list i
4. Sort by fused score
5. Return top-k
```

**Why RRF?**

- Unsupervised (no training data needed)
- Robust to different score scales
- Balances diverse ranking signals

#### 4. Prompt Interpreter (`services/retrieval/prompt_interpreter.py`)

**Purpose:** Extract structured filters from natural language

**Process:**

```python
1. Parse query for keywords:
   - Remote: "remote", "work from home"
   - Tools: "Trello", "Asana", "Jira"
   - Role: "PM", "engineer", "designer"
   - Team size: "3-10 people"
2. Extract structured filters
3. Pass to retrievers for filtering
```

**Techniques:**

- Regex patterns
- Keyword matching
- Optional: LLM for complex queries

---

## Data Flow

### Search Request

```
1. Frontend (React)
   POST /researcher/search
   Body: { query: "remote PMs", limit: 10 }
         ↓
2. Backend (FastAPI)
   /routes/researcher.py → search_participants()
         ↓
3. Search Service
   services/researcher/search_service.py
   • Interpret prompt
   • Call hybrid retriever
         ↓
4. Hybrid Retriever
   • BM25 search (in-memory)
   • SBERT search (via Supabase)
   • Rank fusion
         ↓
5. Supabase
   SELECT * FROM participants
   ORDER BY embedding <=> query_embedding
         ↓
6. Backend
   Format results, add metadata
         ↓
7. Frontend
   Display ranked participants
```

### LLM Generation Request

```
1. User clicks "Generate Outreach"
         ↓
2. Frontend
   POST /researcher/generate-outreach
   Body: { participantId, projectDescription }
         ↓
3. Backend
   services/researcher/llm_service.py
   • Load participant data
   • Construct prompt
   • Call OpenAI/Anthropic API
         ↓
4. LLM API
   Generate personalized message
         ↓
5. Frontend
   Display generated message
   Option to edit/regenerate
```

---

## Authentication & Authorization

### Authentication Flow (Supabase Auth)

```
1. User signs up/logs in
         ↓
2. Supabase Auth
   Create user in auth.users
   Return JWT token
         ↓
3. Frontend
   Store token in memory/localStorage
   Add to API requests (Authorization header)
         ↓
4. Backend
   Verify JWT with Supabase
   Extract user ID and role
         ↓
5. Row Level Security
   Filter data based on user ID + role
```

### Role-Based Access Control

**Roles:**

- `researcher` - Can search participants, save searches, generate outreach
- `participant` - (Phase 2) Can manage profile, respond to requests

**Enforcement:**

1. **Frontend:** Route guards based on role
2. **Backend:** Middleware checks role before endpoint access
3. **Database:** RLS policies enforce data access

**Example Policy:**

```sql
-- Researchers can view all participants
CREATE POLICY "Researchers can view participants"
ON participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'researcher'
  )
);
```

---

## Scalability & Performance

### Current Design (Phase 1)

**Capacity:**

- 200-500 participants (synthetic data)
- 10-50 concurrent users
- Response time: < 500ms

**Bottlenecks:**

- BM25 computed in-memory (fine for < 10K docs)
- SBERT via Supabase (depends on free tier limits)

### Future Optimizations

**For 10K+ Participants:**

1. **BM25:** Pre-compute index, store in Redis
2. **SBERT:** Batch embedding generation, cache embeddings
3. **Database:** Connection pooling, query optimization
4. **Caching:** Redis for frequent queries
5. **CDN:** Static assets (frontend)

**For 100K+ Participants:**

1. Dedicated vector database (Pinecone, Weaviate)
2. Elasticsearch for BM25
3. Load balancing (multiple backend instances)
4. Async job queue (Celery) for heavy tasks

---

## Security Considerations

### Data Protection

- **Environment variables** for all secrets
- **Row Level Security** for data access
- **HTTPS** for all communications (production)
- **JWT tokens** for authentication

### Input Validation

- Pydantic models validate all inputs
- SQL injection prevented by parameterized queries (Supabase client)
- XSS protection via React (auto-escaping)

### Rate Limiting

- TODO: Add rate limiting middleware
- Prevent abuse of LLM API calls

---

## Deployment Architecture

### Development

```
localhost:5173 (Frontend)
       ↓
localhost:8000 (Backend)
       ↓
Supabase Cloud (Database)
```

### Production

```
Vercel/Netlify (Frontend CDN)
       ↓
Railway/Render (Backend API)
       ↓
Supabase Cloud (Database)
```

**Services:**

- **Frontend:** Vercel (automatic from GitHub)
- **Backend:** Railway or Render (Docker container)
- **Database:** Supabase (managed PostgreSQL)

---

## Technology Choices Rationale

| Choice            | Reason                                                     |
| ----------------- | ---------------------------------------------------------- |
| **React**         | Component-based, large ecosystem, team familiarity         |
| **TypeScript**    | Type safety, better DX, fewer bugs                         |
| **FastAPI**       | Modern, fast, auto-generated docs, async support           |
| **Supabase**      | PostgreSQL + Auth + Storage in one, pgvector support       |
| **pgvector**      | Native vector search in PostgreSQL, no separate service    |
| **Sentence-BERT** | State-of-the-art semantic embeddings, pre-trained models   |
| **BM25**          | Industry-standard lexical search, fast, no training needed |
| **Tailwind CSS**  | Utility-first, rapid UI development, consistent design     |

---

## Future Extensions (Phase 2)

### Two-Sided Platform

- Participant accounts and authentication
- Profile management for participants
- Interview request workflow
- Notification system
- In-app messaging

### Advanced Features

- Multi-language support
- Advanced analytics dashboard
- Calendar integration
- Payment processing (for compensated interviews)
- API for third-party integrations

### Technical Improvements

- WebSocket for real-time notifications
- Background job processing (Celery + Redis)
- Comprehensive test suite
- CI/CD pipeline
- Monitoring and logging (Sentry, LogRocket)

---

## Conclusion

Recruitr's architecture balances:

- **Simplicity:** Easy to understand and extend
- **Performance:** Fast search with hybrid IR
- **Scalability:** Can grow from prototype to production
- **Maintainability:** Clear separation of concerns
- **Extensibility:** Ready for Phase 2 features

The modular design allows both team members to work independently on frontend/backend while maintaining a cohesive system.

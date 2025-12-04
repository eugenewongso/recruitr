# Recruitr Backend

Python FastAPI backend for the Recruitr participant search platform.

## 🎯 What This Backend Does

- **Information Retrieval**: Implements BM25 and Sentence-BERT hybrid search
- **Rank Fusion**: Combines multiple ranking signals using RRF
- **Prompt Interpretation**: Extracts structured queries from natural language
- **LLM Integration**: Generates outreach messages and interview questions
- **API**: Provides RESTful endpoints for the frontend

## 📦 Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download NLTK Data

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### 4. Configure Environment

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your:

- Supabase URL and service key
- OpenAI or Anthropic API key (optional)

### 5. Set Up Database

Run the SQL schema in Supabase:

```bash
# Go to Supabase Dashboard → SQL Editor
# Copy and run the contents of database/schema.sql
```

### 6. Generate Synthetic Data

```bash
python data/generate_participants.py
```

## 🚀 Running the Server

### Development Mode (with auto-reload)

```bash
uvicorn main:app --reload --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:

- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📂 Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration management
├── requirements.txt           # Python dependencies
│
├── models/                    # Pydantic schemas
│   ├── user.py               # User & auth models
│   ├── participant.py        # Participant models
│   └── search.py             # Search request/response models
│
├── services/                  # Business logic
│   ├── retrieval/            # Core IR algorithms
│   │   ├── bm25_retriever.py      # BM25 implementation
│   │   ├── sbert_retriever.py     # Sentence-BERT + Supabase
│   │   ├── hybrid_retriever.py    # Rank fusion
│   │   └── prompt_interpreter.py  # Query understanding
│   │
│   ├── researcher/           # Researcher features
│   │   ├── search_service.py      # Main search logic
│   │   ├── llm_service.py         # LLM generation
│   │   └── export_service.py      # Export functionality
│   │
│   └── participant/          # Participant features (FUTURE)
│       ├── profile_service.py
│       └── request_service.py
│
├── routes/                    # API endpoints
│   ├── auth.py               # Authentication routes
│   ├── researcher.py         # Researcher endpoints
│   └── participant.py        # Participant endpoints (FUTURE)
│
├── database/                  # Database integration
│   ├── supabase_client.py    # Supabase connection
│   └── schema.sql            # Database schema
│
├── middleware/                # Middleware
│   └── auth_middleware.py    # Role-based access control
│
├── data/                      # Data management
│   ├── generate_participants.py  # Synthetic data generator
│   └── participants.json          # Generated data (gitignored)
│
└── utils/                     # Utilities
    ├── embeddings.py         # Embedding generation helpers
    └── permissions.py        # Permission checking
```

## 🔍 Core IR Components

### 1. Prompt Interpreter (`prompt_interpreter.py`)

**Extracts structured filters from natural language queries.**

Capabilities:

- Role detection with abbreviation support (PM → Product Manager, UX → UX Designer, dev → Software Engineer)
- Remote work detection (remote, WFH, work from home, telecommute)
- Tool extraction (case-sensitive matching of 30+ common tools)
- Experience range extraction (3-5 years, 5+years, with X years)
- Team size extraction (manages 5-10 people, team of 7)
- Company size detection (startup, enterprise, small, medium, large)

Example:

```python
query = "Find remote PMs using Trello with 3-5 years experience"
result = prompt_interpreter.extract_intent(query)
# Returns: {
#   "query": "Find remote PMs using Trello with 3-5 years experience",
#   "filters": {
#     "remote": True,
#     "role": "Product Manager",
#     "tools": ["Trello"],
#     "min_experience_years": 3,
#     "max_experience_years": 5
#   }
# }
```

### 2. Query Processor (`query_processor.py`)

**Normalizes and expands search queries for better recall.**

Features:

- Text normalization (lowercase, trim, remove punctuation)
- Synonym expansion (PM → product manager, dev → developer)
- Abbreviation expansion (WFH → remote work from home, k8s → kubernetes)
- Term extraction for match explanation

Example:

```python
query = "WFH PMs using Figma"
result = query_processor.process_query(query)
# Returns: {
#   "original_query": "WFH PMs using Figma",
#   "normalized_query": "wfh pms using figma",
#   "expanded_query": "wfh remote work from home pms product manager using figma",
#   "terms": ["wfh", "remote", "work", "from", "home", "pms", "product", "manager", "using", "figma"]
# }
```

### 3. BM25 Retriever (`bm25_retriever.py`)

**Implements probabilistic keyword-based ranking with smart field weighting.**

Key Features:

- BM25 algorithm (Okapi BM25 with k1=1.5, b=0.75)
- Weighted field importance:
  - Role: 3x weight (most important)
  - Tools: 2x weight (very important)
  - Skills: 1.5x weight (important)
  - Company/Industry: 1x weight (normal)
  - Description: 0.5x weight (less important, context)
- Post-retrieval filtering by role, tools, remote, team size, company size, experience
- NLTK-based tokenization with stopword removal

### 4. Sentence-BERT Retriever (`sbert_retriever.py`)

**Uses pre-trained transformer models for semantic similarity search.**

- Model: `all-MiniLM-L6-v2` (384-dimensional embeddings)
- Stores embeddings in Supabase with pgvector extension
- Cosine similarity search via database
- Supports native database-level filtering

### 5. Hybrid Retriever (`hybrid_retriever.py`)

**Combines BM25 and SBERT using Reciprocal Rank Fusion.**

Algorithm:

```
For each result r in BM25 ∪ SBERT:
    score(r) = Σ 1 / (k + rank_i(r))
    where k = 60 (RRF constant)
```

Benefits:

- Balances lexical and semantic signals
- No need to normalize scores between methods
- Robust to outliers and score scale differences

### 6. Relevance Explainer (`relevance_explainer.py`)

**Generates human-readable explanations for search results.**

Provides up to 5 match reasons per result:

- "Role: Product Manager"
- "Uses Trello, Figma"
- "Remote worker"
- "Skills: UX Design, Python"
- "5 years of experience"
- "Manages team of 8"

### 7. Search Service (`search_service.py`)

**Orchestrates the complete search pipeline.**

Pipeline:

1. Interpret prompt → extract filters
2. Process query → normalize & expand
3. Merge explicit + extracted filters
4. Execute hybrid search (BM25 + SBERT + RRF)
5. Enrich results with match explanations

Returns:

- Ranked participants with scores
- Match reasons for each result
- Query analysis (expanded query, extracted filters)
- Performance metrics (retrieval time)

### 8. Recommendation Service (`recommendation_service.py`)

**Generates personalized search query suggestions based on user behavior.**

Features:

- **Behavior Analysis:**

  - Fetches recent 20 searches from `search_history` table
  - Fetches all saved participants with full profile data
  - Extracts roles from both searches (keyword matching) and saved participants
  - Weights saved participant roles 2x higher than search mentions

- **Pattern Detection:**

  - Top 3-4 roles (from search queries + saved participants)
  - Top 3 tools (from saved participants)
  - Remote preference (if >60% remote → suggest remote queries)
  - Experience level (average years of saved participants)
  - Company size preference (most common sizes)
  - Top 2 industries

- **Query Generation:**

  - Creates 8+ candidate queries using 5 template types:
    - `"{remote} {role}"` - e.g., "Remote Software Engineer"
    - `"{role} using {tool}"` - e.g., "UX Designer using Figma"
    - `"{role} with {exp}+ years experience"` - e.g., "PM with 5+ years"
    - `"{role} at {size} companies"` - e.g., "Engineer at startups"
    - `"{role} in {industry}"` - e.g., "Analyst in Healthcare"
  - Rotates through tools and industries for variety
  - Shuffles templates on each request
  - Shuffles final query list before returning top 4

- **Personalization Threshold:**

  - Requires 3+ searches OR 1+ saved participant
  - Falls back to generic defaults for new users

- **Auto-Refresh:**
  - Suggestions update after each search
  - Shows different combinations on each page refresh
  - Ensures diverse recommendations

**Role Keyword Detection (20+ keywords):**

- "pm" / "product manager" → Product Manager
- "ux" / "designer" → UX Designer
- "engineer" / "developer" → Software Engineer
- "nurse" → Nurse Practitioner
- "analyst" → Business Analyst
- And more...

## 🧪 Testing

```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_retrieval.py
```

## 📊 API Endpoints

### Authentication

- `POST /auth/signup` - Create new account
- `POST /auth/login` - Sign in
- `POST /auth/logout` - Sign out

### Search (Researcher)

- `POST /researcher/search` - Search for participants
- `GET /researcher/search-suggestions` - Get personalized query recommendations
- `GET /researcher/searches` - Get search history
- `GET /researcher/saved` - Get saved participants
- `POST /researcher/save/{participant_id}` - Save a participant

### LLM Generation (Researcher)

- `POST /researcher/generate-outreach` - Generate outreach message
- `POST /researcher/generate-questions` - Generate interview questions

### Profile (Participant - FUTURE)

- `GET /participant/profile` - Get own profile
- `PUT /participant/profile` - Update profile
- `GET /participant/requests` - Get interview requests

## 🛠️ Development

### Code Style

```bash
# Format code
black .

# Check types
mypy .

# Lint
flake8 .
```

### Adding a New Feature

1. Create model in `models/`
2. Implement service logic in `services/`
3. Add route in `routes/`
4. Update this README

## 🔐 Security

- All routes (except auth) require authentication
- Role-based access control via middleware
- Supabase Row Level Security (RLS) for data access
- Environment variables for sensitive data

## 📝 Environment Variables

See `.env.example` for all available configuration options.

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Optional:

- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `BM25_K1`, `BM25_B` (IR parameters)
- `SBERT_MODEL` (model selection)

## 🐛 Troubleshooting

### Import Errors

Make sure you're in the virtual environment:

```bash
source venv/bin/activate
```

### Database Connection Issues

Check your Supabase URL and key in `.env`

### NLTK Data Missing

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Model Download Issues

Sentence-Transformers downloads models on first use. Ensure you have internet access and ~500MB free space.

## 📚 Further Reading

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Sentence-Transformers](https://www.sbert.net/)
- [BM25 Algorithm](https://en.wikipedia.org/wiki/Okapi_BM25)

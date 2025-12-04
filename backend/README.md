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

### BM25 Retriever

Implements probabilistic keyword-based ranking using the BM25 algorithm.

### Sentence-BERT Retriever

Uses pre-trained transformer models to generate semantic embeddings and perform similarity search via Supabase pgvector.

### Hybrid Retriever

Combines BM25 and SBERT results using Reciprocal Rank Fusion (RRF) for optimal ranking.

### Prompt Interpreter

Extracts structured filters (role, tools, remote status, etc.) from natural language queries.

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

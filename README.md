# Recruitr: AI-Assisted Participant Finder

<div align="center">

**Find the perfect research participants using natural language**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)

</div>

---

## Table of Contents

- [About](#about)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Development](#development)
- [Architecture](#architecture)
- [Project Status](#project-status)
- [Team](#team)
- [Timeline](#timeline)
- [References](#references)

---

## About

Recruitr is an intelligent participant search and recommendation platform that helps product teams find the right people to interview before product launch. Simply describe your target audience in natural language, and Recruitr automatically finds suitable participants, ranks them by relevance, and helps prepare for interviews.

### Example Use Case

> **Input:** "Find remote product managers who use Trello or Asana and manage teams of 3-10 people at startups"
>
> **Recruitr Returns:**
>
> - Ranked list of matching participants
> - Relevance scores for each candidate
> - AI-generated outreach messages
> - Project management tools

---

## Problem Statement

When companies develop new products, one of the biggest challenges is finding the right people to interview before launch. Product and design teams spend hours manually sourcing potential users through surveys, social media, or customer lists. The process is slow, often leads to unrepresentative samples, and limits the team's ability to gather meaningful insights quickly.

**Recruitr solves this by:**

- Accepting natural language queries instead of manual filters
- Combining lexical (BM25) and semantic (SBERT) search
- Using AI to generate personalized outreach messages
- Providing a fast, scalable alternative to manual participant sourcing

---

## Features

### Core Search & Discovery

- **Hybrid Search Engine**: Combines BM25 (keyword) and Sentence-BERT (semantic) retrieval with Reciprocal Rank Fusion
- **Natural Language Queries**: Simply describe your ideal participant in plain English
- **Intelligent Query Understanding**: Automatically extracts filters from natural language (e.g., "remote PMs" → remote=true, role="Product Manager")
- **Query Expansion**: Expands abbreviations and synonyms (e.g., "WFH" → "remote work from home")
- **Advanced Filters**: Filter by role, company size, remote work, tools, experience years, team size
- **Match Explanations**: See why each participant matches your query with highlighted reasons
- **Smart Field Weighting**: Role and tools weighted 3x and 2x higher than other fields
- **Categorical Match Labels**: Results labeled as "Excellent Match", "Great Match", "Good Match" etc. with color coding
- **Search History**: Track and revisit all your past searches

### AI-Powered Features

- **AI Project Creation**: Describe your research goal, AI generates search queries and finds participants automatically
- **Smart Outreach Generation**: Bulk generate personalized recruitment emails using Gemini AI
- **AI Research Strategy**: View reasoning behind AI's search approach with collapsible sections
- **Draft Management**: Save, edit, and reuse email drafts across projects
- **Personalized Search Recommendations**: Intelligent query suggestions based on your search history and saved participants, with automatic diversity rotation

### Project Management

- **Create & Organize Projects**: AI-assisted or manual project creation
- **Edit Project Details**: Update names and descriptions on the fly
- **Status Tracking**: Move projects through draft → in progress → completed
- **Grid/List Views**: Toggle between card and compact list layouts
- **Participant Lists**: See all matched participants per project

### Participant Management

- **View Detailed Profiles**: See complete participant information with match scores
- **Save/Bookmark**: Keep track of promising candidates
- **Grid/List Views**: Choose your preferred layout for browsing
- **Generate Outreach**: Create personalized emails for individuals or groups

### Analytics & Insights

- **Dashboard Analytics**: View search statistics and activity metrics
- **Search Trends**: See your most common searches over time
- **Top Roles & Tools**: Visualize frequently searched criteria
- **Activity Feed**: Track recent actions and searches

### Notifications & History

- **In-App Notifications**: Get notified when saving participants, completing searches, generating emails, and more
- **Unread Badge**: See unread notification count at a glance
- **Mark as Read**: Individual or bulk mark notifications
- **Search History**: Full record of all searches with results

### Profile & Settings

- **Profile Management**: Update name, company, and job title
- **Search Preferences**: Set default filters and criteria
- **Security Settings**: Password management (placeholder for future)
- **Notification Settings**: Control what notifications you receive

### Security & Authentication

- **Supabase Auth**: Secure JWT-based authentication
- **Row Level Security**: Database policies protect user data
- **Role-Based Access**: Researcher and participant roles (participant features coming in Phase 2)

### Future Features (Phase 2 - Expandable)

- **Two-Sided Platform**: Allow participants to create profiles and manage availability
- **Request Management**: Send and track interview invitations
- **Messaging**: Direct communication between researchers and participants
- **Scheduling**: Integrated calendar for interview booking

---

## Tech Stack

### Frontend

- **React 18** - UI framework with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible component library
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide Icons** - Clean, modern icon set

### Backend

- **Python 3.9+** - Core programming language
- **FastAPI** - Modern, high-performance web framework
- **Sentence-Transformers** - Semantic embeddings (all-MiniLM-L6-v2)
- **rank-bm25** - Probabilistic keyword-based search
- **Google Gemini AI** - LLM for outreach generation and AI agent
- **Supabase Python Client** - Database and auth integration
- **NLTK** - Natural language processing toolkit

### Database & Infrastructure

- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL 15** - Robust relational database
- **pgvector** - Vector similarity search extension
- **Row Level Security (RLS)** - Fine-grained access control
- **JWT Authentication** - Secure token-based auth

### Information Retrieval Algorithms

- **BM25** - Probabilistic keyword-based ranking (Okapi BM25)
- **Sentence-BERT** - Dense semantic embeddings via transformers
- **Reciprocal Rank Fusion (RRF)** - Hybrid ranking algorithm
- **Cosine Similarity** - Vector similarity measurement

---

## Project Structure

```
recruitr/
├── backend/                      # Python FastAPI backend
│   ├── models/                   # Pydantic schemas
│   ├── services/                 # Business logic & IR algorithms
│   │   ├── retrieval/           # BM25, SBERT, Hybrid search
│   │   ├── researcher/          # Researcher-specific features
│   │   └── participant/         # Participant features (future)
│   ├── routes/                   # API endpoints
│   ├── database/                 # Supabase client & schema
│   ├── data/                     # Synthetic participant data
│   └── main.py                   # Application entry point
│
├── frontend/                     # React TypeScript frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API integration
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript definitions
│   │   └── context/            # React context (auth, etc.)
│   └── package.json
│
├── docs/                         # Documentation
│   ├── API.md                   # API reference
│   ├── ARCHITECTURE.md          # System design & architecture
│   └── EXPANSION_GUIDE.md       # Guide for Phase 2 features
│
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9 or higher** - [Download here](https://www.python.org/downloads/)
- **Node.js 18 or higher** - [Download here](https://nodejs.org/)
- **npm or yarn** - Comes with Node.js installation
- **Supabase account** - [Sign up for free](https://supabase.com/)
- **Google Gemini API key** (optional, for AI features) - [Get your key](https://aistudio.google.com/app/apikey)

### Installation Steps

#### Step 1: Clone the Repository

```bash
git clone https://github.com/eugenewongso/recruitr.git
cd recruitr
```

#### Step 2: Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Navigate to **Settings** → **API** and copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (for frontend)
   - **service_role secret key** (for backend - keep this secure!)
3. Go to **SQL Editor** and execute the database schema:
   - Open `backend/database/schema.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click "Run"
4. Enable the pgvector extension (if not already enabled):
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

#### Step 3: Set Up the Backend

```bash
# Navigate to backend directory
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Download required NLTK data
python -c "import nltk; nltk.download('punkt')"

# Create environment file from template
cp .env.example .env

# Edit .env file with your credentials
# Required variables:
#   SUPABASE_URL=https://xxxxx.supabase.co
#   SUPABASE_SERVICE_KEY=your_service_role_key_here
#   GEMINI_API_KEY=your_gemini_api_key_here (optional)
```

**Note**: Use a text editor to open `.env` and replace the placeholder values with your actual credentials.

#### Step 4: Generate Synthetic Participant Data

```bash
# Make sure you're still in the backend/ directory
# and the virtual environment is activated
python data/generate_participants.py
```

This script creates synthetic participant profiles with embeddings and uploads them to your Supabase database. This may take a few minutes.

#### Step 5: Set Up the Frontend

Open a **new terminal window** (keep the backend terminal open):

```bash
# Navigate to frontend directory from project root
cd frontend

# Install Node.js dependencies
npm install

# Create environment file from template
cp .env.example .env

# Edit .env file with your credentials
# Required variables:
#   VITE_SUPABASE_URL=https://xxxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=your_anon_key_here
#   VITE_API_URL=http://localhost:8000
```

**Note**: Use a text editor to open `.env` and replace the placeholder values with your actual Supabase credentials.

---

## Running the Application

You need to run both the backend and frontend servers simultaneously. Use two separate terminal windows.

### Terminal 1: Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (if not already activated)
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Start the FastAPI server
uvicorn main:app --reload
```

**Expected output:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

The backend API will be available at:

- **API Server**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)

### Terminal 2: Start the Frontend Server

```bash
# Navigate to frontend directory
cd frontend

# Start the Vite development server
npm run dev
```

**Expected output:**

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

The frontend application will be available at: `http://localhost:5173`

### Access the Application

1. Open your web browser
2. Navigate to `http://localhost:5173`
3. Click **Sign Up** to create a new researcher account
4. Complete the registration form
5. Log in with your credentials
6. Start searching for participants!

---

## Development

### Backend Development Commands

```bash
cd backend
source venv/bin/activate  # Activate virtual environment

# Run server with auto-reload
uvicorn main:app --reload --port 8000

# Run tests (when implemented)
pytest

# Format code with Black
black .

# Check code style
flake8
```

### Frontend Development Commands

```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Common Development Tasks

| Task                   | Command                           | Description                   |
| ---------------------- | --------------------------------- | ----------------------------- |
| Start backend          | `uvicorn main:app --reload`       | Runs FastAPI with hot reload  |
| Start frontend         | `npm run dev`                     | Runs Vite dev server          |
| View API docs          | Open `http://localhost:8000/docs` | Interactive API documentation |
| Run backend tests      | `pytest`                          | Execute Python tests          |
| Run frontend tests     | `npm test`                        | Execute React tests           |
| Format Python code     | `black .`                         | Auto-format with Black        |
| Format TypeScript code | `npm run format`                  | Auto-format with Prettier     |

---

## Architecture

### Enhanced Information Retrieval Pipeline

```
User Query: "Remote PMs using Trello with 3-5 years experience"
         ↓
┌────────────────────────────────────────┐
│   1. Prompt Interpreter                │
│      Extracts structured filters:      │
│      • role = "Product Manager"        │
│      • remote = true                   │
│      • tools = ["Trello"]              │
│      • min_experience = 3 years        │
│      • max_experience = 5 years        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│   2. Query Preprocessing               │
│      • Normalize: lowercase, trim      │
│      • Expand: "PM" → "product manager"│
│      • Expand: "WFH" → "remote work"   │
│      Result: enriched search terms     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│   3. Parallel Hybrid Retrieval         │
│                                        │
│   ┌──────────────┐  ┌──────────────┐ │
│   │ BM25         │  │ SBERT        │ │
│   │ (Lexical)    │  │ (Semantic)   │ │
│   │ + Filters    │  │ + Filters    │ │
│   │ Score: 0.85  │  │ Score: 0.92  │ │
│   └──────────────┘  └──────────────┘ │
│                                        │
│   Field Weighting in BM25:            │
│   • Role: 3x weight                   │
│   • Tools: 2x weight                  │
│   • Skills: 1.5x weight               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│   4. Reciprocal Rank Fusion (RRF)     │
│      Combines BM25 + SBERT rankings    │
│      Formula: score = Σ 1/(k + rank)   │
│      Produces unified ranking          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│   5. Results + Match Explanations      │
│      • Ranked participants             │
│      • Relevance scores                │
│      • Match reasons:                  │
│        - "Role: Product Manager"       │
│        - "Uses Trello, Asana"          │
│        - "Remote worker"               │
│        - "4 years of experience"       │
│      • AI-generated outreach           │
└────────────────────────────────────────┘
```

### Technology Responsibilities

| Component               | What It Does                      | What YOU Implement       |
| ----------------------- | --------------------------------- | ------------------------ |
| **BM25**                | Keyword-based ranking             | Full algorithm + filters |
| **Sentence-BERT**       | Generate embeddings               | Model usage & scoring    |
| **Supabase + pgvector** | Store vectors, compute similarity | Infrastructure only      |
| **Rank Fusion**         | Combine BM25 + SBERT              | RRF algorithm            |
| **Prompt Interpreter**  | Extract query intent              | Full NLP logic           |
| **Query Processor**     | Normalize & expand queries        | Synonym expansion        |
| **Relevance Explainer** | Generate match reasons            | Explanation algorithm    |

**Key Point:** Supabase provides infrastructure. The information retrieval algorithms (BM25 with weighted fields, rank fusion, query understanding, synonym expansion, and match explanations) are all implemented in Python.

### Search Improvements Summary

**What Makes Our Search Smart:**

1. **Natural Language Understanding**: Extracts 8+ types of filters from plain English

   - Role detection with abbreviations (PM → Product Manager, UX → UX Designer)
   - Remote work indicators (WFH, remote, work from home)
   - Tool mentions (case-insensitive matching)
   - Experience ranges (3-5 years, 5+ years)
   - Team size (manages 5-10 people)
   - Company size (startup, enterprise)

2. **Query Enhancement**: Makes searches more comprehensive

   - Synonym expansion (dev → developer, engineer)
   - Abbreviation expansion (WFH → remote work from home)
   - Maintains both original and expanded terms

3. **Smart Ranking**: Prioritizes important fields

   - Role matches weighted 3x higher
   - Tool matches weighted 2x higher
   - Skills matches weighted 1.5x higher
   - Ensures job title is most important signal

4. **Explainable Results**: Shows why participants match

   - Lists top 5 match reasons per result
   - Highlights matched tools, skills, and criteria
   - Transparent ranking decisions

5. **Categorical Match Labels**: User-friendly quality indicators

   - "Excellent Match" (green) - Top tier results (score ≥ 0.028)
   - "Great Match" (blue) - Very good matches (score ≥ 0.023)
   - "Good Match" (teal) - Solid matches (score ≥ 0.018)
   - "Fair Match" (amber) - Decent matches (score ≥ 0.013)
   - "Possible Match" (gray) - Lower tier matches
   - Replaces confusing RRF percentages with clear labels

6. **Precise Filtering**: Post-retrieval refinement

   - Applies all extracted filters after initial ranking
   - Supports AND logic for multiple criteria
   - Case-insensitive, flexible matching

7. **Personalized Query Recommendations**: Behavior-based suggestion system
   - Analyzes search history (queries + frequency)
   - Learns from saved participants (roles + tools + preferences)
   - Extracts patterns: top roles, common tools, remote preference, experience level
   - Generates diverse query suggestions using multiple templates
   - Shuffles and rotates suggestions for variety on each page load
   - Threshold: 3+ searches OR 1+ saved participant triggers personalization
   - Graceful fallback to generic suggestions for new users
   - Auto-refreshes after each search to reflect new behavior

---

## Project Status

### Completed Features

All core functionality has been implemented and tested:

- Hybrid search engine (BM25 + SBERT)
- Natural language query processing with smart filters
- Personalized search query recommendations
- AI-powered project creation with Gemini
- Bulk outreach email generation
- Project management (CRUD operations)
- Participant bookmarking and organization
- Search history tracking
- Analytics dashboard
- Profile management
- Notification system
- Draft management for outreach
- Modern, responsive UI with grid/list views
- Full Supabase integration with RLS
- Secure authentication & authorization

### Ready For

- Demo presentations
- User testing
- Academic evaluation
- Production deployment (with proper API keys and hosting)

### Future Enhancements (Phase 2)

The application is architected to support:

- Two-sided platform (participant accounts)
- Interview request management
- Direct messaging
- Calendar integration
- Advanced analytics

See [EXPANSION_GUIDE.md](docs/EXPANSION_GUIDE.md) for implementation details.

---

## Team

**Team Members:**

- **Eugene Alexander Wongso** - [eugeneaw@uw.edu](mailto:eugeneaw@uw.edu)
- **Theophila Abigail Setiawan** - [tsetia@uw.edu](mailto:tsetia@uw.edu)

**Course:** INFO 376 - Information Retrieval  
**Track:** Product  
**Institution:** University of Washington  
**Quarter:** Autumn 2025

**GitHub Repository:** [github.com/eugenewongso/recruitr](https://github.com/eugenewongso/recruitr)

---

---

## References

### Documentation

For detailed technical documentation, see:

- **[API Reference](docs/API.md)** - Complete API endpoint documentation
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and data flow
- **[Expansion Guide](docs/EXPANSION_GUIDE.md)** - How to add Phase 2 features
- **[Backend README](backend/README.md)** - Backend setup and development
- **[Frontend README](frontend/README.md)** - Frontend setup and development

### Academic References

1. Robertson, S., & Zaragoza, H. (2009). _The Probabilistic Relevance Framework: BM25 and Beyond_. Foundations and Trends in Information Retrieval.

2. Reimers, N., & Gurevych, I. (2019). _Sentence-BERT: Sentence Embeddings Using Siamese BERT Networks_. In Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing.

3. Manning, C. D., Raghavan, P., & Schütze, H. (2008). _Introduction to Information Retrieval_. Cambridge University Press.

4. Brown, T. B., et al. (2020). _Language Models Are Few-Shot Learners_. Advances in Neural Information Processing Systems (NeurIPS).

5. UserInterviews.com. (2024). _Participant Recruitment Platform Overview_. Retrieved from [https://www.userinterviews.com](https://www.userinterviews.com)

6. Cormack, G. V., Clarke, C. L., & Buettcher, S. (2009). _Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods_. SIGIR '09.

---

## License

This project is developed as part of INFO 376 at the University of Washington.

---

## Acknowledgments

- INFO 376 Teaching Team for project guidance
- Supabase for the excellent open-source backend platform
- Hugging Face for Sentence-BERT models
- FastAPI community for the amazing web framework

---

<div align="center">

**Built by Eugene Alexander Wongso & Theophila Abigail Setiawan**

[Report Bug](https://github.com/eugenewongso/recruitr/issues) · [Request Feature](https://github.com/eugenewongso/recruitr/issues)

</div>

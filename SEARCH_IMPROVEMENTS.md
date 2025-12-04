# Search Improvements - Presentation Brief

## What We Built

We enhanced Recruitr's search system with **6 key IR components** plus a **user-friendly match labeling system** that makes search results intelligent and easy to understand.

---

## The 6 IR Components

### 1. **Prompt Interpreter** 🧠

**What it does:** Extracts structured filters from plain English

**Example:**

- Input: `"Find remote PMs using Trello with 3-5 years experience"`
- Output:
  - role = "Product Manager"
  - remote = true
  - tools = ["Trello"]
  - min_experience = 3
  - max_experience = 5

**Why it matters:** Users don't need to fill out forms - just type naturally!

---

### 2. **Query Processor** 📝

**What it does:** Normalizes and expands queries with synonyms

**Example:**

- Input: `"WFH PMs using Figma"`
- Output: `"wfh remote work from home pms product manager using figma"`

**Why it matters:** Handles abbreviations and expands search coverage without users needing to know exact terms.

---

### 3. **BM25 with Filters** 🔍

**What it does:** Classic keyword search PLUS post-retrieval filtering

**How it works:**

1. BM25 algorithm ranks by keyword relevance
2. Then filters results by extracted criteria

**Why it matters:** Combines fast keyword search with precise filtering.

---

### 4. **Smart Field Weighting** ⚖️

**What it does:** Makes important fields count more in ranking

**Weights:**

- Job Role: **3x** (most important)
- Tools: **2x** (very important)
- Skills: **1.5x** (important)
- Description: **0.5x** (context only)

**Why it matters:** A "Product Manager" match is 6x more important than description text - ensures relevant results.

---

### 5. **Match Explanations** 💡

**What it does:** Shows WHY each person matches your query

**Example output:**

- ✅ Role: Product Manager
- ✅ Uses Trello, Figma
- ✅ Remote worker
- ✅ Skills: UX Design, Python
- ✅ 4 years of experience

**Why it matters:** Transparency! Users understand the ranking and trust the results.

---

### 6. **Categorical Match Labels** 🎨

**What it does:** Replaces confusing RRF percentages with clear, color-coded quality labels

**The Problem:**

- RRF scores range from 0.009 to 0.033 (very small numbers!)
- Displayed as percentages: 0.9% to 3.3%
- Users see "1% match" and think it's a bad result
- But 1-2% is actually NORMAL and GOOD for RRF!

**The Solution:**
Instead of showing raw scores, we categorize matches:

| Score Range | Label               | Visual         |
| ----------- | ------------------- | -------------- |
| ≥ 0.028     | **Excellent Match** | 🟢 Green badge |
| ≥ 0.023     | **Great Match**     | 🔵 Blue badge  |
| ≥ 0.018     | **Good Match**      | 🟦 Teal badge  |
| ≥ 0.013     | **Fair Match**      | 🟨 Amber badge |
| < 0.013     | **Possible Match**  | ⚪ Gray badge  |

**Example:**

- Before: "Taylor Williams - 2% match" ❌ (looks bad!)
- After: "Taylor Williams - Excellent Match" ✅ (clear and positive!)

**Why it matters:**

- Users immediately understand result quality
- No confusion about low percentages
- Color coding provides quick visual scanning
- Professional, user-friendly interface

**Implementation:** `matchUtils.ts` utility function + updated ParticipantCard components

---

### 7. **Complete Pipeline Integration** 🔄

**What it does:** Connects all components into one smooth flow

**The Flow:**

```
Natural Language Query
    ↓
1. Extract Filters (Prompt Interpreter)
    ↓
2. Expand Synonyms (Query Processor)
    ↓
3. Hybrid Search (BM25 + SBERT + RRF)
    ↓
4. Apply Filters (Post-retrieval)
    ↓
5. Add Explanations (Relevance Explainer)
    ↓
6. Convert Scores to Labels (Match Labels)
    ↓
Ranked Results with Reasons & Quality Labels
```

**Why it matters:** Each component builds on the previous, creating an intelligent end-to-end system.

---

## Technical Implementation

### What We Actually Coded (not using external libraries):

1. **Prompt Interpreter** (`prompt_interpreter.py`)

   - 250+ lines of pattern matching logic
   - Regex for experience, team size extraction
   - Role/tool mappings and company size detection

2. **Query Processor** (`query_processor.py`)

   - Synonym expansion maps
   - Text normalization
   - Term extraction

3. **Filter Logic** (in `bm25_retriever.py`)

   - `_apply_filters()` method
   - `_matches_filters()` method
   - Post-retrieval filtering algorithm

4. **Field Weighting** (in `bm25_retriever.py`)

   - Modified `_create_document()` to repeat important fields
   - Clever trick: repeat "Product Manager" 3x so BM25 scores it higher

5. **Relevance Explainer** (`relevance_explainer.py`)

   - `explain_match()` algorithm
   - Generates top 5 reasons per result
   - Matches query terms to participant fields

6. **Integration** (in `search_service.py`)
   - Modified `search()` method to use all 5 components
   - Added enrichment pipeline
   - Returns expanded query + match reasons

---

## Results

### Before:

- Query: "UX designers who use Slack and work remotely"
- Result: ❌ No matches (too narrow, couldn't extract filters)

### After:

- Query: "UX designers who use Slack and work remotely"
- Result: ✅ Multiple matches with explanations AND quality labels:
  - **[Excellent Match]** Taylor Williams
    - Role: UX Designer
    - Uses Slack, Zoom, Figma
    - Remote worker
    - Skills: UI Design, Prototyping
  - **[Great Match]** Alex Johnson
    - Role: Product Designer
    - Uses Slack, Figma, Adobe XD
    - Remote worker
    - Skills: UI Design, User Research

### Impact:

- **Better Understanding:** Extracts 8+ filter types from natural language
- **Better Coverage:** Synonym expansion finds more results
- **Better Ranking:** Important fields weighted appropriately
- **Better UX:** Match explanations + clear quality labels build trust
- **Better Data:** Improved participant generator for test coverage
- **Better Presentation:** No more confusing 1-2% scores!

---

## For Your Presentation

### The Elevator Pitch:

"We built an intelligent **search + recommender system** that **understands natural language**, **expands queries**, **ranks with weighted fields**, **explains every match**, **labels results clearly**, and **learns from your behavior to suggest relevant queries** - making participant recruitment as easy as typing a sentence."

### Key Talking Points:

1. **Natural Language First:** No forms, no dropdowns - just type naturally
2. **Smart Under the Hood:** 8 components working together (6 IR + 1 UX + 1 Recommender)
3. **Transparent:** Every result has clear explanations AND quality labels
4. **Hybrid Search:** Combines BM25 (keywords) + SBERT (semantic) with RRF
5. **Personalized Recommendations:** Learns from your searches and saves to suggest relevant queries
6. **User-Friendly:** Color-coded match labels, rotating suggestions, seamless auto-updates
7. **Real Implementation:** 1,250+ lines of custom IR + recommender + UX code, not just library calls
8. **Complete IR System:** Both search AND recommender in one platform!

### Demo Script:

**Part 1: Search Functionality**

1. Show query: "remote product managers using Trello"
2. Point out extracted filters in response (remote=true, role="Product Manager", tools=["Trello"])
3. Show expanded query (how "PM" becomes "product manager")
4. Highlight match reasons in results ("Role: Product Manager", "Uses Trello", "Remote worker")
5. Point out color-coded quality labels (Excellent Match in green, Great Match in blue, etc.)
6. Try different queries with abbreviations (PM, WFH, UX) to show real-time processing

**Part 2: Recommender System** ⭐ (NEW!) 7. Point out "Try these example searches" for new users (generic defaults) 8. Make 3 different searches (e.g., "Product Managers", "UX Designers", "Nurses") 9. Show how suggestions change to "✨ Suggested for you:" after 3rd search 10. Refresh the page multiple times - suggestions shuffle and rotate! 11. Emphasize: System learns from YOUR behavior, not generic for everyone 12. Show backend logs: role analysis, pattern detection in action

**Key Message:** A complete IR system with BOTH search AND recommendations!

---

## Files Changed

**New Backend Files (Search):**

- `backend/services/retrieval/prompt_interpreter.py` (250 lines)
- `backend/services/retrieval/query_processor.py` (150 lines)
- `backend/services/retrieval/relevance_explainer.py` (130 lines)

**New Backend Files (Recommender):**

- `backend/services/researcher/recommendation_service.py` (270 lines)

**Modified Backend Files:**

- `backend/services/retrieval/bm25_retriever.py` (+150 lines for filters & weighting)
- `backend/services/retrieval/hybrid_retriever.py` (+10 lines for filter support)
- `backend/services/researcher/search_service.py` (+60 lines for integration)
- `backend/routes/researcher.py` (+50 lines for /search-suggestions endpoint)
- `backend/data/generate_participants.py` (+80 lines for 40 diverse roles, 20 industries, 50+ tools)

**New Frontend Files:**

- `frontend/src/lib/matchUtils.ts` (65 lines - match label utility)
- `frontend/src/services/api/recommendations.ts` (30 lines - recommendations API)

**Modified Frontend Files:**

- `frontend/src/components/researcher/ParticipantCard.tsx` (match label integration)
- `frontend/src/components/researcher/AnimatedParticipantCard.tsx` (match label integration - both list & grid views)
- `frontend/src/pages/researcher/SearchInterface.tsx` (+40 lines for dynamic suggestions)

**Total:** ~1,250 lines of new search + recommender + UX code!

---

## Recommender System: Personalized Query Suggestions

### What It Does

Generates personalized search query suggestions based on user behavior - a true **collaborative filtering recommender system** for search queries!

### How It Works

**1. Behavior Collection:**

- Tracks every search query in `search_history` table
- Tracks saved participants (implicit positive feedback)
- User profile: 20 recent searches + all saved participants

**2. Pattern Detection:**

```
Search History Analysis:
- Extract role mentions from queries ("PM" → Product Manager)
- Count frequency of each role
- Detect remote/onsite preference
- Find common tools in saved participants

Pattern Extraction:
- Top 3-4 roles (weighted: saved 2x, searched 1x)
- Top 3 tools (from saved participants)
- Remote preference (>60% remote → "remote" queries)
- Experience level (average years)
- Company size preference
- Top 2 industries
```

**3. Query Generation:**

```
For each role, generate variants using templates:
- Remote Software Engineer
- Software Engineer using GitHub
- Software Engineer with 5+ years experience
- Software Engineer at startups
- Software Engineer in Healthcare

Generates ~8 candidates, returns top 4 (shuffled for variety)
```

**4. Personalization Threshold:**

- **New Users** (< 3 searches AND < 1 saved) → Generic defaults
- **Active Users** (≥ 3 searches OR ≥ 1 saved) → Personalized suggestions

**5. Diversity & Freshness:**

- Shuffles template order on each request
- Rotates through multiple tools (not always the same one)
- Shuffles final query list
- Auto-refreshes after each search
- Result: Different suggestions on every page load!

### Example Flow

**User Actions:**

1. Searches: "Product Managers at startups"
2. Searches: "Remote UX Designers"
3. Saves: 2 Software Engineers who use GitHub
4. Searches: "Nurses with 5+ years"

**System Analysis:**

```
🎭 Role Frequency:
- Product Manager: 1 (from search)
- UX Designer: 1 (from search)
- Software Engineer: 4 (2 saved × 2x weight)
- Nurse Practitioner: 1 (from search)

Top Roles: Software Engineer, Product Manager, UX Designer
Top Tools: GitHub (from saved participants)
Remote Preference: 50% → neutral
```

**Generated Suggestions (shuffled each time):**

- Refresh 1: "Remote Software Engineer", "Product Manager using GitHub", "UX Designer with 5+ years", "Nurse Practitioner at hospitals"
- Refresh 2: "Software Engineer using GitHub", "UX Designer at startups", "Remote Product Manager", "Software Engineer with 5+ years"
- Refresh 3: "Product Manager at mid-size companies", "Software Engineer using Slack", "Remote UX Designer", "Nurse Practitioner in Healthcare"

### Why It's a Recommender System

**Collaborative Filtering Aspects:**

- Uses implicit feedback (searches + saves = positive signals)
- Finds patterns in user behavior
- Predicts future interests based on past actions
- Balances exploration (variety) vs exploitation (top roles)

**Content-Based Aspects:**

- Analyzes query content (role keywords, tools mentioned)
- Uses participant attributes (roles, tools, industries)
- Generates queries based on feature combinations

**Hybrid Approach:**

- Combines both collaborative (behavior patterns) and content-based (query analysis)
- Perfect for a Search & Recommender Systems class!

### Technical Implementation

**Files:**

- `backend/services/researcher/recommendation_service.py` (270 lines)
- `backend/routes/researcher.py` (+50 lines for endpoint)
- `frontend/src/services/api/recommendations.ts` (30 lines)
- `frontend/src/pages/researcher/SearchInterface.tsx` (+40 lines)

**Key Algorithms:**

- Frequency counting with Counter
- Weighted role aggregation (saved 2x > searched 1x)
- Template-based query generation
- Random shuffling for diversity
- Threshold-based personalization switching

---

## Academic Relevance

This project demonstrates comprehensive understanding of:

### Information Retrieval (Search):

- **Query Understanding & NLP:** Prompt interpretation, entity extraction, role keyword mapping
- **Query Expansion:** Synonym maps, abbreviation handling, multi-term expansion
- **Ranking Algorithms:** BM25 with field weighting (3x role, 2x tools, 1.5x skills)
- **Hybrid Retrieval:** Combining lexical + semantic search with RRF
- **Explainability:** Result explanation generation, match reason highlighting
- **Evaluation:** Improved test data for better coverage (40 roles, 20 industries)

### Recommender Systems:

- **Implicit Feedback:** Using searches and saves as positive signals
- **Collaborative Filtering:** Pattern detection from user behavior
- **Content-Based Filtering:** Query text analysis, role/tool extraction
- **Hybrid Recommendation:** Combining behavioral + content-based signals
- **Cold Start Problem:** Generic defaults for new users, personalization after threshold
- **Diversity:** Randomization, shuffling, and template rotation
- **Online Learning:** Auto-updates after each user interaction

### System Design:

- **User Modeling:** Building user profiles from implicit feedback
- **Pattern Mining:** Frequency analysis, weighted aggregation
- **Threshold-Based Adaptation:** 3 searches OR 1 save triggers personalization
- **Real-Time Updates:** Suggestions refresh after each search

Perfect for an **Information Retrieval / Search & Recommender Systems** class! 🎓

**Total Implementation:** ~1,250 lines of custom IR + recommender code!

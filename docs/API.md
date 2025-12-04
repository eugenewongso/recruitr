# Recruitr API Documentation

Base URL: `http://localhost:8000` (development)

All endpoints (except auth) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication

### POST /auth/signup

Create a new user account.

**Request Body:**

```json
{
  "email": "researcher@example.com",
  "password": "securepassword123",
  "full_name": "Jane Researcher",
  "role": "researcher",
  "company_name": "Tech Corp",
  "job_title": "Product Manager"
}
```

**Response:** `201 Created`

```json
{
  "user": {
    "id": "uuid",
    "email": "researcher@example.com",
    "role": "researcher"
  },
  "session": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here"
  }
}
```

---

### POST /auth/login

Sign in to an existing account.

**Request Body:**

```json
{
  "email": "researcher@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`

```json
{
  "user": {
    "id": "uuid",
    "email": "researcher@example.com",
    "full_name": "Jane Researcher",
    "role": "researcher"
  },
  "session": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here"
  }
}
```

---

### POST /auth/logout

Sign out current user.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "message": "Successfully logged out"
}
```

---

## Researcher Endpoints

### POST /researcher/search

Search for participants using natural language query.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "query": "Find remote product managers who use Trello and manage teams of 5-10 people",
  "limit": 10,
  "filters": {
    "remote": true,
    "tools": ["Trello", "Asana"],
    "min_team_size": 5,
    "max_team_size": 10
  }
}
```

**Response:** `200 OK`

```json
{
  "query": "Find remote product managers...",
  "total_results": 24,
  "results": [
    {
      "id": "uuid",
      "name": "Alex Chen",
      "email": "alex@example.com",
      "role": "Product Manager",
      "company_name": "TechStart",
      "company_size": "10-50",
      "industry": "SaaS",
      "remote": true,
      "team_size": 5,
      "experience_years": 3,
      "tools": ["Trello", "Asana", "Slack"],
      "skills": ["Product Strategy", "User Research"],
      "description": "Product Manager at TechStart...",
      "relevance_score": 0.95,
      "match_reasons": [
        "Remote worker",
        "Uses Trello",
        "Team size: 5 (within range)",
        "Product Manager role"
      ]
    }
    // ... more results
  ],
  "search_time_ms": 247
}
```

---

### GET /researcher/searches

Get search history for current user.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`

```json
{
  "searches": [
    {
      "id": "uuid",
      "query": "remote product managers",
      "filters": {...},
      "results_count": 24,
      "created_at": "2025-10-24T10:30:00Z"
    }
    // ... more searches
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

---

### GET /researcher/searches/:id

Get details of a specific search.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "query": "remote product managers",
  "filters": {...},
  "results_count": 24,
  "results": [...],  // Full participant results
  "created_at": "2025-10-24T10:30:00Z"
}
```

---

### POST /researcher/save/:participant_id

Save/bookmark a participant.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body (optional):**

```json
{
  "notes": "Great fit for our PM tool research",
  "tags": ["high-priority", "contacted"]
}
```

**Response:** `201 Created`

```json
{
  "message": "Participant saved",
  "saved_participant": {
    "id": "uuid",
    "participant_id": "uuid",
    "notes": "Great fit...",
    "tags": ["high-priority"],
    "created_at": "2025-10-24T10:30:00Z"
  }
}
```

---

### DELETE /researcher/save/:participant_id

Remove a saved participant.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "message": "Participant unsaved"
}
```

---

### GET /researcher/saved

Get all saved participants.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`

```json
{
  "saved_participants": [
    {
      "id": "uuid",
      "participant": {
        "id": "uuid",
        "name": "Alex Chen",
        "role": "Product Manager"
        // ... full participant data
      },
      "notes": "Great fit...",
      "tags": ["high-priority"],
      "created_at": "2025-10-24T10:30:00Z"
    }
    // ... more saved participants
  ],
  "total": 8,
  "limit": 50,
  "offset": 0
}
```

---

### POST /researcher/generate-outreach

Generate AI-powered outreach message for a participant.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "participant_id": "uuid",
  "project_name": "Task Management Research",
  "project_description": "We're building a lightweight task management tool for startups",
  "tone": "friendly", // optional: friendly, professional, casual
  "length": "medium" // optional: short, medium, long
}
```

**Response:** `200 OK`

```json
{
  "message": "Hi Alex,\n\nI noticed you're a Product Manager at TechStart and currently use Trello for project management. We're developing a new lightweight task management app specifically designed for small startup teams, and I'd love to get your insights.\n\nWould you be available for a 30-minute video chat to share your experience with current tools and what features would make your workflow smoother?\n\nLooking forward to hearing from you!\n\nBest regards",
  "participant": {
    "name": "Alex Chen",
    "email": "alex@example.com"
  },
  "metadata": {
    "model": "gpt-4",
    "tokens_used": 187,
    "generation_time_ms": 1243
  }
}
```

---

### POST /researcher/generate-questions

Generate AI-suggested interview questions.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "participant_id": "uuid",
  "project_type": "task_management",
  "research_goals": ["pain points", "feature preferences", "workflow"],
  "num_questions": 10
}
```

**Response:** `200 OK`

```json
{
  "questions": [
    {
      "question": "What are the biggest challenges you face when managing tasks across your team?",
      "category": "pain_points",
      "follow_up": "Can you walk me through a recent example?"
    },
    {
      "question": "What features of Trello do you use most frequently, and why?",
      "category": "feature_usage"
    },
    {
      "question": "If you could change one thing about your current task management workflow, what would it be?",
      "category": "improvement"
    }
    // ... more questions
  ],
  "participant": {
    "name": "Alex Chen",
    "role": "Product Manager",
    "tools": ["Trello", "Asana"]
  }
}
```

---

### POST /researcher/export

Export search results in various formats.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "search_id": "uuid", // or provide participant_ids directly
  "participant_ids": ["uuid1", "uuid2"], // optional if search_id provided
  "format": "csv", // csv, json, or xlsx
  "fields": ["name", "email", "role", "company_name", "tools"] // optional
}
```

**Response:** `200 OK`

```
Content-Type: text/csv (or application/json, application/vnd.openxmlformats)
Content-Disposition: attachment; filename="participants.csv"

name,email,role,company_name,tools
Alex Chen,alex@example.com,Product Manager,TechStart,"Trello,Asana,Slack"
...
```

---

## Profile Endpoint

### GET /researcher/profile

Get current user's profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "email": "researcher@example.com",
  "full_name": "Jane Researcher",
  "role": "researcher",
  "company_name": "Tech Corp",
  "job_title": "Product Manager",
  "created_at": "2025-10-01T10:00:00Z"
}
```

---

### PUT /researcher/profile

Update current user's profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body (all fields optional):**

```json
{
  "full_name": "Jane Smith",
  "company_name": "New Company",
  "job_title": "Senior Product Manager"
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "email": "researcher@example.com",
  "full_name": "Jane Smith",
  "company_name": "New Company",
  "job_title": "Senior Product Manager"
}
```

---

## Health & Info Endpoints

### GET /

Root endpoint.

**Response:** `200 OK`

```json
{
  "message": "Welcome to Recruitr API",
  "version": "1.0.0",
  "status": "operational",
  "docs": "/docs"
}
```

---

### GET /health

Health check endpoint.

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "environment": "development"
}
```

---

## Error Responses

All endpoints return errors in the following format:

**400 Bad Request**

```json
{
  "detail": "Invalid request body",
  "errors": [
    {
      "field": "query",
      "message": "Query is required"
    }
  ]
}
```

**401 Unauthorized**

```json
{
  "detail": "Authentication required"
}
```

**403 Forbidden**

```json
{
  "detail": "Access denied. Required role: researcher"
}
```

**404 Not Found**

```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error**

```json
{
  "detail": "An internal error occurred",
  "request_id": "uuid"
}
```

---

## Rate Limiting

- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **LLM endpoints**: 20 requests/minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698246000
```

---

## Interactive Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These include:

- Try-it-out functionality
- Request/response schemas
- Authentication flows
- Example requests

---

## Webhooks (Phase 2 - Future)

Future webhook support for:

- New participant matches
- Interview request responses
- Profile updates

---

## Versioning

API version is specified in the URL path (future):

- v1: `/api/v1/...` (current, no prefix yet)
- v2: `/api/v2/...` (future breaking changes)

Current API has no version prefix and is considered v1.

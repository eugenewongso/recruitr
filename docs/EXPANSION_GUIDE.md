# Expansion Guide: Phase 1 → Phase 2

This guide explains how to expand Recruitr from a **researcher-only platform (Phase 1)** to a **two-sided platform (Phase 2)** with participant accounts and interview requests.

---

## Current State (Phase 1)

✅ **What's Implemented:**

- Researcher authentication and dashboard
- Participant search with hybrid IR (BM25 + SBERT)
- AI-generated outreach messages and interview questions
- Search history and saved participants
- Synthetic participant data (no real user accounts)

❌ **What's Not Implemented (yet):**

- Participant user accounts
- Participants can't log in or manage profiles
- Interview request workflow
- Notifications
- Two-way communication

---

## Architecture Differences

### Phase 1 (Current)

```
Researcher → Search → Synthetic Participant Data
(One-sided)
```

### Phase 2 (Target)

```
Researcher ←→ Interview Requests ←→ Participant
(Two-sided marketplace)
```

---

## Expansion Checklist

### Backend Changes

#### ✅ Already Done (Infrastructure Ready)

- [x] Database schema includes all Phase 2 tables
- [x] `interview_requests` table exists
- [x] RLS policies defined for participants
- [x] User roles enum includes `participant`
- [x] Service directories structure (`services/participant/`)
- [x] Route placeholders (`routes/participant.py`)

#### 📋 TODO: Backend Implementation

**1. Participant Authentication**

File: `routes/participant.py`

```python
# Add signup endpoint specifically for participants
@router.post("/signup")
async def participant_signup(data: ParticipantSignupRequest):
    # 1. Create auth user in Supabase
    # 2. Create profile with role='participant'
    # 3. Create participant record linked to user_id
    # 4. Set is_synthetic=False
    pass
```

**2. Profile Management Service**

File: `services/participant/profile_service.py`

```python
class ParticipantProfileService:
    def get_profile(self, user_id: str):
        # Get participant data linked to user_id
        pass

    def update_profile(self, user_id: str, data: ProfileUpdate):
        # Update participant record
        # Regenerate embedding if description changed
        pass

    def update_availability(self, user_id: str, accepting: bool):
        # Set accepting_interviews flag
        pass
```

**3. Interview Request Service**

File: `services/participant/request_service.py`

```python
class RequestService:
    def get_requests(self, participant_id: str):
        # Get all interview requests for this participant
        pass

    def respond_to_request(self, request_id: str, status: str, message: str):
        # Accept or decline interview request
        pass

    def send_request(self, researcher_id: str, participant_id: str, data: RequestData):
        # Researcher sends interview request
        # TODO: Send notification
        pass
```

**4. Update Retrieval to Exclude Linked Participants (Optional)**

File: `services/retrieval/hybrid_retriever.py`

```python
# Modify search to filter:
# - Only show participants with is_synthetic=True OR accepting_interviews=True
# - Optionally hide participants the researcher already contacted
```

**5. Notification System (Future)**

File: `services/notification_service.py`

```python
# Email notifications when:
# - Researcher sends interview request → notify participant
# - Participant responds → notify researcher
#
# Use: SendGrid, AWS SES, or Supabase Edge Functions
```

---

### Frontend Changes

#### ✅ Already Done (Infrastructure Ready)

- [x] Directory structure includes `components/participant/`
- [x] Pages structure includes `pages/participant/`
- [x] UserRole enum includes `participant`
- [x] Route protection supports role-based access
- [x] AuthContext ready for multiple roles

#### 📋 TODO: Frontend Implementation

**1. Participant Signup Flow**

File: `pages/auth/Signup.tsx`

```typescript
// Add role selection during signup
<select name="role">
  <option value="researcher">I'm a Researcher</option>
  <option value="participant">I'm a Participant</option>
</select>

// If participant selected:
// - Show different onboarding fields
// - Create participant profile with tools, role, etc.
```

**2. Participant Dashboard**

File: `pages/participant/Dashboard.tsx`

```typescript
// Show:
// - Profile completion status
// - Pending interview requests
// - Accepted/upcoming interviews
// - Profile views/interest metrics
```

**3. Profile Editor**

File: `components/participant/ProfileEditor.tsx`

```typescript
interface ProfileEditorProps {
  profile: ParticipantProfile;
  onSave: (updated: ParticipantProfile) => void;
}

// Editable fields:
// - Name, role, company, experience
// - Tools used (multi-select)
// - Skills (tags)
// - Description (textarea)
// - Availability toggle
```

**4. Interview Request Components**

File: `components/participant/RequestList.tsx`

```typescript
// Display list of interview requests
// Filter by status: pending, accepted, declined
```

File: `components/participant/RequestCard.tsx`

```typescript
// Show:
// - Researcher info
// - Project description
// - Compensation offered
// - Buttons: Accept | Decline
```

**5. Researcher: Send Request Button**

File: `components/researcher/ParticipantModal.tsx`

```typescript
// Add "Send Interview Request" button
// Opens modal to compose request message
// Submits to POST /researcher/requests
```

**6. Update Routing**

File: `App.tsx`

```typescript
// Uncomment participant routes:
<Route
  path="/participant/*"
  element={
    <ProtectedRoute allowedRoles={[UserRole.PARTICIPANT]}>
      <Routes>
        <Route path="dashboard" element={<ParticipantDashboard />} />
        <Route path="profile" element={<ParticipantProfile />} />
        <Route path="requests" element={<ParticipantRequests />} />
      </Routes>
    </ProtectedRoute>
  }
/>
```

---

### Database Changes

#### ✅ Schema Already Supports Phase 2!

No migrations needed. Just enable features:

**1. Link Participants to Users**

When a real participant signs up:

```sql
-- Create auth user (via Supabase)
-- Then link to participants table:
UPDATE participants
SET user_id = 'new_user_uuid',
    is_synthetic = false
WHERE email = 'participant@example.com';
```

**2. Update Search Function (Optional)**

```sql
-- Modify match_participants to respect accepting_interviews flag
CREATE OR REPLACE FUNCTION match_participants(...)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT ...
    WHERE ...
      AND (is_synthetic = true OR accepting_interviews = true)
    ...
END;
$$;
```

---

## Step-by-Step Migration

### Week 1: Backend Foundation

1. **Implement participant authentication**

   - `routes/participant.py` → signup, login
   - Link to existing participant records by email

2. **Profile management service**

   - Get/update profile
   - Handle embedding regeneration

3. **Request service basics**
   - Get requests for participant
   - Accept/decline functionality

### Week 2: Frontend UI

1. **Participant dashboard**

   - Profile view
   - Request list

2. **Profile editor**

   - Form with all fields
   - Update API integration

3. **Request management**
   - Request cards
   - Accept/decline buttons

### Week 3: Integration

1. **Researcher → Participant flow**

   - Add "Send Request" button
   - Request composition modal

2. **Notifications (basic)**

   - Email on new request (SendGrid/SES)
   - Email on response

3. **Testing**
   - Create test participant accounts
   - Send test requests
   - Verify RLS policies

### Week 4: Polish

1. **UI refinements**

   - Loading states
   - Error handling
   - Animations

2. **Analytics**

   - Track request acceptance rate
   - Profile views

3. **Documentation**
   - Update API docs
   - User guides for both roles

---

## Testing Checklist

### Participant Features

- [ ] Participant can sign up
- [ ] Participant can log in
- [ ] Participant sees their profile
- [ ] Participant can edit profile
- [ ] Profile updates regenerate embeddings
- [ ] Participant appears in search results
- [ ] Participant can view interview requests
- [ ] Participant can accept requests
- [ ] Participant can decline requests
- [ ] Notifications are sent correctly

### Researcher Features

- [ ] Researchers can find real participants (not just synthetic)
- [ ] Researchers can send interview requests
- [ ] Researchers receive notifications on responses
- [ ] Search respects `accepting_interviews` flag

### Security

- [ ] Participants can't see other participants' data
- [ ] Researchers can't edit participant profiles
- [ ] RLS policies work correctly
- [ ] JWT tokens validate properly

---

## Code Examples

### Backend: Participant Signup

```python
# routes/participant.py
from fastapi import APIRouter, HTTPException
from database import supabase
from sentence_transformers import SentenceTransformer

router = APIRouter()

@router.post("/signup")
async def participant_signup(data: ParticipantSignupRequest):
    # 1. Create Supabase auth user
    auth_response = supabase.auth.sign_up({
        "email": data.email,
        "password": data.password
    })

    user_id = auth_response.user.id

    # 2. Create profile
    profile = {
        "id": user_id,
        "email": data.email,
        "full_name": data.full_name,
        "role": "participant"
    }
    supabase.table("profiles").insert(profile).execute()

    # 3. Create/update participant record
    model = SentenceTransformer('all-MiniLM-L6-v2')
    description = f"{data.role} at {data.company_name}..."
    embedding = model.encode(description).tolist()

    participant = {
        "user_id": user_id,
        "name": data.full_name,
        "email": data.email,
        "role": data.role,
        "tools": data.tools,
        "description": description,
        "embedding": embedding,
        "is_synthetic": False
    }
    supabase.table("participants").insert(participant).execute()

    return {"user": auth_response.user, "session": auth_response.session}
```

### Frontend: Participant Dashboard

```typescript
// pages/participant/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { getProfile, getRequests } from "@/services/api/participant";

const ParticipantDashboard: React.FC = () => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [profileData, requestsData] = await Promise.all([
        getProfile(),
        getRequests(),
      ]);
      setProfile(profileData);
      setRequests(requestsData);
    }
    loadData();
  }, []);

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>

      {/* Profile Card */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <p>
          <strong>Role:</strong> {profile?.role}
        </p>
        <p>
          <strong>Experience:</strong> {profile?.experience_years} years
        </p>
        <button className="btn-primary mt-4">Edit Profile</button>
      </div>

      {/* Requests */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          Interview Requests ({pendingRequests.length} pending)
        </h2>
        {pendingRequests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
};

export default ParticipantDashboard;
```

---

## Estimated Effort

| Task                             | Time Estimate                         |
| -------------------------------- | ------------------------------------- |
| Backend (auth, services, routes) | 15-20 hours                           |
| Frontend (pages, components)     | 20-25 hours                           |
| Integration & testing            | 10-15 hours                           |
| Notifications (basic email)      | 5-10 hours                            |
| Polish & bug fixes               | 10-15 hours                           |
| **Total**                        | **60-85 hours** (2-3 weeks full-time) |

---

## Support & Resources

If you decide to implement Phase 2:

1. **Database:** Schema is ready, no changes needed
2. **Backend:** Follow service structure in `services/participant/`
3. **Frontend:** Uncomment routes and build components
4. **Testing:** Use Supabase test environment
5. **Deployment:** Same process, just enable new routes

The architecture is designed to make this expansion straightforward!

---

## Questions?

Contact the development team:

- Eugene: eugeneaw@uw.edu
- Theophila: tsetia@uw.edu

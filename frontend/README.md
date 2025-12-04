# Recruitr Frontend

React + TypeScript + Vite frontend for Recruitr participant search platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your Supabase credentials
```

### Development

```bash
# Start dev server (with hot reload)
npm run dev
```

App runs at: `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── main.tsx                 # App entry point
├── App.tsx                  # Main app component & routing
├── index.css                # Global styles (Tailwind)
│
├── components/              # React components
│   ├── common/             # Shared components
│   │   ├── Navbar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   │
│   ├── researcher/         # Researcher UI (Phase 1)
│   │   ├── SearchBar.tsx          # Natural language input
│   │   ├── ParticipantList.tsx    # Results grid
│   │   ├── ParticipantCard.tsx    # Individual result
│   │   ├── ParticipantModal.tsx   # Detail view
│   │   ├── OutreachPanel.tsx      # AI message generation
│   │   ├── FilterPanel.tsx        # Advanced filters
│   │   └── ExportPanel.tsx        # Export functionality
│   │
│   └── participant/        # Participant UI (Phase 2 - future)
│       ├── ProfileEditor.tsx
│       ├── RequestList.tsx
│       └── RequestCard.tsx
│
├── pages/                   # Page components
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   │
│   ├── researcher/
│   │   ├── Dashboard.tsx          # Main search interface
│   │   ├── SearchResults.tsx      # Results view
│   │   └── SavedSearches.tsx      # Search history
│   │
│   └── participant/        # (Phase 2 - future)
│       ├── Dashboard.tsx
│       ├── Profile.tsx
│       └── Requests.tsx
│
├── services/                # API integration
│   ├── api/
│   │   ├── base.ts               # Axios base client
│   │   ├── auth.ts               # Auth API
│   │   ├── researcher.ts         # Researcher endpoints
│   │   └── participant.ts        # Participant endpoints (future)
│   │
│   └── supabase.ts              # Supabase client
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts               # Authentication
│   ├── useSearch.ts             # Search logic
│   └── useRole.ts               # Role-based routing
│
├── types/                   # TypeScript definitions
│   ├── user.ts                  # User & role types
│   ├── participant.ts           # Participant types
│   └── search.ts                # Search types
│
├── context/                 # React Context
│   └── AuthContext.tsx          # Auth state management
│
├── lib/                     # Utility functions
│   ├── utils.ts                 # General utilities (cn helper)
│   └── matchUtils.ts            # Match quality label utilities
│
├── routes/                  # Route components
│   ├── ProtectedRoute.tsx       # Auth protection
│   ├── ResearcherRoutes.tsx     # Researcher routes
│   └── ParticipantRoutes.tsx    # Participant routes (future)
│
└── utils/                   # Utilities
    ├── permissions.ts           # Permission helpers
    └── constants.ts             # App constants
```

## 🎨 Design System

### Colors

- **Primary (Indigo)**: `#6366f1` - CTAs, buttons, highlights
- **Secondary (Purple)**: `#8b5cf6` - Accents
- **Success (Green)**: `#10b981` - Positive actions
- **Background**: `#f9fafb` - Main background
- **Card**: `#ffffff` - Cards and panels

### Match Quality Labels

Search results display categorical quality indicators instead of raw scores:

- **Excellent Match** - Green badge (`bg-green-50`, `text-green-700`)
- **Great Match** - Blue badge (`bg-blue-50`, `text-blue-700`)
- **Good Match** - Teal badge (`bg-teal-50`, `text-teal-700`)
- **Fair Match** - Amber badge (`bg-amber-50`, `text-amber-700`)
- **Possible Match** - Gray badge (`bg-gray-50`, `text-gray-700`)

_Implementation: `lib/matchUtils.ts` converts RRF scores to user-friendly labels_

### Typography

- **Font**: Inter (Google Fonts)
- **Sizes**: Tailwind default scale

### Components

- Clean, modern design with Tailwind CSS
- Responsive layouts (mobile, tablet, desktop)
- Smooth animations and transitions
- Loading skeletons for better UX
- Micro-interactions on hover/click

## 🔐 Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Building

```bash
# Production build
npm run build

# Build output goes to dist/
```

## 🛠️ Development Tools

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

### Type Checking

```bash
npx tsc --noEmit
```

## 🔄 Adding New Features

### 1. Create Component

```typescript
// src/components/researcher/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  // props
}

export const NewComponent: React.FC<NewComponentProps> = ({ }) => {
  return (
    <div>
      {/* component UI */}
    </div>
  );
};
```

### 2. Create Page

```typescript
// src/pages/researcher/NewPage.tsx
import React from 'react';

const NewPage: React.FC = () => {
  return (
    <div>
      {/* page content */}
    </div>
  );
};

export default NewPage;
```

### 3. Add Route

```typescript
// In App.tsx
<Route path="/researcher/new-page" element={<NewPage />} />
```

## 🔌 API Integration

```typescript
// Use the API services
import { searchParticipants } from "@/services/api/researcher";

const results = await searchParticipants({
  query: "remote product managers",
  limit: 10,
});
```

## 🎯 Phase 1 vs Phase 2

### Phase 1 (Current) - Researcher-Only

- ✅ Researcher authentication
- ✅ Participant search
- ✅ AI-generated outreach
- ✅ Export functionality

### Phase 2 (Future) - Two-Sided Platform

- 📦 Participant authentication
- 📦 Profile management
- 📦 Interview requests
- 📦 Notifications

Components for Phase 2 are already structured but commented out.

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check types
npx tsc --noEmit
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

Build command: `npm run build`  
Output directory: `dist`

# Frontend Setup Instructions

## ✅ What's Already Configured

Your project already has:

- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS
- ✅ Path aliases (`@/*` imports)
- ✅ Custom color palette (primary & secondary)

## 📦 Install Dependencies

Run this command in the `/frontend` directory:

```bash
npm install
```

This will install all the new dependencies:

- `framer-motion` - Smooth animations for the sidebar and UI
- `lucide-react` - Beautiful icon library
- `clsx` - Utility for conditional classes
- `tailwind-merge` - Merge Tailwind classes properly

## 🚀 Start Development Server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 🎨 What's Been Created

### New Components

1. **Sidebar** (`src/components/ui/sidebar.tsx`)
   - Animated collapsible sidebar
   - Desktop & mobile responsive
   - Hover to expand on desktop
   - Click menu icon on mobile

2. **Researcher Dashboard** (`src/pages/researcher/Dashboard.tsx`)
   - Main dashboard with sidebar navigation
   - Three views: Search, Saved, History
   - Modern gradient logo

3. **Search Interface** (`src/pages/researcher/SearchInterface.tsx`)
   - Natural language search input
   - Collapsible filters
   - Example queries
   - Results grid (ready for API integration)

4. **Auth Pages**
   - Login (`src/pages/auth/Login.tsx`)
   - Signup (`src/pages/auth/Signup.tsx`)
   - Beautiful gradient backgrounds
   - Form validation ready

5. **Updated Components**
   - `ParticipantCard` - Modern card design with animations
   - `LoadingSpinner` - Configurable sizes
   - `App.tsx` - All routes connected

### Utility Files

- `src/lib/utils.ts` - Contains `cn()` function for merging Tailwind classes

## 📱 Navigation Structure

```
/ (Landing Page)
├── /login
├── /signup
└── /researcher (Dashboard)
    ├── Search (default)
    ├── Saved Participants
    └── Search History
```

## 🎯 Next Steps for Integration

### 1. Connect to Backend API

Update `src/pages/researcher/SearchInterface.tsx`:

```typescript
// Replace the mock search function with real API call
import { searchParticipants } from "@/services/api/researcher";

const handleSearch = async () => {
  try {
    const response = await searchParticipants(query);
    setResults(response.data.results);
  } catch (error) {
    console.error("Search failed:", error);
  }
};
```

### 2. Implement Authentication

Create `src/context/AuthContext.tsx`:

- Connect to Supabase Auth
- Manage user session
- Protected routes

### 3. Add Features

- Implement save/bookmark functionality
- Add search history tracking
- Export to CSV functionality
- Generate outreach messages with LLM

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to change the color scheme:

```js
colors: {
  primary: { /* Your primary colors */ },
  secondary: { /* Your secondary colors */ }
}
```

### Animations

All animations use Framer Motion. Adjust in component files:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

## 🐛 Troubleshooting

**Import errors?**

```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors?**

```bash
npm run build
```

**Styles not applying?**

- Restart dev server after Tailwind config changes
- Check if Tailwind classes are in the `content` array

## 🎓 Key Technologies Used

- **React Router** - For navigation (`Link`, `useNavigate`)
- **Framer Motion** - For animations (`motion.div`, `AnimatePresence`)
- **Lucide React** - For icons (`Search`, `Sparkles`, etc.)
- **Tailwind CSS** - For styling
- **TypeScript** - For type safety

## 📖 Component Documentation

### Sidebar

```tsx
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

<Sidebar open={open} setOpen={setOpen}>
  <SidebarBody>
    <SidebarLink link={{ label: "Dashboard", href: "#", icon: <Icon /> }} />
  </SidebarBody>
</Sidebar>;
```

### ParticipantCard

```tsx
import ParticipantCard from "@/components/researcher/ParticipantCard";

<ParticipantCard
  participant={participant}
  onSave={(id) => console.log("Save:", id)}
  onGenerateOutreach={(id) => console.log("Generate:", id)}
/>;
```

---

**Ready to build! 🚀**

The frontend is now fully set up with a beautiful, modern UI. Focus on connecting the backend API and implementing the search functionality!

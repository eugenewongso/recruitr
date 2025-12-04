/**
 * Recruitr Main Application Component
 * Handles routing and authentication
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ResearcherDashboard from "@/pages/researcher/Dashboard";
import SearchInterface from "@/pages/researcher/SearchInterface";
import SavedParticipants from "@/pages/researcher/SavedParticipants";
import ParticipantDetail from "@/pages/researcher/ParticipantDetail";
import Drafts from "@/pages/researcher/Drafts";
import OutreachPage from "@/pages/researcher/OutreachPage";
import SearchHistory from "@/pages/researcher/SearchHistory";
import Analytics from "@/pages/researcher/Analytics";
import Profile from "@/pages/researcher/Profile";
import Projects from "@/pages/researcher/Projects";
import ProjectDetail from "@/pages/researcher/ProjectDetail";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Toaster } from "@/components/ui/toaster";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Toaster />
      <Routes>
        {/* Landing / Root */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

          {/* Researcher Routes (Protected) */}
          <Route
            path="/researcher"
            element={
              <ProtectedRoute>
                <ResearcherDashboard />
              </ProtectedRoute>
            }
          >
          <Route index element={<Navigate to="/researcher/projects" replace />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:projectId" element={<ProjectDetail />} />
          <Route path="search" element={<SearchInterface />} />
          <Route path="saved" element={<SavedParticipants />} />
          <Route path="participant/:id" element={<ParticipantDetail />} />
            <Route path="drafts" element={<Drafts />} />
            <Route path="outreach" element={<OutreachPage />} />
          <Route path="history" element={<SearchHistory />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Participant Routes (Phase 2 - Future) */}
        {/* <Route path="/participant/*" element={<div>Participant Dashboard (TODO)</div>} /> */}

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * Landing Page with Animated Gradient Background
 */
function LandingPage() {
  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(255, 247, 230)"
      gradientBackgroundEnd="rgb(255, 240, 200)"
      firstColor="255, 164, 0"
      secondColor="251, 191, 36"
      thirdColor="255, 210, 100"
      fourthColor="160, 185, 220"
      fifthColor="120, 150, 200"
      pointerColor="180, 197, 228"
      size="120%"
      blendingValue="normal"
      interactive={true}
    >
      <div className="absolute z-50 inset-0 flex items-center justify-center px-4 pointer-events-none">
        <div className="text-center text-white pointer-events-auto">
          <div className="inline-flex items-center justify-center gap-3 mb-6 animate-fade-in">
            <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <img
                src="/recruitr-logo.png"
                alt="Recruitr"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 drop-shadow-2xl animate-slide-up" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            Recruitr
          </h1>

          <p className="text-xl md:text-2xl mb-12 text-white max-w-2xl mx-auto font-semibold animate-slide-up" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
            AI-Assisted Participant Finder for User Research
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <Link to="/login">
              <InteractiveHoverButton
                text="Sign In"
                className="w-48 h-14 text-lg bg-white/30 backdrop-blur-xl border-white/50 hover:bg-white/40 hover:border-white/70 hover:scale-105 hover:shadow-xl transition-all duration-300"
              />
            </Link>
            <Link to="/signup">
              <InteractiveHoverButton
                text="Get Started"
                className="w-48 h-14 text-lg bg-primary-500 border-primary-500 hover:bg-primary-700 hover:scale-105 hover:shadow-2xl transition-all duration-300"
              />
            </Link>
          </div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}

export default App;

/**
 * Researcher Dashboard - Top Navbar Layout (PolicyPilot Style)
 */

import React, { useEffect, useState } from "react";
import {
  Search,
  BookmarkCheck,
  History,
  BarChart3,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/ui/notifications-dropdown";
import { useAuth, supabase } from "@/context/AuthContext";

export default function ResearcherDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Researcher";
  const initial = displayName[0]?.toUpperCase() || "R";

  const isActive = (path: string) =>
    location.pathname === `/researcher/${path}`;

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="bg-card border-b border-border sticky top-0 z-50 transition-colors duration-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/researcher"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 bg-primary rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="/recruitr-logo.png"
                  alt="Recruitr"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold text-primary tracking-tight">
                Recruitr
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink
                label="Projects"
                href="/researcher/projects"
                icon={<Sparkles className="h-4 w-4" />}
                active={isActive("projects") || location.pathname.startsWith("/researcher/projects")}
              />
              <NavLink
                label="Search"
                href="/researcher/search"
                icon={<Search className="h-4 w-4" />}
                active={isActive("search")}
              />
              <NavLink
                label="Saved"
                href="/researcher/saved"
                icon={<BookmarkCheck className="h-4 w-4" />}
                active={isActive("saved")}
              />
              <NavLink
                label="Drafts"
                href="/researcher/drafts"
                icon={<FileText className="h-4 w-4" />}
                active={isActive("drafts")}
              />
              <NavLink
                label="History"
                href="/researcher/history"
                icon={<History className="h-4 w-4" />}
                active={isActive("history")}
              />
              <NavLink
                label="Analytics"
                href="/researcher/analytics"
                icon={<BarChart3 className="h-4 w-4" />}
                active={isActive("analytics")}
              />
            </div>

            {/* Right Side - User & Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationsDropdown />

              <div className="h-8 w-px bg-border mx-2"></div>

              {/* User Profile */}
              <Link to="/researcher/profile">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {initial}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{displayName}</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Area */}
        <Outlet />
      </main>
    </div>
  );
}

// Nav Link Component
function NavLink({
  label,
  href,
  icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-accent text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

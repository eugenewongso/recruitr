/**
 * Dedicated Outreach Page
 * Full-page experience for managing outreach campaigns
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutreachContent } from "@/components/researcher/OutreachContent";
import { generateOutreach } from "@/services/api/researcher";

interface Participant {
  id: string;
  name: string;
  role: string;
  company_name?: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
  participant_name: string;
}

export default function OutreachPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadedDraft, setLoadedDraft] = useState<any>(null);
  const [fromPage, setFromPage] = useState<string>("search");
  const [hasUnsavedEmails, setHasUnsavedEmails] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    // Load state from navigation
    if (location.state) {
      const {
        participants: navParticipants,
        loadedDraft: navDraft,
        from,
      } = location.state as any;
      if (navParticipants) {
        setParticipants(navParticipants);
      }
      if (navDraft) {
        setLoadedDraft(navDraft);
        setDraftName(navDraft.name || "");
      }
      if (from) {
        setFromPage(from);
      }
    }
  }, [location.state]);

  const handleGenerate = async (
    participantIds: string[]
  ): Promise<GeneratedEmail[]> => {
    try {
      const response = await generateOutreach(participantIds);
      setHasUnsavedEmails(true); // Mark as having unsaved work
      return response.emails;
    } catch (error) {
      console.error("Failed to generate outreach:", error);
      throw error;
    }
  };

  const handleMinimize = () => {
    // Warn if there are unsaved generated emails
    if (hasUnsavedEmails) {
      const confirmLeave = window.confirm(
        "You have unsaved emails. They will be lost unless you save as draft. Do you want to leave anyway?"
      );
      if (!confirmLeave) return;
    }

    if (fromPage === "drafts") {
      navigate("/researcher/drafts");
    } else if (fromPage === "project") {
      // Go back to the project detail page
      const projectId = (location.state as any)?.projectId;
      if (projectId) {
        navigate(`/researcher/projects/${projectId}`);
      } else {
        navigate("/researcher/projects");
      }
    } else {
      // Default: Navigate back to search and reopen modal with current state
      navigate("/researcher/search", {
        state: {
          reopenOutreachModal: true,
          participants,
          loadedDraft,
        },
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200  mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {loadedDraft && isEditingName ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                    if (e.key === "Escape") {
                      setDraftName(loadedDraft.name);
                      setIsEditingName(false);
                    }
                  }}
                  onBlur={() => setIsEditingName(false)}
                  className="text-3xl font-bold bg-transparent border-none outline-none focus:outline-none text-foreground w-full"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold text-foreground">
                  {loadedDraft ? draftName : "Compose Outreach"}
                </h1>
                {loadedDraft && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-accent rounded"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}
            {participants.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {participants.length} recipient
                {participants.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button
            onClick={handleMinimize}
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            {fromPage === "drafts"
              ? "Back to Drafts"
              : fromPage === "project"
                ? "Back to Project"
                : "Back to Search"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {participants.length > 0 ? (
          <OutreachContent
            participants={participants}
            onParticipantsChange={setParticipants}
            onGenerate={handleGenerate}
            loadedDraft={
              loadedDraft ? { ...loadedDraft, name: draftName } : null
            }
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900  mb-2">
                No participants selected
              </h3>
              <p className="text-muted-foreground mb-4">
                Go to the search page to select participants
              </p>
              <Button onClick={() => navigate("/researcher/search")}>
                Go to Search
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

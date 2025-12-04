/**
 * Drafts Page - View and manage saved outreach drafts
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Mail, Trash2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getDrafts, deleteDraft, type OutreachDraft } from "@/services/api/drafts";

export default function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const response = await getDrafts();
      setDrafts(response.drafts);
    } catch (error) {
      console.error("Failed to load drafts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    setDeletingId(draftId);
    try {
      await deleteDraft(draftId);
      setDrafts(drafts.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Failed to delete draft:", error);
      alert("Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground text-foreground">
          Outreach Drafts
        </h1>
        <p className="text-muted-foreground  mt-1">
          Resume working on your saved outreach campaigns
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner variant="bars" size={48} className="text-primary" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No drafts yet
            </h3>
            <p className="text-muted-foreground">
              Save outreach campaigns as drafts to continue working on them later
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card
              key={draft.id}
              className="hover:shadow-lg transition-all duration-200 border-border"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 text-foreground mb-2">
                      {draft.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{draft.participants.length} participant{draft.participants.length !== 1 ? "s" : ""}</span>
                      </div>
                      
                      {draft.generated_emails && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />
                          <span>{draft.generated_emails.length} email{draft.generated_emails.length !== 1 ? "s" : ""} generated</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(draft.created_at)}</span>
                      </div>
                    </div>

                    {/* Participant Previews */}
                    <div className="flex flex-wrap gap-2">
                      {draft.participants.slice(0, 3).map((participant) => (
                        <div
                          key={participant.id}
                          className="px-3 py-1 rounded-full bg-secondary text-xs text-secondary-foreground"
                        >
                          {participant.name}
                        </div>
                      ))}
                      {draft.participants.length > 3 && (
                        <div className="px-3 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                          +{draft.participants.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      onClick={() => {
                        navigate("/researcher/outreach", {
                          state: {
                            participants: draft.participants,
                            loadedDraft: {
                              id: draft.id,
                              name: draft.name,
                              generated_emails: draft.generated_emails,
                            },
                            from: "drafts",
                          },
                        });
                      }}
                      className="bg-primary text-primaryforeground hover:bg-primary/90"
                    >
                      Resume
                    </Button>
                    <Button
                      onClick={() => handleDelete(draft.id)}
                      variant="outline"
                      size="icon"
                      disabled={deletingId === draft.id}
                      className="text-destructive hover:bg-destructive"
                    >
                      {deletingId === draft.id ? (
                        <Spinner variant="bars" size={16} />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


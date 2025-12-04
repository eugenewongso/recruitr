/**
 * Shared Outreach Content Component
 * Used by both modal and dedicated page
 */

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Loader2,
  User,
  Save,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/ToastContext";

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

interface OutreachContentProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  onGenerate: (participantIds: string[]) => Promise<GeneratedEmail[]>;
  onEmailsGenerated?: () => void;
  loadedDraft?: {
    id: string;
    name: string;
    generated_emails?: GeneratedEmail[];
  } | null;
}

export function OutreachContent({
  participants,
  onParticipantsChange,
  onGenerate,
  onEmailsGenerated,
  loadedDraft,
}: OutreachContentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [editedEmails, setEditedEmails] = useState<Map<number, GeneratedEmail>>(
    new Map()
  );
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [showDraftNameInput, setShowDraftNameInput] = useState(false);

  // Load draft data
  useEffect(() => {
    if (loadedDraft) {
      setDraftName(loadedDraft.name);
      if (loadedDraft.generated_emails) {
        setGeneratedEmails(loadedDraft.generated_emails);
      }
    } else {
      setGeneratedEmails([]);
      setDraftName("");
    }
    setEditedEmails(new Map());
    setShowDraftNameInput(false);
  }, [loadedDraft]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 10;
      });
    }, 300);

    try {
      const participantIds = participants.map((p) => p.id);
      const emails = await onGenerate(participantIds);
      setGeneratedEmails(emails);
      setCurrentEmailIndex(0);
      setEditedEmails(new Map());
      setProgress(100);
      if (onEmailsGenerated) onEmailsGenerated();

      // Create notification for successful generation
      const { createNotification } = await import("@/services/api/researcher");
      createNotification({
        title: "Outreach emails generated",
        message: `Generated ${emails.length} personalized emails`,
        type: "success",
        related_entity_type: "draft",
      }).catch((err) => console.error("Failed to create notification:", err));
    } catch (error) {
      console.error("Failed to generate emails:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate emails. Please try again.",
        variant: "error",
      });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleCopy = (index: number) => {
    const email = editedEmails.get(index) || generatedEmails[index];
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = async () => {
    // For now, just regenerate all - could be enhanced to regenerate single email
    await handleGenerate();
  };

  const handleRemoveParticipant = (id: string) => {
    onParticipantsChange(participants.filter((p) => p.id !== id));
  };

  const handleSubjectChange = (index: number, newSubject: string) => {
    const currentEmail = editedEmails.get(index) || generatedEmails[index];
    const updatedEmail = { ...currentEmail, subject: newSubject };
    setEditedEmails(new Map(editedEmails.set(index, updatedEmail)));
  };

  const handleBodyChange = (index: number, newBody: string) => {
    const currentEmail = editedEmails.get(index) || generatedEmails[index];
    const updatedEmail = { ...currentEmail, body: newBody };
    setEditedEmails(new Map(editedEmails.set(index, updatedEmail)));
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      setShowDraftNameInput(true);
      return;
    }

    setIsSavingDraft(true);
    try {
      const { saveDraft, updateDraft } = await import("@/services/api/drafts");

      const emailsToSave = generatedEmails.map(
        (email, idx) => editedEmails.get(idx) || email
      );

      const draftData = {
        name: draftName,
        participant_ids: participants.map((p) => p.id),
        participants: participants,
        generated_emails: emailsToSave.length > 0 ? emailsToSave : undefined,
      };

      // If we're editing an existing draft, update it. Otherwise create new.
      if (loadedDraft?.id) {
        await updateDraft(loadedDraft.id, draftData);
        toast({
          title: "Draft updated",
          description: `"${draftName}" has been updated successfully.`,
          variant: "success",
        });

        // Create notification for draft update
        const { createNotification } = await import("@/services/api/researcher");
        createNotification({
          title: "Draft updated",
          message: `"${draftName}" has been updated`,
          type: "info",
          related_entity_type: "draft",
          related_entity_id: loadedDraft.id,
        }).catch((err) => console.error("Failed to create notification:", err));
      } else {
        await saveDraft(draftData);
        toast({
          title: "Draft saved",
          description: `"${draftName}" has been saved successfully.`,
          variant: "success",
        });

        // Create notification for new draft
        const { createNotification } = await import("@/services/api/researcher");
        createNotification({
          title: "Draft saved",
          message: `"${draftName}" has been saved`,
          type: "success",
          related_entity_type: "draft",
        }).catch((err) => console.error("Failed to create notification:", err));
      }

      setShowDraftNameInput(false);
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast({
        title: "Save failed",
        description:
          "Failed to save draft. Make sure the database table exists.",
        variant: "error",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!loadedDraft?.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${draftName}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeletingDraft(true);
    try {
      const { deleteDraft } = await import("@/services/api/drafts");
      await deleteDraft(loadedDraft.id);

      toast({
        title: "Draft deleted",
        description: `"${draftName}" has been deleted.`,
        variant: "success",
      });

      // Navigate back to drafts page
      window.location.href = "/researcher/drafts";
    } catch (error) {
      console.error("Failed to delete draft:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete draft. Please try again.",
        variant: "error",
      });
    } finally {
      setIsDeletingDraft(false);
    }
  };

  const currentEmail =
    editedEmails.get(currentEmailIndex) || generatedEmails[currentEmailIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel - Recipients */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">
            Recipients
          </h3>
          <span className="text-sm text-muted-foreground">
            {participants.length} selected
          </span>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {participant.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {participant.role}
                  {participant.company_name &&
                    ` at ${participant.company_name}`}
                </p>
              </div>
              <button
                onClick={() => handleRemoveParticipant(participant.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          ))}
        </div>

        {/* Generate Button */}
        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={participants.length === 0 || isGenerating}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : participants.length === 0 ? (
              "No participants selected"
            ) : (
              `Generate ${participants.length} Email${participants.length !== 1 ? "s" : ""}`
            )}
          </Button>

          {/* Save/Update Draft */}
          {participants.length > 0 && !isGenerating && (
            <div className="space-y-2">
              {loadedDraft?.id ? (
                // Existing draft - show update and delete buttons
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    variant="outline"
                    className="flex-1"
                  >
                    {isSavingDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Update
                  </Button>
                  <Button
                    onClick={handleDeleteDraft}
                    disabled={isDeletingDraft}
                    variant="outline"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeletingDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : showDraftNameInput ? (
                // Creating new draft - show input
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Draft name..."
                    className="flex-1 h-9 focus-visible:ring-0 focus-visible:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveDraft()}
                    autoFocus
                  />
                  <Button
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || !draftName.trim()}
                    size="sm"
                    className="bg-primary text-primary-foreground"
                  >
                    {isSavingDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowDraftNameInput(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // No draft - show save as draft button
                <Button
                  onClick={() => setShowDraftNameInput(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Email Preview */}
      <div className="lg:col-span-2">
        {isGenerating ? (
          <Card className="h-full flex items-center justify-center p-12">
            <div className="text-center space-y-6 max-w-md">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">
                  Generating personalized emails...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our AI is crafting unique outreach messages for each
                  participant
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress < 100
                    ? `${Math.round(progress)}% complete`
                    : "Finalizing..."}
                </p>
              </div>
            </div>
          </Card>
        ) : generatedEmails.length > 0 ? (
          <div className="space-y-4">
            {/* Email Navigation */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Generated Emails
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    setCurrentEmailIndex(Math.max(0, currentEmailIndex - 1))
                  }
                  disabled={currentEmailIndex === 0}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {currentEmailIndex + 1} of {generatedEmails.length}
                </span>
                <Button
                  onClick={() =>
                    setCurrentEmailIndex(
                      Math.min(
                        generatedEmails.length - 1,
                        currentEmailIndex + 1
                      )
                    )
                  }
                  disabled={currentEmailIndex === generatedEmails.length - 1}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Email Content */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">To:</p>
                  <p className="font-medium text-slate-900">
                    {currentEmail.participant_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopy(currentEmailIndex)}
                    size="sm"
                    variant="outline"
                  >
                    {copiedIndex === currentEmailIndex ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRegenerate(currentEmailIndex)}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Subject
                  </label>
                  <Input
                    value={currentEmail.subject}
                    onChange={(e) =>
                      handleSubjectChange(currentEmailIndex, e.target.value)
                    }
                    className="font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Message
                  </label>
                  <Textarea
                    value={currentEmail.body}
                    onChange={(e) =>
                      handleBodyChange(currentEmailIndex, e.target.value)
                    }
                    rows={12}
                    className="resize-none font-sans"
                  />
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="h-full flex items-center justify-center p-12 text-center">
            <div className="space-y-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-slate-900">
                Ready to Generate
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Click "Generate" to create personalized outreach emails for your
                selected participants
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * Outreach Modal Component
 * Quick access modal for generating outreach emails
 */

import { useState, useEffect } from "react";
import { X, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OutreachContent } from "./OutreachContent";

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

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Array<{
    id: string;
    name: string;
    role: string;
    company_name?: string;
  }>;
  onGenerate: (participantIds: string[]) => Promise<GeneratedEmail[]>;
  loadedDraft?: {
    id: string;
    name: string;
    generated_emails?: GeneratedEmail[];
  } | null;
}

export function OutreachModal({
  isOpen,
  onClose,
  participants: initialParticipants,
  onGenerate,
  loadedDraft,
}: OutreachModalProps) {
  const navigate = useNavigate();
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);
  const [hasGeneratedEmails, setHasGeneratedEmails] = useState(false);

  // Reset participants when modal opens/closes or prop changes
  useEffect(() => {
    setParticipants(initialParticipants);
    setHasGeneratedEmails(false); // Reset on new modal open
  }, [isOpen, initialParticipants]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleExpandToPage = () => {
    // Navigate to dedicated page with state
    navigate("/researcher/outreach", {
      state: {
        participants,
        loadedDraft,
        from: "search",
      },
    });
    setHasGeneratedEmails(false); // Clear flag when expanding
    onClose();
  };

  const handleClose = () => {
    // Warn if there are unsaved generated emails
    if (hasGeneratedEmails) {
      const confirmClose = window.confirm(
        "You have unsaved emails. They will be lost unless you save as draft. Do you want to close anyway?"
      );
      if (!confirmClose) return;
    }
    setHasGeneratedEmails(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center">
        <div
          className="bg-white  rounded-2xl shadow-2xl w-full h-full flex flex-col max-w-7xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Compose Outreach
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {participants.length} recipient
                {participants.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExpandToPage}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                title="Expand to full page"
              >
                <Maximize2 className="h-5 w-5 text-slate-600 group-hover:text-primary" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <OutreachContent
              participants={participants}
              onParticipantsChange={setParticipants}
              onGenerate={onGenerate}
              onEmailsGenerated={() => setHasGeneratedEmails(true)}
              loadedDraft={loadedDraft}
            />
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(148 163 184 / 0.4);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184 / 0.6);
        }
      `}</style>
    </>
  );
}

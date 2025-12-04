/**
 * Saved Participants - Bookmarked participants view
 */

import React, { useEffect, useState } from "react";
import { BookmarkCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSavedParticipants } from "@/services/api/researcher";
import { AnimatedParticipantCard } from "@/components/researcher/AnimatedParticipantCard";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";

export default function SavedParticipants() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchSaved = async () => {
        try {
          console.log("📥 Fetching saved participants...");
          const data = await getSavedParticipants();
          console.log("📊 Raw saved participants data:", data);
          console.log("📝 Number of saved items:", data?.length || 0);
          
          // Map the response. Backend returns array of saved_participant records.
          // Each has a 'participant' field due to the join.
          // Supabase might return null for the joined participant if not found (shouldn't happen due to FK)
          const mapped = data
            .filter((item: any) => item.participants)
            .map((item: any) => ({
              ...item.participants,
              id: item.participants.id,
              score: 0, // Saved items don't have a search score
            }));
          console.log("✅ Mapped participants:", mapped);
          setSaved(mapped);
        } catch (error) {
          console.error("❌ Failed to load saved participants", error);
        } finally {
          setLoading(false);
        }
      };
      fetchSaved();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <Spinner variant="bars" size={48} className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {saved.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pb-8">
          {saved.map((participant) => (
            <AnimatedParticipantCard
              key={participant.id}
              participant={participant}
              initialSaved={true}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <BookmarkCheck className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">
              No saved participants yet
            </h3>
            <p className="text-neutral-600">
              Start searching and save participants you're interested in
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

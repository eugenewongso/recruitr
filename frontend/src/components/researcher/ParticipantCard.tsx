/**
 * Participant Card - Modern card design for search results
 */

import React, { useState } from "react";
import {
  MapPin,
  Users,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  Mail,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { saveParticipant, unsaveParticipant } from "@/services/api/researcher";
import { getMatchLabel } from "@/lib/matchUtils";

interface Participant {
  id: string;
  name: string;
  role: string;
  company_name?: string;
  company_size?: string;
  remote?: boolean;
  tools: string[];
  description?: string;
  score?: number;
  team_size?: number;
}

interface ParticipantCardProps {
  participant: Participant;
  onGenerateOutreach?: (id: string) => void;
  initialSaved?: boolean;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onGenerateOutreach,
  initialSaved = false,
}) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (isSaved) {
        await unsaveParticipant(participant.id);
        setIsSaved(false);
      } else {
        await saveParticipant(participant.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Failed to save/unsave", error);
    } finally {
      setIsLoading(false);
    }
  };

  const matchInfo = participant.score ? getMatchLabel(participant.score) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="group hover:shadow-xl transition-all duration-300 border-transparent hover:border-slate-200  hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1 text-slate-900  group-hover:text-primary transition-colors">
                {participant.name}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm font-medium">{participant.role}</span>
              </div>
            </div>
            {matchInfo && (
              <Badge
                className={`${matchInfo.bgClass} ${matchInfo.colorClass} ${matchInfo.borderClass} border hover:opacity-90 transition-all font-semibold`}
              >
                <Sparkles className="h-3 w-3 mr-1 fill-current" />
                {matchInfo.label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Company & Location */}
          <div className="flex flex-wrap gap-3">
            {participant.company_name && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <span className="font-medium text-slate-900">
                  {participant.company_name}
                </span>
                {participant.company_size && (
                  <span className="text-muted-foreground">
                    ({participant.company_size})
                  </span>
                )}
              </div>
            )}
            {participant.remote !== undefined && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{participant.remote ? "Remote" : "On-site"}</span>
              </div>
            )}
            {participant.team_size && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Team of {participant.team_size}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {participant.description && (
            <p className="text-sm text-slate-600  line-clamp-2 leading-relaxed">
              {participant.description}
            </p>
          )}

          {/* Tools */}
          {participant.tools && participant.tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {participant.tools.slice(0, 5).map((tool) => (
                <Badge
                  key={tool}
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  {tool}
                </Badge>
              ))}
              {participant.tools.length > 5 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{participant.tools.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-3 pt-4 border-t border-slate-100  mt-2">
          <Button
            onClick={() =>
              onGenerateOutreach && onGenerateOutreach(participant.id)
            }
            className="flex-1 bg-slate-900  text-white  hover:bg-slate-800  transition-all shadow-sm hover:shadow-md"
            disabled={!onGenerateOutreach}
          >
            <Mail className="h-4 w-4 mr-2" />
            Generate Outreach
          </Button>
          <Button
            onClick={handleSave}
            variant={isSaved ? "secondary" : "outline"}
            size="icon"
            disabled={isLoading}
            className={`transition-all duration-200 border shadow-sm ${
              isSaved
                ? "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20"
                : "text-slate-500 border-slate-200 hover:border-primary/50 hover:text-primary hover:bg-transparent"
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 fill-current" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ParticipantCard;

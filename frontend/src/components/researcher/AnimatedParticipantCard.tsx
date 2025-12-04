"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  Mail,
  Sparkles,
  Users,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface AnimatedParticipantCardProps {
  participant: Participant;
  onGenerateOutreach?: (id: string) => void;
  initialSaved?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  viewMode?: "grid" | "list";
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  hover: {
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

export function AnimatedParticipantCard({
  participant,
  onGenerateOutreach,
  initialSaved = false,
  isSelected = false,
  onSelectionChange,
  viewMode = "grid",
}: AnimatedParticipantCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsLoading(true);
    try {
      if (isSaved) {
        await unsaveParticipant(participant.id);
        setIsSaved(false);
      } else {
        await saveParticipant(participant.id);
        setIsSaved(true);

        // Create notification for saving participant
        const { createNotification } = await import(
          "@/services/api/researcher"
        );
        createNotification({
          title: "Participant saved",
          message: `${participant.name} has been added to your saved list`,
          type: "success",
          related_entity_type: "participant",
          related_entity_id: participant.id,
        }).catch((err) => console.error("Failed to create notification:", err));
      }
    } catch (error) {
      console.error("Failed to save/unsave", error);
    } finally {
      setIsLoading(false);
    }
  };

  const relevancePercent = participant.score
    ? Math.round(participant.score * 100)
    : 0;

  // List view rendering
  if (viewMode === "list") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card
          onClick={() => navigate(`/researcher/participant/${participant.id}`)}
          className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
            isSelected
              ? "border-primary ring-2 ring-primary/20"
              : "border-transparent hover:border-border"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Selection Checkbox */}
              {onSelectionChange && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectionChange(participant.id, !isSelected);
                  }}
                  className="transition-all hover:scale-110 flex-shrink-0"
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-6 w-6 text-primary fill-primary/10" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                  )}
                </button>
              )}

              {/* Participant Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {participant.name}
                  </h3>
                  {relevancePercent > 0 && (
                    <Badge className="bg-primary text-primary-foreground border-0 text-xs flex-shrink-0">
                      <Sparkles className="h-3 w-3 mr-1 fill-current" />
                      {relevancePercent}% match
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{participant.role}</span>
                  </div>
                  {participant.company_name && (
                    <span className="text-foreground font-medium">
                      {participant.company_name}
                    </span>
                  )}
                  {participant.remote !== undefined && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{participant.remote ? "Remote" : "On-site"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - Right side */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateOutreach && onGenerateOutreach(participant.id);
                  }}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!onGenerateOutreach}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Outreach
                </Button>
                <Button
                  onClick={handleSave}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className={`transition-all duration-200 ${
                    isSaved
                      ? "bg-primary/10 border-primary text-primary"
                      : "hover:border-primary/50"
                  }`}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Grid view rendering (original)

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card
        onClick={() => navigate(`/researcher/participant/${participant.id}`)}
        className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
          isSelected
            ? "border-primary ring-2 ring-primary/20"
            : "border-transparent hover:border-border"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            {/* Selection Checkbox */}
            {onSelectionChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectionChange(participant.id, !isSelected);
                }}
                className="mt-1 transition-all hover:scale-110"
              >
                {isSelected ? (
                  <CheckCircle2 className="h-6 w-6 text-primary fill-primary/10" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                )}
              </button>
            )}

            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-1">
                {participant.name}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm font-medium">{participant.role}</span>
              </div>
            </div>
            {relevancePercent > 0 && (
              <Badge className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 transition-colors font-semibold">
                <Sparkles className="h-3 w-3 mr-1 fill-current" />
                {relevancePercent}% match
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Company & Location */}
          <div className="flex flex-wrap gap-3 text-sm">
            {participant.company_name && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">
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
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{participant.remote ? "Remote" : "On-site"}</span>
              </div>
            )}
            {participant.team_size && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Team of {participant.team_size}</span>
              </div>
            )}
          </div>

          {/* Description - Always Visible */}
          {participant.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {participant.description}
            </p>
          )}

          {/* Tools - Always Visible */}
          {participant.tools && participant.tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {participant.tools.map((tool) => (
                <Badge
                  key={tool}
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-accent"
                >
                  {tool}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-3 pt-4 border-t border-border mt-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateOutreach && onGenerateOutreach(participant.id);
            }}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium"
            disabled={!onGenerateOutreach}
          >
            <Mail className="h-4 w-4 mr-2" />
            Generate Outreach
          </Button>
          <Button
            onClick={handleSave}
            variant="outline"
            size="icon"
            disabled={isLoading}
            className={`transition-all duration-200 ${
              isSaved
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-accent"
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
}

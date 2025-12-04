/**
 * Project Detail Page - Review and manage a research project
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Users,
  Search,
  CheckCircle,
  Mail,
  Trash2,
  Edit,
  Target,
  Brain,
  ChevronDown,
  Check,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getProject,
  updateProject,
  deleteProject,
  type Project,
} from "@/services/api/projects";
import { AnimatedParticipantCard } from "@/components/researcher/AnimatedParticipantCard";
import { useToast } from "@/hooks/useToast";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Collapsible sections state
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(true);
  const [isQueriesExpanded, setIsQueriesExpanded] = useState(true);
  const [isTargetExpanded, setIsTargetExpanded] = useState(true);

  // View mode for participants
  const [participantViewMode, setParticipantViewMode] = useState<
    "grid" | "list"
  >("grid");

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const data = await getProject(projectId!);
      setProject(data);
    } catch (error) {
      console.error("Failed to load project:", error);
      toast({
        title: "Failed to load project",
        variant: "error",
      });
      navigate("/researcher/projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;

    try {
      const updated = await updateProject(project.id, { status: newStatus });
      setProject(updated);
      toast({
        title: "Status updated",
        description: `Project marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Failed to update status",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      toast({
        title: "Project deleted",
      });
      navigate("/researcher/projects");
    } catch (error) {
      toast({
        title: "Failed to delete project",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEdit = () => {
    if (!project) return;
    setEditedName(project.name);
    setEditedDescription(project.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName("");
    setEditedDescription("");
  };

  const handleSaveEdit = async () => {
    if (!project) return;

    if (!editedName.trim()) {
      toast({
        title: "Project name is required",
        variant: "error",
      });
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateProject(project.id, {
        name: editedName.trim(),
        description: editedDescription.trim(),
      });
      setProject(updated);
      setIsEditing(false);
      toast({
        title: "Project updated successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to update project",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateOutreach = () => {
    if (!project) return;
    navigate("/researcher/outreach", {
      state: {
        participants: project.participants,
        from: "project",
        projectId: project.id,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Spinner variant="bars" size={48} className="text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/researcher/projects")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          {isEditing ? (
            // Edit Mode
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Project name"
                  className="text-2xl sm:text-3xl font-bold h-auto py-2"
                />
                <Badge
                  className={statusColors[project.status] || statusColors.draft}
                >
                  {project.status}
                </Badge>
              </div>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Project description"
                className="text-sm sm:text-base md:text-lg resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Spinner variant="bars" size={16} className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {project.name}
                </h1>
                <Badge
                  className={statusColors[project.status] || statusColors.draft}
                >
                  {project.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="ml-2 h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                {project.description}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {project.status === "draft" && (
            <Button
              onClick={() => handleStatusChange("in_progress")}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white text-sm sm:text-base"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Start Project</span>
              <span className="sm:hidden">Start</span>
            </Button>
          )}
          {project.status === "in_progress" && (
            <>
              <Button
                onClick={() => handleStatusChange("completed")}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white text-sm sm:text-base"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Mark Complete</span>
                <span className="sm:hidden">Complete</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("draft")}
                className="flex-1 sm:flex-none text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Draft</span>
                <span className="sm:hidden">Draft</span>
              </Button>
            </>
          )}
          {project.status === "completed" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("in_progress")}
              className="flex-1 sm:flex-none text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Reopen Project</span>
              <span className="sm:hidden">Reopen</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            size="icon"
          >
            {isDeleting ? (
              <Spinner variant="bars" size={16} />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* AI Strategy Card */}
      {project.ai_generated_strategy && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/30">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              AI Research Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Reasoning Section */}
            <div className="border-b-2 border-border pb-4">
              <button
                onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              >
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Reasoning
                </h4>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isReasoningExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isReasoningExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="text-foreground mt-3 leading-relaxed">
                      {project.ai_generated_strategy.reasoning}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Queries Section */}
            <div className="border-b-2 border-border pb-4">
              <button
                onClick={() => setIsQueriesExpanded(!isQueriesExpanded)}
                className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              >
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Search Queries Used
                </h4>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isQueriesExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isQueriesExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.search_queries.map((query, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <Search className="h-3 w-3" />
                          {query}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Target Section */}
            <div className="pt-1">
              <button
                onClick={() => setIsTargetExpanded(!isTargetExpanded)}
                className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              >
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Target
                </h4>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isTargetExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isTargetExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="flex items-center gap-2 text-foreground mt-3">
                      <Target className="h-4 w-4" />
                      <span>
                        {project.ai_generated_strategy.target_count}{" "}
                        participants (found {project.participants.length})
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Participants
            </h2>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {project.participants.length} found
            </Badge>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View Toggle Buttons */}
            {project.participants.length > 0 && (
              <div className="flex items-center border border-border rounded-lg p-1 bg-muted/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParticipantViewMode("grid")}
                  className={`h-8 px-3 ${
                    participantViewMode === "grid"
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "hover:bg-muted"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParticipantViewMode("list")}
                  className={`h-8 px-3 ${
                    participantViewMode === "list"
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "hover:bg-muted"
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}

            {project.participants.length > 0 && (
              <Button
                onClick={handleGenerateOutreach}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary-700 text-white text-sm sm:text-base"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Generate Outreach</span>
                <span className="sm:hidden">Generate</span>
              </Button>
            )}
          </div>
        </div>

        {project.participants.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No participants yet
            </h3>
            <p className="text-muted-foreground">
              The AI couldn't find any matches. Try refining your search
              criteria.
            </p>
          </Card>
        ) : (
          <div
            className={
              participantViewMode === "grid" ? "grid gap-4" : "space-y-3"
            }
          >
            {project.participants.map((participant, idx) => (
              <AnimatedParticipantCard
                key={participant.id || idx}
                participant={participant}
                initialSaved={false}
                viewMode={participantViewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

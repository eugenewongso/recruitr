/**
 * Projects Page - AI-Assisted Research Projects
 * Natural language interface for finding research participants
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Clock,
  Users,
  Brain,
  Search,
  TrendingUp,
  CheckCircle2,
  Loader2,
  MapPin,
  Briefcase,
  Code,
  Star,
  Settings2,
  Award,
  X,
  Filter,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProjectWithAgent,
  getProjects,
  type Project as ProjectType,
} from "@/services/api/projects";
import { useToast } from "@/hooks/useToast";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

// Progress steps for AI agent
type AgentStep =
  | "idle"
  | "parsing"
  | "searching"
  | "ranking"
  | "creating"
  | "complete";

// Advanced preferences
interface AdvancedPreferences {
  participantCount: number;
  experienceLevel: string;
  remoteOnly: boolean;
  specificSkills: string;
  specificTools: string;
  employmentType: string;
  minYearsExperience: number;
}

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"simple" | "custom">("simple");
  const [goal, setGoal] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateExpanded, setIsCreateExpanded] = useState(false);
  const [agentStep, setAgentStep] = useState<AgentStep>("idle");
  const createButtonRef = useRef<HTMLDivElement>(null);
  const [searchProgress, setSearchProgress] = useState({
    current: 0,
    total: 0,
  });
  const [participantCount, setParticipantCount] = useState(0);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter states - temporary (in dropdown)
  const [tempSelectedStatus, setTempSelectedStatus] = useState<string[]>([]);
  const [tempDateFilter, setTempDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [tempMinParticipants, setTempMinParticipants] = useState<number>(0);

  // Filter states - applied (active)
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [minParticipants, setMinParticipants] = useState<number>(0);

  // Advanced preferences
  const [advancedPrefs, setAdvancedPrefs] = useState<AdvancedPreferences>({
    participantCount: 15,
    experienceLevel: "any",
    remoteOnly: false,
    specificSkills: "",
    specificTools: "",
    employmentType: "any",
    minYearsExperience: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await getProjects();
      setProjects(response.projects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast({
        title: "Failed to load projects",
        description: "Please check if the backend is running",
        variant: "error",
      });
      setProjects([]); // Set empty array on error
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleCreateProject = async () => {
    if (!goal.trim()) {
      toast({
        title: "Please describe your research goal",
        variant: "error",
      });
      return;
    }

    try {
      setIsCreating(true);
      setAgentStep("parsing");
      setSearchProgress({ current: 0, total: 0 });
      setParticipantCount(0);

      // Simulate progress updates (in real app, this would come from backend events)
      const progressSimulator = setTimeout(
        () => setAgentStep("searching"),
        1500
      );
      const searchSimulator = setTimeout(() => {
        setSearchProgress({ current: 1, total: 3 });
      }, 2000);
      const searchSimulator2 = setTimeout(() => {
        setSearchProgress({ current: 2, total: 3 });
      }, 3000);
      const searchSimulator3 = setTimeout(() => {
        setSearchProgress({ current: 3, total: 3 });
        setAgentStep("ranking");
      }, 4000);
      const rankingSimulator = setTimeout(() => {
        setAgentStep("creating");
      }, 5000);

      // Build request with advanced preferences if in custom mode
      const request: any = { goal: goal.trim() };

      if (mode === "custom") {
        request.target_count = advancedPrefs.participantCount;
        request.preferences = {
          experience_level:
            advancedPrefs.experienceLevel !== "any"
              ? advancedPrefs.experienceLevel
              : undefined,
          remote_only: advancedPrefs.remoteOnly,
          skills: advancedPrefs.specificSkills
            ? advancedPrefs.specificSkills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
          tools: advancedPrefs.specificTools
            ? advancedPrefs.specificTools
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
          employment_type:
            advancedPrefs.employmentType !== "any"
              ? advancedPrefs.employmentType
              : undefined,
          min_years_experience:
            advancedPrefs.minYearsExperience > 0
              ? advancedPrefs.minYearsExperience
              : undefined,
        };
      }

      const result = await createProjectWithAgent(request);

      // Clear simulators
      clearTimeout(progressSimulator);
      clearTimeout(searchSimulator);
      clearTimeout(searchSimulator2);
      clearTimeout(searchSimulator3);
      clearTimeout(rankingSimulator);

      setAgentStep("complete");
      setParticipantCount(result.participants.length);

      // Brief pause to show completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Project created!",
        description: result.message,
      });

      // Navigate to project detail page
      navigate(`/researcher/projects/${result.project_id}`);
    } catch (error: any) {
      console.error("Failed to create project:", error);
      toast({
        title: "Failed to create project",
        description: error.response?.data?.detail || "Please try again",
        variant: "error",
      });
      setAgentStep("idle");
    } finally {
      setIsCreating(false);
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

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
  };

  const handleClearFilters = () => {
    setSelectedStatus([]);
    setDateFilter("all");
    setMinParticipants(0);
    setTempSelectedStatus([]);
    setTempDateFilter("all");
    setTempMinParticipants(0);
  };

  const handleApplyFilters = () => {
    setSelectedStatus(tempSelectedStatus);
    setDateFilter(tempDateFilter);
    setMinParticipants(tempMinParticipants);
    setShowFilters(false);
  };

  const toggleTempStatus = (status: string) => {
    setTempSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const hasActiveFilters =
    selectedStatus.length > 0 || dateFilter !== "all" || minParticipants > 0;

  const hasTempFilters =
    tempSelectedStatus.length > 0 ||
    tempDateFilter !== "all" ||
    tempMinParticipants > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "archived":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStepInfo = (step: AgentStep) => {
    switch (step) {
      case "parsing":
        return {
          icon: Brain,
          title: "Understanding Your Goal",
          description: "AI is analyzing your research objectives...",
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        };
      case "searching":
        return {
          icon: Search,
          title: "Searching for Candidates",
          description: `Executing search query ${searchProgress.current} of ${searchProgress.total}...`,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      case "ranking":
        return {
          icon: TrendingUp,
          title: "Ranking Participants",
          description: "Selecting the best matches for your project...",
          color: "text-amber-600",
          bgColor: "bg-amber-100",
        };
      case "creating":
        return {
          icon: Sparkles,
          title: "Creating Project",
          description: "Finalizing your research project...",
          color: "text-primary-600",
          bgColor: "bg-primary-100",
        };
      case "complete":
        return {
          icon: CheckCircle2,
          title: "Project Ready!",
          description: `Found ${participantCount} participants for your research.`,
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      default:
        return {
          icon: Sparkles,
          title: "Starting...",
          description: "Initializing AI agent...",
          color: "text-slate-600",
          bgColor: "bg-slate-100",
        };
    }
  };

  const allSteps = [
    { key: "parsing" as AgentStep, label: "Understand Goal", icon: Brain },
    { key: "searching" as AgentStep, label: "Search Candidates", icon: Search },
    { key: "ranking" as AgentStep, label: "Rank Matches", icon: TrendingUp },
    { key: "creating" as AgentStep, label: "Create Project", icon: Sparkles },
  ];

  const getStepStatus = (stepKey: AgentStep) => {
    const stepOrder = [
      "parsing",
      "searching",
      "ranking",
      "creating",
      "complete",
    ];
    const currentIndex = stepOrder.indexOf(agentStep);
    const stepIndex = stepOrder.indexOf(stepKey);

    if (stepIndex < currentIndex || agentStep === "complete") return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  // Filter projects based on search query and filters
  const filteredProjects = projects.filter((project) => {
    // Text search filter
    if (activeSearchQuery.trim()) {
      const query = activeSearchQuery.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (selectedStatus.length > 0 && !selectedStatus.includes(project.status)) {
      return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const projectDate = new Date(project.created_at);
      const now = new Date();
      const diffMs = now.getTime() - projectDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (dateFilter === "today" && diffDays > 0) return false;
      if (dateFilter === "week" && diffDays > 7) return false;
      if (dateFilter === "month" && diffDays > 30) return false;
    }

    // Participant count filter
    if (
      minParticipants > 0 &&
      (project.participants?.length || 0) < minParticipants
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreateExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setIsCreateExpanded(false);
                setGoal("");
                setMode("simple");
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 20,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 20,
                    scale: 0.98,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-blue-50/30 shadow-2xl">
                    <CardContent className="p-6 md:p-8">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Sparkles className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                              Create New Research Project
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              Describe your research goal, and our AI will find
                              the perfect participants
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsCreateExpanded(false);
                            setGoal("");
                            setMode("simple");
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Mode Tabs */}
                      <Tabs
                        value={mode}
                        onValueChange={(v) => setMode(v as "simple" | "custom")}
                        className="w-full"
                      >
                        <TabsList className="grid w-full max-w-[300px] grid-cols-2 mb-6">
                          <TabsTrigger value="simple" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            Simple
                          </TabsTrigger>
                          <TabsTrigger value="custom" className="gap-2">
                            <Settings2 className="h-4 w-4" />
                            Custom
                          </TabsTrigger>
                        </TabsList>

                        {/* Simple Mode */}
                        <TabsContent value="simple" className="space-y-4 mt-0">
                          <div className="relative">
                            <textarea
                              value={goal}
                              onChange={(e) => setGoal(e.target.value)}
                              placeholder="Example: I'm launching a new fitness app and need to interview people who regularly use workout tracking apps and have struggled with staying motivated..."
                              className="w-full min-h-[120px] p-4 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-base transition-all"
                              disabled={isCreating}
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                              {goal.length} / 500 characters
                            </div>
                          </div>

                          {/* Quick Examples */}
                          {!isCreating && goal.length === 0 && (
                            <div className="pt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Quick examples:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "Find designers who work with Figma and AI tools",
                                  "Interview product managers at early-stage startups",
                                  "Research users who switched from Android to iPhone",
                                ].map((example) => (
                                  <Badge
                                    key={example}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors text-xs py-1 px-3"
                                    onClick={() => setGoal(example)}
                                  >
                                    {example}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        {/* Custom Mode */}
                        <TabsContent value="custom" className="space-y-6 mt-0">
                          {/* Goal Input */}
                          <div className="relative">
                            <Label
                              htmlFor="custom-goal"
                              className="text-sm font-medium mb-2 block"
                            >
                              Research Goal
                            </Label>
                            <textarea
                              id="custom-goal"
                              value={goal}
                              onChange={(e) => setGoal(e.target.value)}
                              placeholder="Describe your research objective..."
                              className="w-full min-h-[100px] p-4 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-base transition-all"
                              disabled={isCreating}
                            />
                          </div>

                          {/* Advanced Options Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-2">
                            {/* Participant Count */}
                            <div className="space-y-2">
                              <Label
                                htmlFor="participant-count"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Users className="h-4 w-4 text-primary" />
                                Number of Participants
                              </Label>
                              <Input
                                id="participant-count"
                                type="number"
                                min="5"
                                max="50"
                                value={advancedPrefs.participantCount}
                                onChange={(e) =>
                                  setAdvancedPrefs({
                                    ...advancedPrefs,
                                    participantCount:
                                      parseInt(e.target.value) || 15,
                                  })
                                }
                                className="w-full"
                                disabled={isCreating}
                              />
                              <p className="text-xs text-muted-foreground">
                                AI will find this many top matches
                              </p>
                            </div>

                            {/* Experience Level */}
                            <div className="space-y-2">
                              <Label
                                htmlFor="experience-level-modal"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Award className="h-4 w-4 text-primary" />
                                Experience Level
                              </Label>
                              <Select
                                value={advancedPrefs.experienceLevel}
                                onValueChange={(value) =>
                                  setAdvancedPrefs({
                                    ...advancedPrefs,
                                    experienceLevel: value,
                                  })
                                }
                                disabled={isCreating}
                              >
                                <SelectTrigger id="experience-level-modal">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any Level</SelectItem>
                                  <SelectItem value="entry">
                                    Entry Level (0-2 years)
                                  </SelectItem>
                                  <SelectItem value="mid">
                                    Mid Level (3-5 years)
                                  </SelectItem>
                                  <SelectItem value="senior">
                                    Senior (5+ years)
                                  </SelectItem>
                                  <SelectItem value="expert">
                                    Expert (10+ years)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Years of professional experience
                              </p>
                            </div>

                            {/* Remote Only Toggle */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Work Location
                              </Label>
                              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border">
                                <span className="text-sm">
                                  Remote workers only
                                </span>
                                <Switch
                                  checked={advancedPrefs.remoteOnly}
                                  onCheckedChange={(checked) =>
                                    setAdvancedPrefs({
                                      ...advancedPrefs,
                                      remoteOnly: checked,
                                    })
                                  }
                                  disabled={isCreating}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Include only participants who work remotely
                              </p>
                            </div>

                            {/* Employment Type */}
                            <div className="space-y-2">
                              <Label
                                htmlFor="employment-type-modal"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Briefcase className="h-4 w-4 text-primary" />
                                Employment Type
                              </Label>
                              <Select
                                value={advancedPrefs.employmentType}
                                onValueChange={(value) =>
                                  setAdvancedPrefs({
                                    ...advancedPrefs,
                                    employmentType: value,
                                  })
                                }
                                disabled={isCreating}
                              >
                                <SelectTrigger id="employment-type-modal">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any Type</SelectItem>
                                  <SelectItem value="full-time">
                                    Full-time Employee
                                  </SelectItem>
                                  <SelectItem value="freelance">
                                    Freelance / Self-employed
                                  </SelectItem>
                                  <SelectItem value="contract">
                                    Contract / Consultant
                                  </SelectItem>
                                  <SelectItem value="part-time">
                                    Part-time
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Filter by work arrangement and employment status
                              </p>
                            </div>

                            {/* Specific Skills */}
                            <div className="space-y-2 md:col-span-2">
                              <Label
                                htmlFor="specific-skills-modal"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Star className="h-4 w-4 text-primary" />
                                Specific Skills (Optional)
                              </Label>
                              <Input
                                id="specific-skills-modal"
                                value={advancedPrefs.specificSkills}
                                onChange={(e) =>
                                  setAdvancedPrefs({
                                    ...advancedPrefs,
                                    specificSkills: e.target.value,
                                  })
                                }
                                placeholder="e.g., React, Python, UX Design"
                                className="w-full"
                                disabled={isCreating}
                              />
                              <p className="text-xs text-muted-foreground">
                                Comma-separated list of required skills
                              </p>
                            </div>

                            {/* Specific Tools */}
                            <div className="space-y-2 md:col-span-2">
                              <Label
                                htmlFor="specific-tools-modal"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Code className="h-4 w-4 text-primary" />
                                Specific Tools (Optional)
                              </Label>
                              <Input
                                id="specific-tools-modal"
                                value={advancedPrefs.specificTools}
                                onChange={(e) =>
                                  setAdvancedPrefs({
                                    ...advancedPrefs,
                                    specificTools: e.target.value,
                                  })
                                }
                                placeholder="e.g., Figma, Jira, Slack"
                                className="w-full"
                                disabled={isCreating}
                              />
                              <p className="text-xs text-muted-foreground">
                                Comma-separated list of tools they should use
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Create Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6 pt-6 border-t">
                        <Button
                          onClick={handleCreateProject}
                          disabled={isCreating || !goal.trim()}
                          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-6 py-3 text-base font-medium"
                          size="lg"
                        >
                          {isCreating ? (
                            <>
                              <Spinner
                                variant="bars"
                                size={20}
                                className="mr-2"
                              />
                              AI is working...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              Create Project with AI
                              {mode === "custom" &&
                                ` (${advancedPrefs.participantCount} participants)`}
                            </>
                          )}
                        </Button>

                        {isCreating && (
                          <span className="text-sm text-muted-foreground animate-pulse">
                            Analyzing your goal and finding participants...
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* AI Progress Modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            {/* Animated Gradient Background - Same as landing page */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none opacity-90">
                <BackgroundGradientAnimation
                  gradientBackgroundStart="rgb(255, 247, 230)"
                  gradientBackgroundEnd="rgb(255, 240, 200)"
                  firstColor="255, 164, 0"
                  secondColor="251, 191, 36"
                  thirdColor="255, 210, 100"
                  fourthColor="59, 130, 246"
                  fifthColor="147, 197, 253"
                  interactive={false}
                  className="opacity-80"
                />
              </div>
            </motion.div>

            {/* Progress Card - Centered Container */}
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl"
              >
                <Card className="shadow-2xl border-2 border-primary/20 backdrop-blur-xl bg-white/95">
                  <CardContent className="p-6 md:p-8">
                    {/* Current Step Display */}
                    <div className="text-center space-y-6 mb-8">
                      <motion.div
                        key={agentStep}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                      >
                        <div
                          className={`h-20 w-20 rounded-full ${getStepInfo(agentStep).bgColor} flex items-center justify-center mx-auto`}
                        >
                          {agentStep === "complete" ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                            >
                              <CheckCircle2
                                className={`h-10 w-10 ${getStepInfo(agentStep).color}`}
                              />
                            </motion.div>
                          ) : (
                            <Loader2
                              className={`h-10 w-10 ${getStepInfo(agentStep).color} animate-spin`}
                            />
                          )}
                        </div>
                      </motion.div>

                      <div className="space-y-2">
                        <motion.h3
                          key={`title-${agentStep}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xl md:text-2xl font-bold text-foreground"
                        >
                          {getStepInfo(agentStep).title}
                        </motion.h3>
                        <motion.p
                          key={`desc-${agentStep}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm md:text-base text-muted-foreground"
                        >
                          {getStepInfo(agentStep).description}
                        </motion.p>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-3">
                      {allSteps.map((step, index) => {
                        const status = getStepStatus(step.key);
                        const StepIcon = step.icon;

                        return (
                          <motion.div
                            key={step.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              status === "active"
                                ? "bg-primary/10 border-2 border-primary"
                                : status === "complete"
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-slate-50 border border-slate-200"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                status === "active"
                                  ? "bg-primary text-white"
                                  : status === "complete"
                                    ? "bg-green-500 text-white"
                                    : "bg-slate-300 text-slate-600"
                              }`}
                            >
                              {status === "complete" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <StepIcon className="h-4 w-4" />
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                status === "pending"
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {step.label}
                            </span>
                            {status === "active" && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="ml-auto"
                              >
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </motion.div>
                            )}
                            {status === "complete" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Search Progress Bar (only show during searching) */}
                    {agentStep === "searching" && searchProgress.total > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 space-y-2"
                      >
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(searchProgress.current / searchProgress.total) * 100}%`,
                            }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-primary"
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          Query {searchProgress.current} of{" "}
                          {searchProgress.total}
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Search and Filter Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar with Button */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, description, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                      e.currentTarget.blur();
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Visual Search Button (for clarity) */}
              <Button
                variant="outline"
                size="default"
                className="hidden sm:flex whitespace-nowrap"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Filters Button (Airbnb-style) */}
            <div className="relative">
              <Button
                variant="outline"
                size="default"
                className="whitespace-nowrap relative"
                onClick={() => {
                  // Initialize temp filters with current active filters when opening
                  setTempSelectedStatus(selectedStatus);
                  setTempDateFilter(dateFilter);
                  setTempMinParticipants(minParticipants);
                  setShowFilters(!showFilters);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                    {selectedStatus.length +
                      (dateFilter !== "all" ? 1 : 0) +
                      (minParticipants > 0 ? 1 : 0)}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>

              {/* Filters Dropdown */}
              <AnimatePresence>
                {showFilters && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowFilters(false)}
                      className="fixed inset-0 z-40"
                    />

                    {/* Dropdown Panel */}
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-base">Filters</h3>
                          {hasTempFilters && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTempSelectedStatus([]);
                                setTempDateFilter("all");
                                setTempMinParticipants(0);
                              }}
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Clear all
                            </Button>
                          )}
                        </div>

                        <div className="h-px bg-border" />

                        {/* Status Filter */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground">
                            Project Status
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              {
                                value: "completed",
                                label: "Completed",
                                emoji: "✓",
                              },
                              {
                                value: "in_progress",
                                label: "In Progress",
                                emoji: "⏳",
                              },
                              { value: "draft", label: "Draft", emoji: "📝" },
                              {
                                value: "archived",
                                label: "Archived",
                                emoji: "📦",
                              },
                            ].map((status) => (
                              <Button
                                key={status.value}
                                variant={
                                  tempSelectedStatus.includes(status.value)
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => toggleTempStatus(status.value)}
                                className={`text-xs ${
                                  tempSelectedStatus.includes(status.value)
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "hover:bg-muted"
                                }`}
                              >
                                <span className="mr-1">{status.emoji}</span>
                                {status.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Date Filter */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground">
                            Created Date
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: "all", label: "Any time" },
                              { value: "today", label: "Today" },
                              { value: "week", label: "Past week" },
                              { value: "month", label: "Past month" },
                            ].map((date) => (
                              <Button
                                key={date.value}
                                variant={
                                  tempDateFilter === date.value
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setTempDateFilter(date.value as any)
                                }
                                className={`text-xs justify-start ${
                                  tempDateFilter === date.value
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "hover:bg-muted"
                                }`}
                              >
                                {date.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Participant Count Filter */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">
                              Minimum Participants
                            </label>
                            <Badge variant="secondary" className="font-mono">
                              {tempMinParticipants}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="5"
                              value={tempMinParticipants}
                              onChange={(e) =>
                                setTempMinParticipants(Number(e.target.value))
                              }
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0</span>
                              <span>25</span>
                              <span>50+</span>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Apply Button */}
                        <Button
                          onClick={handleApplyFilters}
                          className="w-full bg-primary hover:bg-primary/90 shadow-sm"
                          size="default"
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Create New Project Button */}
            <motion.div
              ref={createButtonRef}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="default"
                className="bg-primary hover:bg-primary/90 whitespace-nowrap w-full sm:w-auto"
                onClick={() => setIsCreateExpanded(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </motion.div>
          </div>

          {/* Active Search Indicator */}
          {activeSearchQuery && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filteredProjects.length}
                </span>{" "}
                {filteredProjects.length === 1 ? "result" : "results"} for "
                <span className="font-semibold text-foreground">
                  {activeSearchQuery}
                </span>
                "
              </p>
            </div>
          )}

          {/* Active Filters Badges */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Active filters:
                </span>
                {selectedStatus.map((status) => (
                  <Badge
                    key={status}
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => toggleStatus(status)}
                  >
                    {status}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                {dateFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => setDateFilter("all")}
                  >
                    {dateFilter === "today"
                      ? "Today"
                      : dateFilter === "week"
                        ? "Past week"
                        : "Past month"}
                    <X className="h-3 w-3" />
                  </Badge>
                )}
                {minParticipants > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => setMinParticipants(0)}
                  >
                    Min {minParticipants} participants
                    <X className="h-3 w-3" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-6 text-xs px-2"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects List - Main Content */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {projects.length === 0
                ? "No projects yet"
                : activeSearchQuery &&
                    filteredProjects.length !== projects.length
                  ? `Showing ${filteredProjects.length} of ${projects.length} ${projects.length === 1 ? "project" : "projects"}`
                  : `${projects.length} ${projects.length === 1 ? "project" : "projects"} total`}
            </p>
          </div>

          {/* View Toggle Buttons - Right side */}
          {projects.length > 0 && (
            <div className="flex items-center border border-border rounded-lg p-1 bg-muted/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-8 px-3 ${
                  viewMode === "grid"
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-8 px-3 ${
                  viewMode === "list"
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {isLoadingProjects ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Spinner variant="bars" size={48} className="text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Start Your First Project
              </h3>
              <p className="text-muted-foreground mb-6">
                Use AI to discover the perfect research participants in seconds.
                Just describe your goal in natural language.
              </p>
              <Button
                onClick={() => setIsCreateExpanded(true)}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Create New Project
              </Button>
            </div>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Projects Found
              </h3>
              <p className="text-muted-foreground mb-6">
                No projects match your search "{activeSearchQuery}". Try a
                different keyword or create a new project.
              </p>
              <Button onClick={handleClearSearch} variant="outline" size="lg">
                Clear Search
              </Button>
            </div>
          </Card>
        ) : (
          <div className="w-full">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-3"
              }
            >
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`hover:shadow-xl transition-all duration-200 cursor-pointer border-border group overflow-hidden ${
                    viewMode === "list" ? "hover:border-primary/40" : ""
                  }`}
                  onClick={() => navigate(`/researcher/projects/${project.id}`)}
                >
                  {viewMode === "grid" ? (
                    // Grid/Card View - Clean & Simple
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Title and Status */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xl font-bold text-foreground transition-colors line-clamp-2 flex-1">
                              {project.name}
                            </h3>
                            <Badge
                              className={`${getStatusColor(
                                project.status
                              )} flex-shrink-0 pointer-events-none`}
                            >
                              {project.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                          {project.description}
                        </p>

                        {/* Metadata */}
                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">
                                {project.participants?.length || 0}
                              </span>
                              <span className="text-muted-foreground">
                                participants
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs">
                                {formatDate(project.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  ) : (
                    // List View - Compact horizontal layout
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Project Icon/Avatar */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-blue-500/20 transition-colors">
                          <Sparkles className="h-6 w-6 text-primary" />
                        </div>

                        {/* Project Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {project.name}
                            </h3>
                            <Badge
                              className={
                                getStatusColor(project.status) +
                                " text-xs flex-shrink-0 pointer-events-none"
                              }
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {project.description}
                          </p>
                        </div>

                        {/* Metadata - Right side */}
                        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">
                              {project.participants?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(project.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

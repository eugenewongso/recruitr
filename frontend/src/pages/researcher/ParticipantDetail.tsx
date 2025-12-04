/**
 * Participant Detail Page
 * Full profile view for a single participant
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Mail,
  Building2,
  MapPin,
  Users,
  Calendar,
  Briefcase,
  Globe,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  saveParticipant,
  unsaveParticipant,
  getSavedParticipants,
} from "@/services/api/researcher";
import { useToast } from "@/hooks/useToast";
import apiClient from "@/services/api/base";

interface Participant {
  id: string;
  name: string;
  email?: string;
  role: string;
  company_name?: string;
  company_size?: string;
  industry?: string;
  remote: boolean;
  team_size?: number;
  experience_years?: number;
  tools: string[];
  skills: string[];
  description: string;
  created_at?: string;
}

export default function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchParticipant();
      checkIfSaved();
    }
  }, [id]);

  const fetchParticipant = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/researcher/participant/${id}`);
      setParticipant(response.data);
    } catch (error) {
      console.error("Failed to fetch participant:", error);
      toast({
        title: "Error",
        description: "Failed to load participant details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const saved = await getSavedParticipants();
      setIsSaved(saved.some((item: any) => item.participant_id === id));
    } catch (error) {
      console.error("Failed to check saved status:", error);
    }
  };

  const handleSave = async () => {
    if (!user || !id) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await unsaveParticipant(id);
        setIsSaved(false);
        toast({
          title: "Removed",
          description: "Participant removed from saved list",
        });
      } else {
        await saveParticipant(id);
        setIsSaved(true);
        toast({
          title: "Saved",
          description: "Participant added to saved list",
        });
      }
    } catch (error) {
      console.error("Failed to save/unsave:", error);
      toast({
        title: "Error",
        description: "Failed to update saved status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateOutreach = () => {
    if (participant) {
      navigate("/researcher/outreach", {
        state: {
          participants: [participant],
          fromDetail: true,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-700  mb-2">
            Participant not found
          </h3>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-8">
      {/* Breadcrumb / Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header Section */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Name & Role */}
              <h1 className="text-3xl font-bold text-gray-900  mb-2">
                {participant.name}
              </h1>
              <p className="text-xl text-primary-600  mb-4">
                {participant.role}
              </p>

              {/* Key Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {participant.company_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{participant.company_name}</span>
                  </div>
                )}
                {participant.experience_years && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{participant.experience_years} years experience</span>
                  </div>
                )}
                {participant.remote !== undefined && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{participant.remote ? "Remote" : "On-site"}</span>
                  </div>
                )}
                {participant.team_size && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Team of {participant.team_size}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 ml-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant={isSaved ? "default" : "outline"}
                className="min-w-[140px]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bookmark
                    className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`}
                  />
                )}
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button
                onClick={handleGenerateOutreach}
                className="min-w-[140px] bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Generate Outreach
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills & Tools</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Description */}
          {participant.description && (
            <Card className="">
              <CardHeader>
                <CardTitle className="">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700  whitespace-pre-line leading-relaxed">
                  {participant.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Professional Details */}
          <Card className="">
            <CardHeader>
              <CardTitle className="">
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {participant.industry && (
                <DetailRow label="Industry" value={participant.industry} />
              )}
              {participant.company_size && (
                <DetailRow
                  label="Company Size"
                  value={`${participant.company_size} employees`}
                />
              )}
              {participant.experience_years && (
                <DetailRow
                  label="Years of Experience"
                  value={participant.experience_years.toString()}
                />
              )}
              {participant.team_size && (
                <DetailRow
                  label="Team Size"
                  value={`${participant.team_size} members`}
                />
              )}
              {participant.remote !== undefined && (
                <DetailRow
                  label="Work Arrangement"
                  value={participant.remote ? "Remote" : "On-site"}
                />
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          {participant.email && (
            <Card className="">
              <CardHeader>
                <CardTitle className="">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow label="Email" value={participant.email} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Skills & Tools Tab */}
        <TabsContent value="skills" className="space-y-6">
          {/* Tools */}
          <Card className="">
            <CardHeader>
              <CardTitle className="">
                Tools & Technologies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participant.tools && participant.tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {participant.tools.map((tool, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-sm px-3 py-1"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {tool}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No tools listed
                </p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="">
            <CardHeader>
              <CardTitle className="">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {participant.skills && participant.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {participant.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No skills listed
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b last:border-0">
      <span className="text-sm font-medium text-gray-600">
        {label}
      </span>
      <span className="text-sm text-gray-900 text-right max-w-xs">
        {value}
      </span>
    </div>
  );
}


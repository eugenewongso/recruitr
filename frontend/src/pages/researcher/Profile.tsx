/**
 * Researcher Profile Page
 * Settings, preferences, and account management
 */

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Save,
  Lock,
  Bell,
  Settings as SettingsIcon,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { getProfile, updateProfile } from "@/services/api/researcher";
import { useToast } from "@/hooks/useToast";

export default function Profile() {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    organization: "",
    role: "",
  });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getProfile();
      setProfile({
        fullName: data.full_name || "",
        email: data.email || "",
        organization: data.company_name || "",
        role: data.job_title || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Preferences state
  const [preferences, setPreferences] = useState({
    roles: ["Product Manager", "Designer", "Engineer"],
    industries: ["Technology", "Healthcare"],
    tools: ["Figma", "Jira", "Slack"],
    companySizes: ["10-50", "51-200"],
    workTypes: ["Remote", "Hybrid"],
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    pushNewMatches: true,
    pushMessages: true,
    pushSearchComplete: false,
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: profile.fullName,
        company_name: profile.organization,
        job_title: profile.role,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = (
    category: keyof typeof preferences,
    value: string
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600">
          Manage your account and search preferences
        </p>
      </div>

      {/* Success Message */}
      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800"
        >
          <Check className="h-5 w-5" />
          <span className="font-medium">Changes saved successfully!</span>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Search Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your profile details and public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.fullName
                    ? profile.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : profile.email
                      ? profile.email[0].toUpperCase()
                      : "?"}
                </div>
                <div>
                  <Button variant="outline" size="sm" className="">
                    Change Avatar
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                      className="pl-10"
                      placeholder="e.g., John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Company / Organization</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="organization"
                      value={profile.organization}
                      onChange={(e) =>
                        setProfile({ ...profile, organization: e.target.value })
                      }
                      className="pl-10"
                      placeholder="e.g., Acme Corp"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="role"
                      value={profile.role}
                      onChange={(e) =>
                        setProfile({ ...profile, role: e.target.value })
                      }
                      className="pl-10"
                      placeholder="e.g., UX Researcher"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className=" "
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="">
            <CardHeader>
              <CardTitle>Search Preferences</CardTitle>
              <CardDescription>
                Set your default search criteria to get personalized
                recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Preferred Roles */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Preferred Participant Roles
                </Label>
                <p className="text-sm text-gray-500">
                  Select roles you typically search for
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Product Manager",
                    "Designer",
                    "Engineer",
                    "Data Analyst",
                    "Marketing Manager",
                    "Sales Representative",
                    "Customer Success",
                    "Executive",
                  ].map((role) => (
                    <Badge
                      key={role}
                      variant={
                        preferences.roles.includes(role) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => togglePreference("roles", role)}
                    >
                      {preferences.roles.includes(role) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preferred Industries */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Preferred Industries
                </Label>
                <p className="text-sm text-gray-500">
                  Industries you're interested in researching
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Technology",
                    "Healthcare",
                    "Finance",
                    "Education",
                    "E-commerce",
                    "Manufacturing",
                    "Consulting",
                    "Retail",
                  ].map((industry) => (
                    <Badge
                      key={industry}
                      variant={
                        preferences.industries.includes(industry)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => togglePreference("industries", industry)}
                    >
                      {preferences.industries.includes(industry) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preferred Tools */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Preferred Tools & Technologies
                </Label>
                <p className="text-sm text-gray-500">
                  Tools participants should be familiar with
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Figma",
                    "Sketch",
                    "Jira",
                    "Slack",
                    "Asana",
                    "Trello",
                    "Salesforce",
                    "HubSpot",
                    "Google Analytics",
                    "Tableau",
                  ].map((tool) => (
                    <Badge
                      key={tool}
                      variant={
                        preferences.tools.includes(tool) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => togglePreference("tools", tool)}
                    >
                      {preferences.tools.includes(tool) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Company Size */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Preferred Company Size
                </Label>
                <p className="text-sm text-gray-500">
                  Target company sizes for participants
                </p>
                <div className="flex flex-wrap gap-2">
                  {["1-10", "10-50", "51-200", "201-500", "500+"].map(
                    (size) => (
                      <Badge
                        key={size}
                        variant={
                          preferences.companySizes.includes(size)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => togglePreference("companySizes", size)}
                      >
                        {preferences.companySizes.includes(size) && (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        {size} employees
                      </Badge>
                    )
                  )}
                </div>
              </div>

              {/* Work Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Preferred Work Type
                </Label>
                <p className="text-sm text-gray-500">
                  Work arrangement preferences
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Remote", "Hybrid", "In-office"].map((type) => (
                    <Badge
                      key={type}
                      variant={
                        preferences.workTypes.includes(type)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => togglePreference("workTypes", type)}
                    >
                      {preferences.workTypes.includes(type) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className=""
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button className="">
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-yellow-900">
                    Deactivate Account
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Temporarily disable your account
                  </p>
                </div>
                <Button variant="outline" size="sm" className="">
                  Deactivate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="outline" size="sm" className="">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="">
            <CardHeader>
              <CardTitle>Browser Notifications</CardTitle>
              <CardDescription>
                Control what notifications you receive in the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">New Matches</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when new participants match your preferences
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNewMatches}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      pushNewMatches: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Messages</Label>
                  <p className="text-sm text-gray-500">
                    Notifications for new messages from participants
                  </p>
                </div>
                <Switch
                  checked={notifications.pushMessages}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      pushMessages: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    Search Complete
                  </Label>
                  <p className="text-sm text-gray-500">
                    Notification when your search finishes processing
                  </p>
                </div>
                <Switch
                  checked={notifications.pushSearchComplete}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      pushSearchComplete: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} className="">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

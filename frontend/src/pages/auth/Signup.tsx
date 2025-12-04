/**
 * Signup Page
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, User, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { supabase } from "@/context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    jobTitle: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            job_title: formData.jobTitle,
            role: "researcher",
          },
        },
      });

      if (error) throw error;
      navigate("/researcher");
    } catch (error: any) {
      setError(error.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(255, 247, 230)"
      gradientBackgroundEnd="rgb(255, 240, 200)"
      firstColor="255, 164, 0"
      secondColor="251, 191, 36"
      thirdColor="255, 210, 100"
      fourthColor="160, 185, 220"
      fifthColor="120, 150, 200"
      pointerColor="180, 197, 228"
      size="120%"
      blendingValue="normal"
      interactive={true}
    >
      <div className="absolute z-50 inset-0 flex items-center justify-center px-4 py-12 pointer-events-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md pointer-events-auto my-8"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white mb-4"
            >
              <div className="h-10 w-10 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
                <img
                  src="/recruitr-logo.png"
                  alt="Recruitr"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-3xl font-bold drop-shadow-lg">
                Recruitr
              </span>
            </Link>
            <p className="text-white/90 text-sm drop-shadow">
              Create your account to get started
            </p>
          </div>

          {/* Signup Form */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-center">Create account</h2>
            </CardHeader>

            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Acme Inc."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Product Manager"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 hover:scale-[1.02] hover:shadow-lg text-white transition-all duration-300"
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </BackgroundGradientAnimation>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Image from "next/image";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState("signin");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Check URL params for initial tab state and listen for changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab === "signup") {
      setActiveTab("signup");
    } else {
      setActiveTab("signin");
    }
  }, []);

  // Listen for URL changes (for when user clicks navbar buttons while already on signin page)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      setActiveTab(tab === "signup" ? "signup" : "signin");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const showMessage = (msg: string, type: "error" | "success" = "error") => {
    setMessage(msg);
    setMessageType(type);
    // Clear message after 5 seconds for success messages
    if (type === "success") {
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string, isSignUp: boolean = false) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (isSignUp && password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Listen for auth state changes and redirect when user signs in
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Small delay to ensure the auth state is fully updated
        setTimeout(() => {
          router.push("/");
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (email && emailError) {
      validateEmail(email);
    }
  }, [email, emailError]);

  useEffect(() => {
    if (password && passwordError) {
      setPasswordError("");
    }
  }, [password, passwordError]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showMessage(error.message, "error");
      setLoading(false);
    } else {
      showMessage("Signed in successfully!", "success");
      // Don't set loading to false here - let the auth state change handle the redirect
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password, true);

    if (!isEmailValid || !isPasswordValid) {
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      showMessage(error.message, "error");
    } else {
      showMessage("Check your email for the confirmation link!", "success");
      // Clear form after successful signup
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold">Memos</span>
          </div>

          {/* Testimonial */}
          <div className="space-y-6">
            <blockquote className="text-2xl xl:text-4xl font-light leading-relaxed">
              "Simply all the tools that my team and I need to stay organized
              and productive."
            </blockquote>
            <div>
              <div className="font-semibold text-lg">Sarah Johnson</div>
              <div className="text-purple-200">Product Manager at TechCorp</div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Memos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {activeTab === "signin"
                ? "Welcome back to Memos"
                : "Create your account"}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {activeTab === "signin"
                ? "Sign in to access your memories and stay organized"
                : "Start organizing your thoughts and memories today"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
                activeTab === "signin"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
                activeTab === "signup"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms */}
          {activeTab === "signin" ? (
            <form onSubmit={handleEmailSignIn} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`pl-4 pr-4 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-gray-400 transition-colors ${
                      emailError ? "border-red-300 focus:ring-red-500" : ""
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-sm">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`pl-4 pr-12 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-gray-400 transition-colors ${
                      passwordError ? "border-red-300 focus:ring-red-500" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flexflex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember sign in details
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-500 font-medium text-left sm:text-right"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Log in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleEmailSignUp} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="signup-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`pl-4 pr-4 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-gray-400 transition-colors ${
                    emailError ? "border-red-300 focus:ring-red-500" : ""
                  }`}
                />
                {emailError && (
                  <p className="text-red-500 text-sm">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="signup-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`pl-4 pr-12 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-gray-400 transition-colors ${
                      passwordError ? "border-red-300 focus:ring-red-500" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-4 pr-12 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-gray-400 transition-colors"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          {/* Error/Success Message */}
          {message && (
            <div
              className={`text-center text-sm p-4 rounded-lg ${
                messageType === "success"
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure email-based authentication powered by Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const router = useRouter();

  const showMessage = (msg: string, type: "error" | "success" = "error") => {
    setMessage(msg);
    setMessageType(type);
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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

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

    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters long", "error");
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

  // TODO: Implement phone authentication
  const handlePhoneSignIn = () => {
    showMessage("Phone authentication coming soon!", "error");
  };

  // TODO: Implement Google OAuth
  const handleGoogleSignIn = () => {
    showMessage("Google sign-in coming soon!", "error");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <Card className="w-full max-w-md shadow-2xl border-zinc-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-zinc-100">
            Welcome to Memos
          </CardTitle>
          <p className="text-center text-zinc-400">
            Sign in to your account or create a new one
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In - Placeholder */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={true}
            variant="outline"
            className="w-full flex items-center gap-3 h-11 border-zinc-600 hover:bg-zinc-700 opacity-50"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google (Coming Soon)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-zinc-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-400">
                Or continue with
              </span>
            </div>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger
                value="phone"
                className="flex items-center gap-2 opacity-50"
                disabled
              >
                <Phone className="w-4 h-4" />
                Phone (Soon)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-200">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-zinc-200">
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
                          className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-zinc-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-zinc-200">
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-password"
                        className="text-zinc-200"
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
                          className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-zinc-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirm-password"
                        className="text-zinc-200"
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
                          className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-zinc-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="phone" className="space-y-4">
              <div className="text-center py-8">
                <Phone className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">
                  Phone Authentication
                </h3>
                <p className="text-zinc-400 text-sm">
                  Phone number authentication will be available in a future
                  update.
                </p>
                <Button
                  onClick={handlePhoneSignIn}
                  disabled={true}
                  className="mt-4 opacity-50"
                >
                  Coming Soon
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {message && (
            <div
              className={`text-center text-sm p-3 rounded-md ${
                messageType === "success"
                  ? "bg-green-900/50 text-green-400 border border-green-800"
                  : "bg-red-900/50 text-red-400 border border-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

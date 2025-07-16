"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/app/providers";
import { Session } from "@supabase/supabase-js";
import { setUser } from "@/store/profileSlice";
import { AppDispatch } from "@/store/store";
import { toast } from "sonner";

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
          router.push("/signin");
          return;
        }

        setSession(session);

        // Update profile store with user data
        if (session?.user) {
          dispatch(setUser(session.user));
        }
      } catch (error) {
        console.error("Error in getSession:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        dispatch(setUser(session.user));
      } else {
        router.push("/signin");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, dispatch]);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast.error("Error signing out. Please try again.");
      } else {
        dispatch(setUser(null));
        toast.success("Signed out successfully!");
        router.push("/signin");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    } finally {
      setSignOutLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="container py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-zinc-400 mt-2">
            Manage your Memos preferences and account settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Overview */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Your account information and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.name || user.email || "User"}
                  />
                  <AvatarFallback className="bg-zinc-700 text-white text-lg">
                    {user.email ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        "User"}
                    </h3>
                    <Badge
                      variant={
                        user.email_confirmed_at ? "default" : "destructive"
                      }
                    >
                      {user.email_confirmed_at ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {user.email_confirmed_at ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 mb-4">{user.email}</p>
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    disabled={signOutLoading}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {signOutLoading ? "Signing out..." : "Sign Out"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Your account information and authentication details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User ID
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono">
                        {user.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user.id, "User ID")}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white">{user.email}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(user.email || "", "Email")
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {user.phone && (
                    <div>
                      <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </label>
                      <p className="text-white mt-1">{user.phone}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Email Verified
                    </label>
                    <p
                      className={`mt-1 ${
                        user.email_confirmed_at
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {user.email_confirmed_at ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </label>
                    <p className="text-white mt-1">
                      {user.created_at ? formatDate(user.created_at) : "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Last Sign In
                    </label>
                    <p className="text-white mt-1">
                      {user.last_sign_in_at
                        ? formatDate(user.last_sign_in_at)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Information */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">About Memos</CardTitle>
              <CardDescription className="text-zinc-400">
                Information about this Memos instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Version
                  </label>
                  <p className="text-white mt-1">1.0.0</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Authentication Provider
                  </label>
                  <p className="text-white mt-1">Supabase</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

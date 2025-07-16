"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemoryFilters } from "@/app/memories/components/MemoryFilters";
import { MemoriesSection } from "@/app/memories/components/MemoriesSection";
import SignIn from "@/components/auth/SignIn";
import { supabase } from "@/app/providers";
import { Session } from "@supabase/supabase-js";
import "@/styles/animation.css";

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not authenticated
  if (!session) {
    return <SignIn />;
  }

  // Show dashboard if authenticated
  return (
    <div className="text-white py-6">
      <div className="container">
        <div className="w-full mx-auto space-y-6">
          <div className="animate-fade-slide-down">
            <h1 className="text-3xl font-bold mb-2">Memos Dashboard</h1>
            <p className="text-zinc-400 mb-6">
              Welcome back, {session.user.email}! Manage your memories and
              explore your conversation history.
            </p>
          </div>

          <div>
            <div className="animate-fade-slide-down delay-1">
              <MemoryFilters />
            </div>
            <div className="animate-fade-slide-down delay-2">
              <MemoriesSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

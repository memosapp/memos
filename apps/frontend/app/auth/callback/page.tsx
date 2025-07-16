"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/providers";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error during auth callback:", error);
          router.push("/signin?error=auth_failed");
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          router.push("/");
        } else {
          // No session found, redirect to sign-in
          router.push("/signin");
        }
      } catch (error) {
        console.error("Unexpected error during auth callback:", error);
        router.push("/signin?error=unexpected_error");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-zinc-400">Completing authentication...</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { MemoriesSection } from "@/app/memories/components/MemoriesSection";
import { MemoryFilters } from "@/app/memories/components/MemoryFilters";
import { useRouter, useSearchParams } from "next/navigation";
import "@/styles/animation.css";
import UpdateMemo from "@/components/shared/update-memory";
import { useUI } from "@/hooks/useUI";

export default function MemoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateMemoDialog, handleCloseUpdateMemoDialog } = useUI();
  useEffect(() => {
    // Set default pagination values if not present in URL
    if (!searchParams.has("page") || !searchParams.has("size")) {
      const params = new URLSearchParams(searchParams.toString());
      if (!searchParams.has("page")) params.set("page", "1");
      if (!searchParams.has("size")) params.set("size", "10");
      router.push(`?${params.toString()}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <UpdateMemo
        memoId={updateMemoDialog.memoId || ""}
        memoContent={updateMemoDialog.memoContent || ""}
        open={updateMemoDialog.isOpen}
        onOpenChange={handleCloseUpdateMemoDialog}
      />
      <main className="flex-1 py-8">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8 animate-fade-slide-down">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Memories
                </h1>
                <p className="text-zinc-400 mt-1">
                  Manage and explore your captured memories
                </p>
              </div>
            </div>

            {/* Filters Section with enhanced styling */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 shadow-xl ">
              <MemoryFilters />
            </div>
          </div>

          {/* Main Content */}
          <div className="animate-fade-slide-down delay-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
              <MemoriesSection />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { MemoryFilters } from "@/app/memories/components/MemoryFilters";
import { MemoriesSection } from "@/app/memories/components/MemoriesSection";
import "@/styles/animation.css";

export default function DashboardPage() {
  return (
    <div className="text-white py-6">
      <div className="container">
        <div className="w-full mx-auto space-y-6">
          <div className="animate-fade-slide-down">
            <h1 className="text-3xl font-bold mb-2">OpenMemory Dashboard</h1>
            <p className="text-zinc-400 mb-6">
              Manage your memories and explore your conversation history
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

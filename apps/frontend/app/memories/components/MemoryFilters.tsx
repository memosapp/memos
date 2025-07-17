"use client";
import { Archive, Pause, Play, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiTrash2 } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { clearSelection } from "@/store/memoriesSlice";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { useEffect, useRef, useState, useCallback } from "react";
import { CreateMemoryDialog } from "@/app/memories/components/CreateMemoryDialog";
import { AdvancedMemoryFilters } from "@/app/memories/components/AdvancedMemoryFilters";
import { useToast } from "@/hooks/use-toast";

export function MemoryFilters() {
  const dispatch = useDispatch();
  const selectedMemoIds = useSelector(
    (state: RootState) => state.memories.selectedMemoIds
  );
  const { deleteMemo } = useMemoriesApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDeleteSelected = async () => {
    try {
      // Delete each selected memory
      await Promise.all(
        selectedMemoIds.map((id: number) => deleteMemo(id.toString()))
      );

      // Clear selection after successful deletion
      dispatch(clearSelection());

      // Show success toast
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedMemoIds.length} ${
          selectedMemoIds.length === 1 ? "memory" : "memories"
        }.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete memories:", error);
      toast({
        title: "Error",
        description: "Failed to delete selected memories. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Optimized search with validation and loading states
  const performSearch = useCallback(
    async (query: string) => {
      // Cancel previous search if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this search
      abortControllerRef.current = new AbortController();
      const currentController = abortControllerRef.current;

      setIsSearching(true);

      try {
        // Update URL with search query
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
          params.set("search", query);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1 on new search

        // Only update URL if search wasn't aborted
        if (!currentController.signal.aborted) {
          router.push(`?${params.toString()}`);
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Search error:", error);
        }
      } finally {
        if (!currentController.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [searchParams, router]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 1200),
    [performSearch]
  );

  // Initialize search input from URL
  useEffect(() => {
    const searchQuery = searchParams.get("search") || "";
    if (inputRef.current && inputRef.current.value !== searchQuery) {
      inputRef.current.value = searchQuery;
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Top Row - Search and Primary Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            ref={inputRef}
            placeholder="Search memories..."
            className="pl-10 pr-4 bg-zinc-800/50 border-zinc-700 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder-zinc-400"
            onChange={(e) => debouncedSearch(e.target.value)}
            disabled={isSearching}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-3">
          <CreateMemoryDialog
            trigger={
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
              >
                <Plus className="h-4 w-4" />
                New Memory
              </Button>
            }
          />

          {selectedMemoIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">
                {selectedMemoIds.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="gap-2 hover:bg-red-600 transition-colors"
              >
                <FiTrash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="border-t border-zinc-800 pt-4">
        <AdvancedMemoryFilters />
      </div>
    </div>
  );
}

"use client";
import { Archive, Pause, Play, Search } from "lucide-react";
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

export function MemoryFilters() {
  const dispatch = useDispatch();
  const selectedMemoIds = useSelector(
    (state: RootState) => state.memories.selectedMemoIds
  );
  const { deleteMemo } = useMemoriesApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDeleteSelected = async () => {
    try {
      // Delete each selected memory
      await Promise.all(
        selectedMemoIds.map((id: number) => deleteMemo(id.toString()))
      );
      dispatch(clearSelection());
    } catch (error) {
      console.error("Failed to delete memories:", error);
    }
  };

  // Optimized search with validation and loading states
  const performSearch = useCallback(
    async (query: string) => {
      // Cancel previous search if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this search
      abortControllerRef.current = new AbortController();

      try {
        setIsSearching(true);

        const params = new URLSearchParams(searchParams.toString());

        // Validate query length
        if (query && query.length < 2) {
          // Don't search for very short queries
          return;
        }

        if (query && query.length > 500) {
          // Trim excessively long queries
          query = query.substring(0, 500);
        }

        if (query) {
          params.set("search", query);
        } else {
          params.delete("search");
        }

        params.set("page", "1"); // Reset to page 1 on search
        router.push(`/memories?${params.toString()}`);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Search error:", error);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [searchParams, router]
  );

  // Debounced search with longer delay for better performance
  const handleSearch = debounce(performSearch, 750);

  useEffect(() => {
    // Set the input value to the current search param
    if (searchParams.get("search")) {
      if (inputRef.current) {
        inputRef.current.value = searchParams.get("search") || "";
      }
    }
  }, [searchParams]);

  // Cleanup: Cancel any pending search when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      handleSearch.cancel();
    };
  }, [handleSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            ref={inputRef}
            placeholder="Search memories... (min 2 characters)"
            className="pl-8 bg-zinc-950 border-zinc-800 max-w-[500px]"
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isSearching}
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white"></div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <CreateMemoryDialog />
          {selectedMemoIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-zinc-900 text-zinc-300">
                  Actions ({selectedMemoIds.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDeleteSelected}
                  className="text-red-600 hover:text-red-700"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <AdvancedMemoryFilters />
    </div>
  );
}

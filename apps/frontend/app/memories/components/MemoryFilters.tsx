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
import { useEffect, useRef } from "react";
import { CreateMemoryDialog } from "@/app/memories/components/CreateMemoryDialog";

export function MemoryFilters() {
  const dispatch = useDispatch();
  const selectedMemoryIds = useSelector(
    (state: RootState) => state.memories.selectedMemoryIds
  );
  const { deleteMemo } = useMemoriesApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDeleteSelected = async () => {
    try {
      // Delete each selected memory
      await Promise.all(selectedMemoryIds.map((id) => deleteMemo(id)));
      dispatch(clearSelection());
    } catch (error) {
      console.error("Failed to delete memories:", error);
    }
  };

  // Simplified search - just redirect to search URL
  const handleSearch = debounce(async (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset to page 1 on search
    router.push(`/memories?${params.toString()}`);
  }, 500);

  useEffect(() => {
    // Set the input value to the current search param
    if (searchParams.get("search")) {
      if (inputRef.current) {
        inputRef.current.value = searchParams.get("search") || "";
      }
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          ref={inputRef}
          placeholder="Search memories..."
          className="pl-8 bg-zinc-950 border-zinc-800 max-w-[500px]"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <CreateMemoryDialog />
        {selectedMemoryIds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-zinc-900 text-zinc-300">
                Actions ({selectedMemoryIds.length})
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
  );
}

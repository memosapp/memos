import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Memo } from "@/components/types";
import { MemoryTable } from "./MemoryTable";
import { MemoryPagination } from "./MemoryPagination";
import { CreateMemoryDialog } from "./CreateMemoryDialog";
import { PageSizeSelector } from "./PageSizeSelector";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useRouter, useSearchParams } from "next/navigation";
import { MemoryTableSkeleton } from "@/skeleton/MemoryTableSkeleton";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setMemoriesSuccess } from "@/store/memoriesSlice";

export function MemoriesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { fetchMemos, searchMemos } = useMemoriesApi();
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const userId = useSelector((state: RootState) => state.profile.userId);
  const memories = useSelector((state: RootState) => state.memories.memories);

  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = Number(searchParams.get("size")) || 10;
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    const loadMemos = async () => {
      setIsLoading(true);
      try {
        let result: Memo[];

        if (searchQuery) {
          // Use search API for queries
          result = await searchMemos({
            query: searchQuery,
            userId: userId,
            limit: itemsPerPage,
          });
        } else {
          // Use regular fetch for listing
          result = await fetchMemos({
            userId: userId,
            limit: itemsPerPage,
            offset: (currentPage - 1) * itemsPerPage,
          });
        }

        // Dispatch to store so MemoryTable can access the data
        dispatch(setMemoriesSuccess(result));
        setTotalItems(result.length); // For now, since backend doesn't return total count
      } catch (error) {
        console.error("Failed to fetch memos:", error);
        dispatch(setMemoriesSuccess([]));
        setTotalItems(0);
      }
      setIsLoading(false);
    };

    loadMemos();
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    fetchMemos,
    searchMemos,
    userId,
    dispatch,
  ]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const setCurrentPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    params.set("size", itemsPerPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset to page 1 when changing page size
    params.set("size", size.toString());
    router.push(`?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-transparent">
        <MemoryTableSkeleton />
        <div className="flex items-center justify-between mt-4">
          <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          {searchQuery ? `Search results for "${searchQuery}"` : "All Memories"}
        </h2>
        <CreateMemoryDialog />
      </div>

      <MemoryTable />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">
            Showing {memories.length} of {totalItems} memories
          </span>
        </div>

        <div className="flex items-center gap-4">
          <PageSizeSelector
            pageSize={itemsPerPage}
            onPageSizeChange={handlePageSizeChange}
          />

          {!searchQuery && (
            <MemoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

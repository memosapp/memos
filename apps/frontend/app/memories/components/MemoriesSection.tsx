"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setMemoriesSuccess } from "@/store/memoriesSlice";
import { MemoryTable } from "./MemoryTable";
import { MemoryPagination } from "./MemoryPagination";
import { PageSizeSelector } from "./PageSizeSelector";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { Memo } from "@/components/types";

// Utility function to serialize memo dates for Redux
const serializeMemo = (memo: Memo): Memo => ({
  ...memo,
  createdAt:
    typeof memo.createdAt === "string"
      ? memo.createdAt
      : memo.createdAt.toISOString(),
  updatedAt:
    typeof memo.updatedAt === "string"
      ? memo.updatedAt
      : memo.updatedAt.toISOString(),
});

export function MemoriesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { fetchMemos, searchMemos } = useMemoriesApi();
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const memos = useSelector((state: RootState) => state.memories.memos);

  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = Number(searchParams.get("size")) || 10;
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    const loadMemos = async () => {
      setIsLoading(true);
      try {
        let result: Memo[];

        if (searchQuery) {
          // Use search API for queries - userId is now handled by auth middleware
          result = await searchMemos({
            query: searchQuery,
            limit: itemsPerPage,
          });
        } else {
          // Use regular fetch for listing - userId is now handled by auth middleware
          result = await fetchMemos({
            limit: itemsPerPage,
            offset: (currentPage - 1) * itemsPerPage,
          });
        }

        // Serialize memos before dispatching to Redux store
        const serializedMemos = result.map(serializeMemo);
        dispatch(setMemoriesSuccess(serializedMemos));
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
    dispatch,
  ]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("size", size.toString());
    params.set("page", "1"); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-400">
            {isLoading ? "Loading..." : `${totalItems} memories found`}
          </span>
        </div>
        <PageSizeSelector
          pageSize={itemsPerPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <MemoryTable />

      {totalPages > 1 && (
        <MemoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={handlePageChange}
        />
      )}
    </div>
  );
}

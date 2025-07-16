"use client";

import { useEffect, useState, useMemo } from "react";
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

  // Extract filtering and sorting parameters - memoized to prevent infinite loops
  const appNames = useMemo(() => {
    return searchParams.get("appNames")?.split(",").filter(Boolean) || [];
  }, [searchParams.get("appNames")]);

  const tags = useMemo(() => {
    return searchParams.get("tags")?.split(",").filter(Boolean) || [];
  }, [searchParams.get("tags")]);

  const authorRoles = useMemo(() => {
    return searchParams.get("authorRoles")?.split(",").filter(Boolean) || [];
  }, [searchParams.get("authorRoles")]);

  const sortBy = searchParams.get("sortBy") || "updatedAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  useEffect(() => {
    const loadMemos = async () => {
      setIsLoading(true);
      try {
        let result: Memo[];

        if (searchQuery) {
          // Use search API for queries - userId is now handled by auth middleware
          result = await searchMemos({
            query: searchQuery,
            limit: 100, // Fetch more for client-side filtering
          });
        } else {
          // Use regular fetch for listing - userId is now handled by auth middleware
          result = await fetchMemos({
            limit: 100, // Fetch more for client-side filtering
            offset: 0,
          });
        }

        // Apply client-side filtering
        let filteredMemos = result;

        // Filter by app names
        if (appNames.length > 0) {
          filteredMemos = filteredMemos.filter(
            (memo) => memo.appName && appNames.includes(memo.appName)
          );
        }

        // Filter by tags
        if (tags.length > 0) {
          filteredMemos = filteredMemos.filter(
            (memo) => memo.tags && memo.tags.some((tag) => tags.includes(tag))
          );
        }

        // Filter by author roles
        if (authorRoles.length > 0) {
          filteredMemos = filteredMemos.filter((memo) =>
            authorRoles.includes(memo.authorRole)
          );
        }

        // Apply sorting
        filteredMemos.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortBy) {
            case "createdAt":
              aValue =
                typeof a.createdAt === "string"
                  ? new Date(a.createdAt)
                  : a.createdAt;
              bValue =
                typeof b.createdAt === "string"
                  ? new Date(b.createdAt)
                  : b.createdAt;
              break;
            case "updatedAt":
              aValue =
                typeof a.updatedAt === "string"
                  ? new Date(a.updatedAt)
                  : a.updatedAt;
              bValue =
                typeof b.updatedAt === "string"
                  ? new Date(b.updatedAt)
                  : b.updatedAt;
              break;
            case "accessCount":
              aValue = a.accessCount || 0;
              bValue = b.accessCount || 0;
              break;
            default:
              aValue =
                typeof a.updatedAt === "string"
                  ? new Date(a.updatedAt)
                  : a.updatedAt;
              bValue =
                typeof b.updatedAt === "string"
                  ? new Date(b.updatedAt)
                  : b.updatedAt;
          }

          if (sortOrder === "asc") {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        // Apply pagination to filtered results
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedMemos = filteredMemos.slice(
          startIndex,
          startIndex + itemsPerPage
        );

        // Serialize memos before dispatching to Redux store
        const serializedMemos = paginatedMemos.map(serializeMemo);
        dispatch(setMemoriesSuccess(serializedMemos));
        setTotalItems(filteredMemos.length); // Total count of filtered results
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
    appNames,
    tags,
    authorRoles,
    sortBy,
    sortOrder,
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

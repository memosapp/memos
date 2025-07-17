import { useState, useCallback } from "react";
import apiClient from "@/lib/api";
import {
  Memo,
  CreateMemoRequest,
  UpdateMemoRequest,
  SearchRequest,
  AuthorRole,
} from "@/components/types";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  setMemoriesSuccess,
  setMemoriesError,
  setMemoriesLoading,
  setSelectedMemo,
  resetMemoriesState,
  removeMemo,
} from "@/store/memoriesSlice";

export interface UseMemoriesApiReturn {
  createMemo: (request: Omit<CreateMemoRequest, "userId">) => Promise<Memo>;
  fetchMemos: (options?: FetchMemosOptions) => Promise<Memo[]>;
  fetchMemoById: (id: string) => Promise<Memo>;
  updateMemo: (id: string, updates: UpdateMemoRequest) => Promise<Memo>;
  deleteMemo: (id: string) => Promise<void>;
  searchMemos: (request: Omit<SearchRequest, "userId">) => Promise<Memo[]>;
  isLoading: boolean;
  error: string | null;
}

export interface FetchMemosOptions {
  sessionId?: string;
  limit?: number;
  offset?: number;
}

// Utility functions to handle date serialization
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
  lastAccessedAt:
    typeof memo.lastAccessedAt === "string"
      ? memo.lastAccessedAt
      : memo.lastAccessedAt?.toISOString(),
});

const deserializeMemo = (memo: any): Memo => ({
  ...memo,
  createdAt: new Date(memo.createdAt),
  updatedAt: new Date(memo.updatedAt),
  lastAccessedAt: new Date(memo.lastAccessedAt),
});

export const useMemoriesApi = (): UseMemoriesApiReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const createMemo = useCallback(
    async (request: Omit<CreateMemoRequest, "userId">): Promise<Memo> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post("/memo", request);
        const memo = deserializeMemo(response.data);

        setIsLoading(false);
        return memo;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to create memo";
        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const fetchMemos = useCallback(
    async (options: FetchMemosOptions = {}): Promise<Memo[]> => {
      setIsLoading(true);
      setError(null);
      dispatch(setMemoriesLoading());
      try {
        const params = new URLSearchParams();

        if (options.sessionId) params.append("sessionId", options.sessionId);
        if (options.limit) params.append("limit", options.limit.toString());
        if (options.offset) params.append("offset", options.offset.toString());

        const response = await apiClient.get(`/memos?${params.toString()}`);

        // Serialize memos for Redux state (convert Date objects to ISO strings)
        const serializedMemos = response.data.map(serializeMemo);

        // Create memos with Date objects for return value
        const memos = response.data.map(deserializeMemo);

        dispatch(setMemoriesSuccess(serializedMemos));
        setIsLoading(false);
        return memos;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to fetch memos";
        setError(errorMessage);
        dispatch(setMemoriesError(errorMessage));
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    [dispatch]
  );

  const fetchMemoById = useCallback(
    async (id: string): Promise<Memo> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/memo/${id}`);
        const memo = deserializeMemo(response.data);

        // Set the selected memo directly
        dispatch(setSelectedMemo(memo));
        setIsLoading(false);
        return memo;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to fetch memo";
        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    [dispatch]
  );

  const updateMemo = useCallback(
    async (id: string, updates: UpdateMemoRequest): Promise<Memo> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.patch(`/memo/${id}`, updates);
        const memo = deserializeMemo(response.data);

        setIsLoading(false);
        return memo;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to update memo";
        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const deleteMemo = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await apiClient.delete(`/memo/${id}`);
        // Remove the memo from Redux state after successful deletion
        dispatch(removeMemo(parseInt(id)));
        setIsLoading(false);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to delete memo";
        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    [dispatch]
  );

  const searchMemos = useCallback(
    async (request: Omit<SearchRequest, "userId">): Promise<Memo[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post("/search", request);
        const memos = response.data.map(deserializeMemo);

        setIsLoading(false);
        return memos;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to search memos";
        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    []
  );

  return {
    createMemo,
    fetchMemos,
    fetchMemoById,
    updateMemo,
    deleteMemo,
    searchMemos,
    isLoading,
    error,
  };
};

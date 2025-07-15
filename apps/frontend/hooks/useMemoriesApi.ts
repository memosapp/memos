import { useState, useCallback } from "react";
import axios from "axios";
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
  setSelectedMemory,
  resetMemoriesState,
} from "@/store/memoriesSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface UseMemoriesApiReturn {
  createMemo: (request: CreateMemoRequest) => Promise<Memo>;
  fetchMemos: (options?: FetchMemosOptions) => Promise<Memo[]>;
  fetchMemoById: (id: string) => Promise<Memo>;
  updateMemo: (id: string, updates: UpdateMemoRequest) => Promise<Memo>;
  deleteMemo: (id: string) => Promise<void>;
  searchMemos: (request: SearchRequest) => Promise<Memo[]>;
  isLoading: boolean;
  error: string | null;
}

export interface FetchMemosOptions {
  userId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export const useMemoriesApi = (): UseMemoriesApiReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const createMemo = useCallback(
    async (request: CreateMemoRequest): Promise<Memo> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post(`${API_BASE_URL}/memo`, request);
        const memo = response.data;

        // Convert date strings to Date objects
        memo.createdAt = new Date(memo.createdAt);
        memo.updatedAt = new Date(memo.updatedAt);

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

        if (options.userId) params.append("userId", options.userId);
        if (options.sessionId) params.append("sessionId", options.sessionId);
        if (options.limit) params.append("limit", options.limit.toString());
        if (options.offset) params.append("offset", options.offset.toString());

        const response = await axios.get(
          `${API_BASE_URL}/memos?${params.toString()}`
        );
        const memos = response.data.map((memo: any) => ({
          ...memo,
          createdAt: new Date(memo.createdAt),
          updatedAt: new Date(memo.updatedAt),
        }));

        dispatch(setMemoriesSuccess(memos));
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
        const response = await axios.get(`${API_BASE_URL}/memo/${id}`);
        const memo = response.data;

        // Convert date strings to Date objects
        memo.createdAt = new Date(memo.createdAt);
        memo.updatedAt = new Date(memo.updatedAt);

        // Convert to the format expected by the selectedMemory state
        const selectedMemo = {
          id: memo.id.toString(),
          text: memo.content,
          created_at: memo.createdAt.toISOString(),
          state: "active",
          categories: memo.tags || [],
          app_name: memo.sessionId, // Using sessionId as app_name for now
        };

        dispatch(setSelectedMemory(selectedMemo));
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
        const response = await axios.patch(
          `${API_BASE_URL}/memo/${id}`,
          updates
        );
        const memo = response.data;

        // Convert date strings to Date objects
        memo.createdAt = new Date(memo.createdAt);
        memo.updatedAt = new Date(memo.updatedAt);

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

  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_BASE_URL}/memo/${id}`);
      setIsLoading(false);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to delete memo";
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  const searchMemos = useCallback(
    async (request: SearchRequest): Promise<Memo[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post(`${API_BASE_URL}/search`, request);
        const memos = response.data.map((memo: any) => ({
          ...memo,
          createdAt: new Date(memo.createdAt),
          updatedAt: new Date(memo.updatedAt),
        }));

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

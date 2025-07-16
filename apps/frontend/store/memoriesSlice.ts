import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Memo } from "@/components/types";

interface AccessLogEntry {
  id: string;
  app_name: string;
  accessed_at: string;
}

// Define the shape of the memories state
interface MemoriesState {
  memos: Memo[];
  selectedMemo: Memo | null;
  accessLogs: AccessLogEntry[];
  relatedMemos: Memo[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  selectedMemoIds: number[];
}

const initialState: MemoriesState = {
  memos: [],
  selectedMemo: null,
  accessLogs: [],
  relatedMemos: [],
  status: "idle",
  error: null,
  selectedMemoIds: [],
};

const memoriesSlice = createSlice({
  name: "memories",
  initialState,
  reducers: {
    setSelectedMemo: (state, action: PayloadAction<Memo | null>) => {
      state.selectedMemo = action.payload;
    },
    setAccessLogs: (state, action: PayloadAction<AccessLogEntry[]>) => {
      state.accessLogs = action.payload;
    },
    setMemoriesLoading: (state) => {
      state.status = "loading";
      state.error = null;
      state.memos = [];
    },
    setMemoriesSuccess: (state, action: PayloadAction<Memo[]>) => {
      state.status = "succeeded";
      state.error = null;
      state.memos = action.payload;
    },
    setMemoriesError: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },
    resetMemoriesState: (state) => {
      state.status = "idle";
      state.error = null;
      state.memos = [];
      state.selectedMemoIds = [];
      state.selectedMemo = null;
      state.accessLogs = [];
      state.relatedMemos = [];
    },
    selectMemo: (state, action: PayloadAction<number>) => {
      if (!state.selectedMemoIds.includes(action.payload)) {
        state.selectedMemoIds.push(action.payload);
      }
    },
    deselectMemo: (state, action: PayloadAction<number>) => {
      state.selectedMemoIds = state.selectedMemoIds.filter(
        (id) => id !== action.payload
      );
    },
    selectAllMemos: (state) => {
      state.selectedMemoIds = state.memos.map((memo) => memo.id);
    },
    clearSelection: (state) => {
      state.selectedMemoIds = [];
    },
    setRelatedMemos: (state, action: PayloadAction<Memo[]>) => {
      state.relatedMemos = action.payload;
    },
  },
});

export const {
  setMemoriesLoading,
  setMemoriesSuccess,
  setMemoriesError,
  resetMemoriesState,
  selectMemo,
  deselectMemo,
  selectAllMemos,
  clearSelection,
  setSelectedMemo,
  setAccessLogs,
  setRelatedMemos,
} = memoriesSlice.actions;

export default memoriesSlice.reducer;

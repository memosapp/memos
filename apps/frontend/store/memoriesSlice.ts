import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Memo, Memory } from "@/components/types";

// Define the simplified memory type for selectedMemory backwards compatibility
export interface SimpleMemory {
  id: string;
  memory: string;
  metadata: any;
  tags: string[];
  created_at: number;
  state: "active" | "paused" | "archived" | "deleted";
}

interface AccessLogEntry {
  id: string;
  app_name: string;
  accessed_at: string;
}

// Define the shape of the memories state
interface MemoriesState {
  memos: Memo[];
  memories: Memory[]; // Keep for backward compatibility
  selectedMemory: SimpleMemory | null;
  accessLogs: AccessLogEntry[];
  relatedMemories: Memory[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  selectedMemoryIds: string[];
}

const initialState: MemoriesState = {
  memos: [],
  memories: [],
  selectedMemory: null,
  accessLogs: [],
  relatedMemories: [],
  status: "idle",
  error: null,
  selectedMemoryIds: [],
};

const memoriesSlice = createSlice({
  name: "memories",
  initialState,
  reducers: {
    setSelectedMemory: (state, action: PayloadAction<SimpleMemory | null>) => {
      state.selectedMemory = action.payload;
    },
    setAccessLogs: (state, action: PayloadAction<AccessLogEntry[]>) => {
      state.accessLogs = action.payload;
    },
    setMemoriesLoading: (state) => {
      state.status = "loading";
      state.error = null;
      state.memos = [];
      state.memories = [];
    },
    setMemoriesSuccess: (state, action: PayloadAction<Memo[] | Memory[]>) => {
      state.status = "succeeded";
      state.error = null;

      // Check if it's the new Memo format or legacy Memory format
      if (action.payload.length > 0 && "sessionId" in action.payload[0]) {
        // New Memo format - dates should already be serialized as strings
        state.memos = action.payload as Memo[];
        // Convert all Memos to legacy Memory format for backward compatibility
        state.memories = (action.payload as Memo[]).map((memo: Memo) => {
          // Handle both Date and string formats for createdAt
          const createdAtDate =
            typeof memo.createdAt === "string"
              ? new Date(memo.createdAt)
              : memo.createdAt;

          return {
            id: memo.id.toString(),
            memory: memo.content,
            metadata: {
              sessionId: memo.sessionId,
              userId: memo.userId,
              summary: memo.summary,
              authorRole: memo.authorRole,
              importance: memo.importance,
              accessCount: memo.accessCount,
              createdAt: memo.createdAt, // Keep as string for serialization
              updatedAt: memo.updatedAt, // Keep as string for serialization
            },
            tags: memo.tags || [],
            created_at: createdAtDate.getTime(),
            state: "active" as const,
          };
        });
      } else {
        // Legacy Memory format
        state.memories = action.payload as Memory[];
      }
    },
    setMemoriesError: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },
    resetMemoriesState: (state) => {
      state.status = "idle";
      state.error = null;
      state.memos = [];
      state.memories = [];
      state.selectedMemoryIds = [];
      state.selectedMemory = null;
      state.accessLogs = [];
      state.relatedMemories = [];
    },
    selectMemory: (state, action: PayloadAction<string>) => {
      if (!state.selectedMemoryIds.includes(action.payload)) {
        state.selectedMemoryIds.push(action.payload);
      }
    },
    deselectMemory: (state, action: PayloadAction<string>) => {
      state.selectedMemoryIds = state.selectedMemoryIds.filter(
        (id) => id !== action.payload
      );
    },
    selectAllMemories: (state) => {
      state.selectedMemoryIds = state.memories.map((memory) => memory.id);
    },
    clearSelection: (state) => {
      state.selectedMemoryIds = [];
    },
    setRelatedMemories: (state, action: PayloadAction<Memory[]>) => {
      state.relatedMemories = action.payload;
    },
  },
});

export const {
  setMemoriesLoading,
  setMemoriesSuccess,
  setMemoriesError,
  resetMemoriesState,
  selectMemory,
  deselectMemory,
  selectAllMemories,
  clearSelection,
  setSelectedMemory,
  setAccessLogs,
  setRelatedMemories,
} = memoriesSlice.actions;

export default memoriesSlice.reducer;

export enum AuthorRole {
  USER = "user",
  AGENT = "agent",
  SYSTEM = "system",
}

export interface Memo {
  id: number;
  sessionId: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  accessCount?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoRequest {
  sessionId: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  tags?: string[];
}

export interface UpdateMemoRequest {
  sessionId?: string;
  userId?: string;
  content?: string;
  summary?: string;
  authorRole?: AuthorRole;
  importance?: number;
  tags?: string[];
}

export interface SearchRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  limit?: number;
}

// Legacy interface for backward compatibility - updated to match backend structure
export interface Memory {
  id: string;
  memory: string;
  metadata: any;
  tags: string[]; // Tags for organizing memories
  created_at: number;
  state: "active" | "paused" | "archived" | "deleted";
}

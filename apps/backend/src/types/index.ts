export enum AuthorRole {
  USER = "user",
  AGENT = "agent",
  SYSTEM = "system",
}

export interface Memo {
  id: number;
  sessionId?: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  accessCount?: number;
  tags?: string[];
  appName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoRequest {
  sessionId?: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  tags?: string[];
  appName?: string;
}

export interface UpdateMemoRequest {
  sessionId?: string;
  userId?: string;
  content?: string;
  summary?: string;
  authorRole?: AuthorRole;
  importance?: number;
  tags?: string[];
  appName?: string;
}

export interface SearchRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  limit?: number;
  // Enhanced search parameters
  tags?: string[];
  authorRole?: AuthorRole;
  minImportance?: number;
  maxImportance?: number;
  sortBy?: "relevance" | "importance" | "recency" | "popularity";
  includePopular?: boolean;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

export enum AuthorRole {
  USER = "user",
  AGENT = "agent",
  SYSTEM = "system",
}

export enum ApiKeyPermission {
  READ = "read",
  WRITE = "write",
  ADMIN = "admin",
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

export interface ApiKey {
  id: number;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  isActive: boolean;
  lastUsedAt?: Date;
  usageCount: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isExpired?: boolean;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
}

export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: ApiKeyPermission[];
  isActive?: boolean;
  expiresAt?: Date;
}

export interface GeneratedApiKey {
  id: number;
  name: string;
  key: string; // Plain text key - only shown once
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
  createdAt: Date;
}

export interface ApiKeyAuthResult {
  isValid: boolean;
  userId?: string;
  permissions?: ApiKeyPermission[];
  keyId?: number;
}

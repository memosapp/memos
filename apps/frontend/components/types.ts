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
  sessionId: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  accessCount?: number;
  tags?: string[];
  appName?: string;
  createdAt: Date | string; // Allow both Date and string for flexibility
  updatedAt: Date | string; // Allow both Date and string for flexibility
}

export interface CreateMemoRequest {
  sessionId: string;
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
}

export interface ApiKey {
  id: number;
  userId: string;
  name: string;
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  isActive: boolean;
  lastUsedAt?: Date | string;
  usageCount: number;
  expiresAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  isExpired?: boolean;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date | string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: ApiKeyPermission[];
  isActive?: boolean;
  expiresAt?: Date | string;
}

export interface GeneratedApiKey {
  id: number;
  name: string;
  key: string; // Plain text key - only shown once
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date | string;
  createdAt: Date | string;
}

export interface ApiKeyStats {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  totalUsage: number;
}

export interface ApiKeyPermissionInfo {
  value: ApiKeyPermission;
  label: string;
  description: string;
}

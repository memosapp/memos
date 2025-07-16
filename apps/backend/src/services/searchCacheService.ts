import { Memo } from "../types";

interface CacheEntry {
  data: Memo[];
  timestamp: number;
  expiresAt: number;
}

interface SearchCacheStore {
  [key: string]: CacheEntry;
}

// In-memory cache store (consider using Redis for production)
const cache: SearchCacheStore = {};

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached queries

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(cache).forEach((key) => {
    if (cache[key].expiresAt < now) {
      delete cache[key];
    }
  });
}, 60000); // Clean every minute

// Generate cache key from search parameters
export const generateCacheKey = (
  userId: string,
  query: string,
  sessionId?: string,
  limit?: number,
  tags?: string[],
  authorRole?: string,
  minImportance?: number,
  maxImportance?: number,
  sortBy?: string,
  includePopular?: boolean
): string => {
  return JSON.stringify({
    userId,
    query: query.toLowerCase().trim(),
    sessionId,
    limit,
    tags,
    authorRole,
    minImportance,
    maxImportance,
    sortBy,
    includePopular,
  });
};

// Get cached search results
export const getCachedSearchResults = (cacheKey: string): Memo[] | null => {
  const entry = cache[cacheKey];

  if (!entry) {
    return null;
  }

  const now = Date.now();

  // Check if expired
  if (entry.expiresAt < now) {
    delete cache[cacheKey];
    return null;
  }

  return entry.data;
};

// Cache search results
export const cacheSearchResults = (cacheKey: string, results: Memo[]): void => {
  const now = Date.now();

  // Implement simple LRU eviction if cache is full
  if (Object.keys(cache).length >= MAX_CACHE_SIZE) {
    const oldestKey = Object.keys(cache).reduce((oldest, key) => {
      return cache[key].timestamp < cache[oldest].timestamp ? key : oldest;
    });
    delete cache[oldestKey];
  }

  cache[cacheKey] = {
    data: results,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
  };
};

// Clear cache for specific user (useful when user creates/updates/deletes memos)
export const clearUserCache = (userId: string): void => {
  Object.keys(cache).forEach((key) => {
    try {
      const parsedKey = JSON.parse(key);
      if (parsedKey.userId === userId) {
        delete cache[key];
      }
    } catch (e) {
      // Invalid cache key, remove it
      delete cache[key];
    }
  });
};

// Clear all cache
export const clearAllCache = (): void => {
  Object.keys(cache).forEach((key) => {
    delete cache[key];
  });
};

// Get cache statistics
export const getCacheStats = () => {
  const now = Date.now();
  const validEntries = Object.values(cache).filter(
    (entry) => entry.expiresAt > now
  );

  return {
    totalEntries: Object.keys(cache).length,
    validEntries: validEntries.length,
    expiredEntries: Object.keys(cache).length - validEntries.length,
    memoryUsage: JSON.stringify(cache).length,
  };
};

import { pool } from "../config/database";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  ApiKey,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  GeneratedApiKey,
  ApiKeyAuthResult,
  ApiKeyPermission,
} from "../types";

// PostgreSQL array parsing is now handled automatically by type parsers
// configured in src/config/types.ts

const SALT_ROUNDS = 12;
const KEY_LENGTH = 32; // 32 bytes = 256 bits

export class ApiKeyService {
  /**
   * Generate a cryptographically secure API key
   */
  private static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(KEY_LENGTH);
    return `memos_${randomBytes.toString("hex")}`;
  }

  /**
   * Get key prefix for identification (first 16 characters)
   */
  private static getKeyPrefix(key: string): string {
    return key.substring(0, 16);
  }

  /**
   * Hash an API key for secure storage
   */
  private static async hashKey(key: string): Promise<string> {
    return await bcrypt.hash(key, SALT_ROUNDS);
  }

  /**
   * Verify an API key against its hash
   */
  private static async verifyKey(key: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(key, hash);
  }

  /**
   * Create a new API key for a user
   */
  static async createApiKey(
    userId: string,
    request: CreateApiKeyRequest
  ): Promise<GeneratedApiKey> {
    const { name, permissions, expiresAt } = request;

    // Validate permissions
    const validPermissions = permissions.every((perm) =>
      Object.values(ApiKeyPermission).includes(perm)
    );
    if (!validPermissions) {
      throw new Error("Invalid permissions provided");
    }

    // Generate secure API key
    const key = this.generateApiKey();
    const keyPrefix = this.getKeyPrefix(key);
    const keyHash = await this.hashKey(key);

    try {
      const query = `
        INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, name, key_prefix, permissions, expires_at, created_at
      `;

      const values = [
        userId,
        name,
        keyHash,
        keyPrefix,
        permissions,
        expiresAt || null,
      ];

      const result = await pool.query(query, values);
      const row = result.rows[0];

      return {
        id: row.id,
        name: row.name,
        key, // Return the plain text key only once
        keyPrefix: row.key_prefix,
        permissions: row.permissions,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      };
    } catch (error: any) {
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.constraint === "api_keys_user_id_name_unique") {
          throw new Error("An API key with this name already exists");
        }
      }
      throw error;
    }
  }

  /**
   * Get all API keys for a user (without sensitive data)
   */
  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const query = `
      SELECT * FROM api_keys_view 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      keyHash: "", // Never return the hash
      keyPrefix: row.key_prefix,
      permissions: row.permissions,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      usageCount: row.usage_count,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isExpired: row.is_expired,
    }));
  }

  /**
   * Get a specific API key by ID and user ID
   */
  static async getApiKeyById(
    keyId: number,
    userId: string
  ): Promise<ApiKey | null> {
    const query = `
      SELECT * FROM api_keys_view 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [keyId, userId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      keyHash: "", // Never return the hash
      keyPrefix: row.key_prefix,
      permissions: row.permissions,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      usageCount: row.usage_count,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isExpired: row.is_expired,
    };
  }

  /**
   * Update an existing API key
   */
  static async updateApiKey(
    keyId: number,
    userId: string,
    request: UpdateApiKeyRequest
  ): Promise<ApiKey | null> {
    const { name, permissions, isActive, expiresAt } = request;

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = permissions.every((perm) =>
        Object.values(ApiKeyPermission).includes(perm)
      );
      if (!validPermissions) {
        throw new Error("Invalid permissions provided");
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (permissions !== undefined) {
      updateFields.push(`permissions = $${paramIndex++}`);
      values.push(permissions);
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (expiresAt !== undefined) {
      updateFields.push(`expires_at = $${paramIndex++}`);
      values.push(expiresAt);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(keyId, userId);

    const query = `
      UPDATE api_keys 
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING id
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return null;

      return await this.getApiKeyById(keyId, userId);
    } catch (error: any) {
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.constraint === "api_keys_user_id_name_unique") {
          throw new Error("An API key with this name already exists");
        }
      }
      throw error;
    }
  }

  /**
   * Delete an API key
   */
  static async deleteApiKey(keyId: number, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM api_keys 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [keyId, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Authenticate an API key and return user info
   */
  static async authenticateApiKey(apiKey: string): Promise<ApiKeyAuthResult> {
    if (!apiKey || !apiKey.startsWith("memos_")) {
      return { isValid: false };
    }

    const keyPrefix = this.getKeyPrefix(apiKey);

    try {
      const query = `
        SELECT id, user_id, key_hash, permissions, is_active, expires_at
        FROM api_keys 
        WHERE key_prefix = $1 AND is_active = true
      `;

      const result = await pool.query(query, [keyPrefix]);

      // Check all keys with this prefix (should be very few)
      for (const row of result.rows) {
        // Check if key is expired
        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          continue;
        }

        // Verify the key hash
        const isValid = await this.verifyKey(apiKey, row.key_hash);
        if (isValid) {
          // Update usage statistics
          await this.updateKeyUsage(row.id);

          return {
            isValid: true,
            userId: row.user_id,
            permissions: row.permissions,
            keyId: row.id,
          };
        }
      }

      return { isValid: false };
    } catch (error) {
      console.error("Error authenticating API key:", error);
      return { isValid: false };
    }
  }

  /**
   * Update API key usage statistics
   */
  private static async updateKeyUsage(keyId: number): Promise<void> {
    const query = `
      UPDATE api_keys 
      SET usage_count = usage_count + 1, last_used_at = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [keyId]);
  }

  /**
   * Clean up expired API keys
   */
  static async cleanupExpiredKeys(): Promise<number> {
    const query = `SELECT cleanup_expired_api_keys() as deleted_count`;
    const result = await pool.query(query);
    return result.rows[0].deleted_count;
  }

  /**
   * Get API key statistics for a user
   */
  static async getUserKeyStats(userId: string): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    totalUsage: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_keys,
        COUNT(*) FILTER (WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())) as active_keys,
        COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW()) as expired_keys,
        COALESCE(SUM(usage_count), 0) as total_usage
      FROM api_keys 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    const row = result.rows[0];

    return {
      totalKeys: parseInt(row.total_keys),
      activeKeys: parseInt(row.active_keys),
      expiredKeys: parseInt(row.expired_keys),
      totalUsage: parseInt(row.total_usage),
    };
  }
}

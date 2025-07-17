import { supabaseAdmin } from "../config/supabase";
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
      const { data, error } = await supabaseAdmin
        .from("api_keys")
        .insert({
          user_id: userId,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions,
          expires_at: expiresAt || null,
        })
        .select(
          "id, user_id, name, key_prefix, permissions, expires_at, created_at"
        )
        .single();

      if (error) {
        // Handle unique constraint violations
        if (error.code === "23505") {
          throw new Error("An API key with this name already exists");
        }
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        key, // Return the plain text key only once
        keyPrefix: data.key_prefix,
        permissions: data.permissions,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      };
    } catch (error: any) {
      console.error("Error creating API key:", error);
      throw error;
    }
  }

  /**
   * Get all API keys for a user (without sensitive data)
   */
  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const { data, error } = await supabaseAdmin
      .from("api_keys_view")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((row) => ({
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
    const { data, error } = await supabaseAdmin
      .from("api_keys_view")
      .select("*")
      .eq("id", keyId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      keyHash: "", // Never return the hash
      keyPrefix: data.key_prefix,
      permissions: data.permissions,
      isActive: data.is_active,
      lastUsedAt: data.last_used_at,
      usageCount: data.usage_count,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isExpired: data.is_expired,
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

    // Build update object with only defined fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (expiresAt !== undefined) updateData.expires_at = expiresAt;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("api_keys")
        .update(updateData)
        .eq("id", keyId)
        .eq("user_id", userId)
        .select("id")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        if (error.code === "23505") {
          throw new Error("An API key with this name already exists");
        }
        throw error;
      }

      return await this.getApiKeyById(keyId, userId);
    } catch (error: any) {
      console.error("Error updating API key:", error);
      throw error;
    }
  }

  /**
   * Delete an API key
   */
  static async deleteApiKey(keyId: number, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from("api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return true;
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
      const { data, error } = await supabaseAdmin
        .from("api_keys")
        .select("id, user_id, key_hash, permissions, is_active, expires_at")
        .eq("key_prefix", keyPrefix)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching API keys:", error);
        return { isValid: false };
      }

      // Check all keys with this prefix (should be very few)
      for (const row of data || []) {
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
    try {
      // First get the current usage count
      const { data, error: fetchError } = await supabaseAdmin
        .from("api_keys")
        .select("usage_count")
        .eq("id", keyId)
        .single();

      if (fetchError) {
        console.error("Error fetching usage count:", fetchError);
        return;
      }

      // Update with incremented count
      const { error: updateError } = await supabaseAdmin
        .from("api_keys")
        .update({
          usage_count: (data.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", keyId);

      if (updateError) {
        console.error("Error updating key usage:", updateError);
        return;
      }
    } catch (error) {
      console.error("Error updating key usage:", error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Clean up expired API keys
   */
  static async cleanupExpiredKeys(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin.rpc(
        "cleanup_expired_api_keys"
      );

      if (error) {
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error("Error cleaning up expired keys:", error);
      // Fallback to manual cleanup
      const { error: deleteError } = await supabaseAdmin
        .from("api_keys")
        .delete()
        .not("expires_at", "is", null)
        .lt("expires_at", new Date().toISOString());

      if (deleteError) {
        throw deleteError;
      }

      return 0; // Can't get exact count with fallback method
    }
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
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("is_active, expires_at, usage_count")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    const now = new Date();
    let totalKeys = 0;
    let activeKeys = 0;
    let expiredKeys = 0;
    let totalUsage = 0;

    for (const key of data || []) {
      totalKeys++;
      totalUsage += key.usage_count || 0;

      const isExpired = key.expires_at && new Date(key.expires_at) < now;

      if (isExpired) {
        expiredKeys++;
      } else if (key.is_active) {
        activeKeys++;
      }
    }

    return {
      totalKeys,
      activeKeys,
      expiredKeys,
      totalUsage,
    };
  }
}

import { Request, Response } from "express";
import { ApiKeyService } from "../services/apiKeyService";
import {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ApiKeyPermission,
} from "../types";

export const createApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get userId from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, permissions, expiresAt }: CreateApiKeyRequest = req.body;

    // Validate required fields
    if (!name || !permissions || !Array.isArray(permissions)) {
      res.status(400).json({ error: "Name and permissions are required" });
      return;
    }

    // Validate name length
    if (name.trim().length < 1 || name.trim().length > 255) {
      res
        .status(400)
        .json({ error: "Name must be between 1 and 255 characters" });
      return;
    }

    // Validate permissions array
    if (permissions.length === 0) {
      res.status(400).json({ error: "At least one permission is required" });
      return;
    }

    // Validate expiration date if provided
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      res.status(400).json({ error: "Expiration date must be in the future" });
      return;
    }

    // Create the API key
    const apiKey = await ApiKeyService.createApiKey(userId, {
      name: name.trim(),
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json(apiKey);
  } catch (error: any) {
    console.error("Error creating API key:", error);

    if (error.message === "An API key with this name already exists") {
      res.status(409).json({ error: error.message });
      return;
    }

    if (error.message === "Invalid permissions provided") {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to create API key" });
  }
};

export const getApiKeys = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const apiKeys = await ApiKeyService.getUserApiKeys(userId);
    res.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
};

export const getApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const keyId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (isNaN(keyId)) {
      res.status(400).json({ error: "Invalid API key ID" });
      return;
    }

    const apiKey = await ApiKeyService.getApiKeyById(keyId, userId);

    if (!apiKey) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    res.json(apiKey);
  } catch (error) {
    console.error("Error fetching API key:", error);
    res.status(500).json({ error: "Failed to fetch API key" });
  }
};

export const updateApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const keyId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (isNaN(keyId)) {
      res.status(400).json({ error: "Invalid API key ID" });
      return;
    }

    const { name, permissions, isActive, expiresAt }: UpdateApiKeyRequest =
      req.body;

    // Validate name length if provided
    if (
      name !== undefined &&
      (name.trim().length < 1 || name.trim().length > 255)
    ) {
      res
        .status(400)
        .json({ error: "Name must be between 1 and 255 characters" });
      return;
    }

    // Validate permissions array if provided
    if (
      permissions !== undefined &&
      (!Array.isArray(permissions) || permissions.length === 0)
    ) {
      res.status(400).json({ error: "Permissions must be a non-empty array" });
      return;
    }

    // Validate expiration date if provided
    if (
      expiresAt !== undefined &&
      expiresAt !== null &&
      new Date(expiresAt) <= new Date()
    ) {
      res.status(400).json({ error: "Expiration date must be in the future" });
      return;
    }

    const updateData: UpdateApiKeyRequest = {};
    if (name !== undefined) updateData.name = name.trim();
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined)
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : undefined;

    const apiKey = await ApiKeyService.updateApiKey(keyId, userId, updateData);

    if (!apiKey) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    res.json(apiKey);
  } catch (error: any) {
    console.error("Error updating API key:", error);

    if (error.message === "An API key with this name already exists") {
      res.status(409).json({ error: error.message });
      return;
    }

    if (error.message === "Invalid permissions provided") {
      res.status(400).json({ error: error.message });
      return;
    }

    if (error.message === "No fields to update") {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to update API key" });
  }
};

export const deleteApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const keyId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (isNaN(keyId)) {
      res.status(400).json({ error: "Invalid API key ID" });
      return;
    }

    const deleted = await ApiKeyService.deleteApiKey(keyId, userId);

    if (!deleted) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({ error: "Failed to delete API key" });
  }
};

export const getApiKeyStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const stats = await ApiKeyService.getUserKeyStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching API key stats:", error);
    res.status(500).json({ error: "Failed to fetch API key stats" });
  }
};

export const cleanupExpiredKeys = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // This endpoint might be restricted to admin users in the future
    const deletedCount = await ApiKeyService.cleanupExpiredKeys();
    res.json({
      message: `Cleaned up ${deletedCount} expired API keys`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up expired keys:", error);
    res.status(500).json({ error: "Failed to cleanup expired keys" });
  }
};

export const getApiKeyPermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Return available permissions for frontend to use
    const permissions = Object.values(ApiKeyPermission).map((permission) => ({
      value: permission,
      label: permission.charAt(0).toUpperCase() + permission.slice(1),
      description: getPermissionDescription(permission),
    }));

    res.json({ permissions });
  } catch (error) {
    console.error("Error fetching API key permissions:", error);
    res.status(500).json({ error: "Failed to fetch API key permissions" });
  }
};

function getPermissionDescription(permission: ApiKeyPermission): string {
  switch (permission) {
    case ApiKeyPermission.READ:
      return "View and search memos";
    case ApiKeyPermission.WRITE:
      return "Create, update, and delete memos";
    case ApiKeyPermission.ADMIN:
      return "Full access to all operations";
    default:
      return "Unknown permission";
  }
}

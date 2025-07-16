import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { ApiKeyService } from "../services/apiKeyService";
import { ApiKeyPermission } from "../types";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        name?: string;
        phone?: string;
        emailVerified: boolean;
        createdAt: string;
        lastSignInAt?: string;
      };
      apiKey?: {
        id: number;
        userId: string;
        permissions: ApiKeyPermission[];
        authMethod: "jwt" | "api_key";
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Authorization header missing" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "Token missing" });
      return;
    }

    // Try API key authentication first
    if (token.startsWith("memos_")) {
      const authResult = await ApiKeyService.authenticateApiKey(token);

      if (!authResult.isValid) {
        res.status(401).json({ error: "Invalid or expired API key" });
        return;
      }

      // Set user information based on API key
      req.user = {
        id: authResult.userId!,
        email: undefined,
        name: undefined,
        phone: undefined,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastSignInAt: new Date().toISOString(),
      };

      // Set API key information
      req.apiKey = {
        id: authResult.keyId!,
        userId: authResult.userId!,
        permissions: authResult.permissions!,
        authMethod: "api_key",
      };

      next();
      return;
    }

    // Try JWT authentication
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Add user information to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      phone: user.phone,
      emailVerified: !!user.email_confirmed_at,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    };

    // Set auth method for JWT
    req.apiKey = {
      id: 0,
      userId: user.id,
      permissions: [
        ApiKeyPermission.READ,
        ApiKeyPermission.WRITE,
        ApiKeyPermission.ADMIN,
      ],
      authMethod: "jwt",
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Optional auth middleware for endpoints that work with or without auth
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No auth header, continue without user
      next();
      return;
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      // No token, continue without user
      next();
      return;
    }

    // Try API key authentication first
    if (token.startsWith("memos_")) {
      const authResult = await ApiKeyService.authenticateApiKey(token);

      if (authResult.isValid) {
        // Set user information based on API key
        req.user = {
          id: authResult.userId!,
          email: undefined,
          name: undefined,
          phone: undefined,
          emailVerified: false,
          createdAt: new Date().toISOString(),
          lastSignInAt: new Date().toISOString(),
        };

        // Set API key information
        req.apiKey = {
          id: authResult.keyId!,
          userId: authResult.userId!,
          permissions: authResult.permissions!,
          authMethod: "api_key",
        };
      }

      next();
      return;
    }

    // Try JWT authentication
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      // Valid token, add user to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name,
        phone: user.phone,
        emailVerified: !!user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      };

      // Set auth method for JWT
      req.apiKey = {
        id: 0,
        userId: user.id,
        permissions: [
          ApiKeyPermission.READ,
          ApiKeyPermission.WRITE,
          ApiKeyPermission.ADMIN,
        ],
        authMethod: "jwt",
      };
    }

    next();
  } catch (error) {
    // If there's an error, just continue without user
    next();
  }
};

// Permission checking middleware
export const requirePermission = (permission: ApiKeyPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!req.apiKey.permissions.includes(permission)) {
      res.status(403).json({
        error: `Insufficient permissions. Required: ${permission}`,
      });
      return;
    }

    next();
  };
};

// Convenience middleware for common permission checks
export const requireRead = requirePermission(ApiKeyPermission.READ);
export const requireWrite = requirePermission(ApiKeyPermission.WRITE);
export const requireAdmin = requirePermission(ApiKeyPermission.ADMIN);

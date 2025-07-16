import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

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
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Authorization header missing" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "JWT token missing" });
      return;
    }

    // Verify token with Supabase
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

    // Try to verify token
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
    }

    next();
  } catch (error) {
    // If there's an error, just continue without user
    next();
  }
};

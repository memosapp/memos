import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
// Use existing SUPABASE_KEY as the anon key
const supabaseAnonKey = process.env.SUPABASE_KEY;
// For now, use the same key for service operations (you can add a separate service key later)
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not set");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_KEY is not set");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_KEY is not set");
}

// Create client for user operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client for service operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database configuration (for direct queries if needed)
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
  dbUrl: process.env.SUPABASE_DB_URL,
};

console.log("✅ Supabase client initialized successfully");

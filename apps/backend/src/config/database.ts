import { Pool } from "pg";
import dotenv from "dotenv";
import { initializeDynamicTypeParsers } from "./types";

// Load environment variables
dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "memos_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// PostgreSQL database connection disabled - migrated to Supabase
// Initialize PostgreSQL type parsers on startup
// initializeDynamicTypeParsers(pool).catch((error) => {
//   console.error("Failed to initialize PostgreSQL type parsers:", error);
// });

// Graceful shutdown handler
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve) => {
    pool.end(() => {
      console.log("Database connection closed");
      resolve();
    });
  });
};

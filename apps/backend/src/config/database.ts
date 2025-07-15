import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "memos_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// Graceful shutdown handler
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve) => {
    pool.end(() => {
      console.log("Database connection closed");
      resolve();
    });
  });
};

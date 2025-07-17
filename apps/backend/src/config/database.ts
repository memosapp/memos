// Minimal database compatibility layer for legacy services using direct SQL
// This provides the same interface as the old PostgreSQL pool but uses Supabase
import { supabaseAdmin } from "./supabase";

interface QueryResult {
  rows: any[];
  rowCount: number | null;
}

// Compatibility interface for legacy pool.query() usage
export const pool = {
  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Execute raw SQL via Supabase
      const { data, error } = await supabaseAdmin.rpc("execute_sql", {
        sql_query: sql,
        params: params,
      });

      if (error) {
        throw error;
      }

      return {
        rows: data || [],
        rowCount: data ? data.length : 0,
      };
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  },
};

// Graceful shutdown handler (compatibility)
export const closeDatabase = (): Promise<void> => {
  return Promise.resolve();
};

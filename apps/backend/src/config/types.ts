import { types } from "pg";
import { parse as parseArray } from "postgres-array";
import { ApiKeyPermission } from "../types";

/**
 * PostgreSQL Type Parser Configuration
 *
 * This module configures type parsers for PostgreSQL custom types to ensure
 * proper conversion from PostgreSQL's string representations to JavaScript objects.
 *
 * Root Cause: PostgreSQL returns arrays as string representations (e.g., '{read,admin,write}')
 * by default. The pg driver doesn't parse these unless custom type parsers are configured.
 */

// Known OIDs for our custom types
// These are determined by querying: SELECT typname, oid, typarray FROM pg_type WHERE typname LIKE '%api_key_permission%'
const API_KEY_PERMISSION_ARRAY_OID = 16747 as any; // _api_key_permission_enum

/**
 * Parse PostgreSQL enum array into typed JavaScript array
 */
function parseApiKeyPermissionArray(value: string): ApiKeyPermission[] {
  if (!value) return [];

  // Use postgres-array parser for robust array parsing
  const parsed = parseArray(value);

  // Type-cast to our enum type
  return parsed.map((item) => item as ApiKeyPermission);
}

/**
 * Initialize PostgreSQL type parsers
 *
 * This function sets up custom type parsers for our enum array types.
 * It should be called once during application startup.
 */
export function initializeTypesParsers(): void {
  console.log("Initializing PostgreSQL type parsers...");

  // Set up parser for api_key_permission_enum arrays
  types.setTypeParser(API_KEY_PERMISSION_ARRAY_OID, parseApiKeyPermissionArray);

  console.log("PostgreSQL type parsers initialized successfully");
}

/**
 * Get the OID for a PostgreSQL type by name
 *
 * This is a helper function for dynamic OID resolution if needed.
 * Currently unused but useful for debugging.
 */
export async function getTypeOID(
  pool: any,
  typeName: string
): Promise<number | null> {
  try {
    const result = await pool.query(
      "SELECT oid FROM pg_type WHERE typname = $1",
      [typeName]
    );

    if (result.rows.length > 0) {
      return result.rows[0].oid;
    }

    return null;
  } catch (error) {
    console.error(`Error getting OID for type ${typeName}:`, error);
    return null;
  }
}

/**
 * Dynamic type parser initialization
 *
 * This function queries the database to get the current OIDs for our custom types
 * and sets up type parsers accordingly. This is more robust than hardcoding OIDs
 * but requires a database query on startup.
 */
export async function initializeDynamicTypeParsers(pool: any): Promise<void> {
  console.log("Initializing dynamic PostgreSQL type parsers...");

  try {
    // Get the OID for our enum array type
    const result = await pool.query(`
      SELECT oid 
      FROM pg_type 
      WHERE typname = '_api_key_permission_enum'
    `);

    if (result.rows.length > 0) {
      const arrayOID = result.rows[0].oid;

      // Set up parser for the array type
      types.setTypeParser(arrayOID, parseApiKeyPermissionArray);

      console.log(`Dynamic type parser set up for array OID: ${arrayOID}`);
    } else {
      console.warn("Could not find _api_key_permission_enum type in database");
    }
  } catch (error) {
    console.error("Error setting up dynamic type parsers:", error);
    // Fall back to static OIDs if dynamic resolution fails
    initializeTypesParsers();
  }
}

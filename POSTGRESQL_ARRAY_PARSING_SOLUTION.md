# PostgreSQL Array Parsing Solution

## Root Cause Analysis

### Problem

PostgreSQL returns arrays as string representations (e.g., `{read,admin,write}`) instead of JavaScript arrays (`["read", "admin", "write"]`). This caused frontend JavaScript code to fail when trying to use array methods like `.map()` on these string values.

### Root Cause Deep Dive

**1. PostgreSQL Behavior**

- PostgreSQL natively stores arrays and returns them as text representations
- Example: `{read,admin,write}` for enum arrays
- This is the expected behavior from PostgreSQL server

**2. Driver Layer (node-postgres)**

- The `pg` driver receives these string representations from PostgreSQL
- By default, it doesn't parse them into JavaScript arrays
- The driver provides a type parsing system to handle custom conversions

**3. Application Layer**

- Our application expected JavaScript arrays but received strings
- Frontend code calling `permissions.map()` failed with "is not a function"

### Technical Details

#### OID (Object Identifier) System

PostgreSQL uses OIDs to identify data types:

- `api_key_permission_enum` → OID 16748 (our enum type)
- `_api_key_permission_enum` → OID 16747 (array version of our enum)

#### Driver Type Parsing

The `pg` driver supports custom type parsers via:

```javascript
const { types } = require("pg");
types.setTypeParser(OID, parserFunction);
```

## Solution Implementation

### 1. Installed Dependencies

```bash
pnpm add postgres-array
```

### 2. Created Type Parser Configuration (`src/config/types.ts`)

```typescript
import { types } from "pg";
import { parse as parseArray } from "postgres-array";
import { ApiKeyPermission } from "../types";

// Dynamic OID resolution
export async function initializeDynamicTypeParsers(pool: any): Promise<void> {
  const result = await pool.query(`
    SELECT oid 
    FROM pg_type 
    WHERE typname = '_api_key_permission_enum'
  `);

  if (result.rows.length > 0) {
    const arrayOID = result.rows[0].oid;
    types.setTypeParser(arrayOID, parseApiKeyPermissionArray);
  }
}

function parseApiKeyPermissionArray(value: string): ApiKeyPermission[] {
  if (!value) return [];
  const parsed = parseArray(value);
  return parsed.map((item) => item as ApiKeyPermission);
}
```

### 3. Integrated with Database Configuration

```typescript
// src/config/database.ts
import { initializeDynamicTypeParsers } from "./types";

export const pool = new Pool({...});

// Initialize type parsers on startup
initializeDynamicTypeParsers(pool).catch((error) => {
  console.error("Failed to initialize PostgreSQL type parsers:", error);
});
```

### 4. Simplified Service Layer

Removed manual parsing code from `ApiKeyService`:

```typescript
// Before (manual parsing)
permissions: parsePostgresArray(row.permissions);

// After (automatic parsing)
permissions: row.permissions;
```

## Benefits of This Solution

### 1. **Automatic & Transparent**

- Arrays are automatically parsed at the driver level
- No need for manual parsing in service layer
- Consistent behavior across all database queries

### 2. **Type-Safe**

- Leverages PostgreSQL's OID system for accurate type identification
- Handles only the specific array types we need
- Preserves TypeScript type safety

### 3. **Robust & Maintainable**

- Uses the battle-tested `postgres-array` library
- Dynamic OID resolution prevents hardcoded values
- Graceful fallback handling

### 4. **Performance**

- Parsing happens once at the driver level
- No repeated parsing in application code
- Minimal overhead

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   pg Driver     │    │   Application   │
│     Server      │    │  (with parsers) │    │     Code        │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Returns:        │───▶│ Converts:       │───▶│ Receives:       │
│ "{read,write}"  │    │ String → Array  │    │ ["read","write"]│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Testing the Solution

### Before Fix

```javascript
// API Response
{
  "permissions": "{read,admin,write}"  // String
}

// Frontend Code
permissions.map(p => p) // ❌ Error: map is not a function
```

### After Fix

```javascript
// API Response
{
  "permissions": ["read", "admin", "write"]  // Array
}

// Frontend Code
permissions.map(p => p) // ✅ Works correctly
```

## Monitoring & Logs

The solution includes logging for monitoring:

```
Initializing dynamic PostgreSQL type parsers...
Dynamic type parser set up for array OID: 16747
```

## Alternative Solutions Considered

### 1. Manual Parsing (Previous Approach)

- ❌ Required parsing in every service method
- ❌ Easy to miss or forget
- ❌ Inconsistent across the codebase

### 2. Frontend Parsing

- ❌ Moves the problem to the frontend
- ❌ Violates API contract expectations
- ❌ Multiple frontend consumers would need fixes

### 3. View-Based Solutions

- ❌ Would require database views for every array column
- ❌ Loses type information
- ❌ More complex SQL management

## Future Considerations

### Adding New Enum Arrays

When adding new enum array types:

1. Add the type to `src/config/types.ts`
2. Create a parser function
3. Register it in `initializeDynamicTypeParsers`

### Database Migration Impact

- OIDs can change between database recreations
- Dynamic OID resolution handles this automatically
- No code changes needed for OID changes

## Best Practices

1. **Always use dynamic OID resolution** - don't hardcode OIDs
2. **Test with fresh databases** - ensure OID changes don't break parsing
3. **Monitor initialization logs** - verify parsers are set up correctly
4. **Handle edge cases** - empty arrays, null values, etc.

## Troubleshooting

### Common Issues

**Type Parser Not Working**

- Check logs for "Dynamic type parser set up for array OID: XXXX"
- Verify database connection before parser initialization
- Ensure correct type name in query

**OID Changes**

- Recreating the database can change OIDs
- Dynamic resolution handles this automatically
- Check logs for new OID values

**Multiple Database Instances**

- Each database instance may have different OIDs
- Dynamic resolution works per connection
- Ensure parser initialization runs for each connection

## Conclusion

This solution provides a robust, transparent, and maintainable way to handle PostgreSQL array parsing. By leveraging the driver's built-in type parsing system, we've eliminated the need for manual parsing while ensuring type safety and performance.

The implementation is future-proof and handles the root cause at the appropriate layer (driver level) rather than working around it in the application layer.

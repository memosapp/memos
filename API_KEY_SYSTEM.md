# API Key System Documentation

## Overview

The Memos project now supports API key authentication for the MCP (Model Context Protocol) server. This allows users to securely authenticate with the MCP server without requiring interactive login sessions.

## Architecture

### Security Design

- **Secure Generation**: API keys are generated using `crypto.randomBytes()` for cryptographic security
- **Hash Storage**: Only bcrypt-hashed versions of API keys are stored in the database (never plaintext)
- **One-time Display**: API keys are shown only once during creation
- **Prefix Identification**: First 16 characters are stored separately for identification
- **Expiration Support**: Optional expiration dates for time-limited access
- **Permission-based Access**: Granular permissions (read, write, admin)

### Database Schema

```sql
-- API keys table
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    permissions api_key_permission_enum[] NOT NULL DEFAULT '{read}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Usage Guide

### 1. Creating API Keys

#### Via Settings UI

1. Navigate to **Settings** → **API Key Management**
2. Click **Create API Key**
3. Fill in the form:
   - **Name**: Descriptive name for the key (e.g., "MCP Production Key")
   - **Permissions**: Select from read, write, admin
   - **Expiration**: Optional expiration date
4. Click **Create API Key**
5. **Important**: Copy the generated key immediately - it won't be shown again!

#### Via API

```bash
curl -X POST http://localhost:3001/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{
    "name": "MCP Production Key",
    "permissions": ["read", "write"],
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

### 2. Using API Keys

#### With MCP Server

```bash
# Use the API key in Authorization header
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer memos_1234567890abcdef..." \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "memorize",
      "arguments": {
        "content": "This is a test memo",
        "authorRole": "user"
      }
    },
    "id": 1
  }'
```

#### With Backend API

```bash
# Use the API key for any backend endpoint
curl -X GET http://localhost:3001/memos \
  -H "Authorization: Bearer memos_1234567890abcdef..."
```

### 3. Managing API Keys

#### List All Keys

```bash
curl -X GET http://localhost:3001/api-keys \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

#### Update Key

```bash
curl -X PUT http://localhost:3001/api-keys/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{
    "name": "Updated Key Name",
    "permissions": ["read", "write", "admin"],
    "isActive": false
  }'
```

#### Delete Key

```bash
curl -X DELETE http://localhost:3001/api-keys/1 \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

## Permission System

### Available Permissions

- **read**: View and search memos
- **write**: Create, update, and delete memos
- **admin**: Full access to all operations

### Permission Inheritance

- **admin** permission includes all other permissions
- **write** permission includes **read** permission
- Permissions are checked at the middleware level

### MCP Server Permissions

- **memorize** tool: Requires **write** permission
- **find-memories** tool: Requires **read** permission
- All MCP endpoints: Minimum **read** permission required

## Security Best Practices

### For Users

1. **Store Securely**: Never commit API keys to version control
2. **Use Environment Variables**: Store keys in environment variables
3. **Principle of Least Privilege**: Only grant necessary permissions
4. **Rotate Regularly**: Create new keys and delete old ones periodically
5. **Monitor Usage**: Check the usage statistics in the UI
6. **Set Expiration**: Use expiration dates for temporary access

### For Developers

1. **Rate Limiting**: Implement rate limiting for API key requests
2. **Audit Logging**: Log all API key usage for security monitoring
3. **HTTPS Only**: Never transmit API keys over unencrypted connections
4. **Secure Headers**: Always use Authorization header, never URL parameters

## API Endpoints

### API Key Management

- `POST /api-keys` - Create new API key
- `GET /api-keys` - List user's API keys
- `GET /api-keys/:id` - Get specific API key
- `PUT /api-keys/:id` - Update API key
- `DELETE /api-keys/:id` - Delete API key
- `GET /api-keys/stats` - Get usage statistics
- `GET /api-keys/permissions` - Get available permissions

### Authentication

- All backend endpoints accept API keys via `Authorization: Bearer <key>`
- MCP server requires API key authentication for all operations
- API keys are validated against the backend authentication system

## Implementation Details

### Backend Components

1. **ApiKeyService** (`src/services/apiKeyService.ts`)

   - Handles key generation, validation, and management
   - Implements bcrypt hashing for secure storage
   - Provides cleanup functions for expired keys

2. **Authentication Middleware** (`src/middleware/auth.ts`)

   - Extended to support both JWT and API key authentication
   - Permission checking middleware
   - User context injection

3. **API Key Controller** (`src/controllers/apiKeyController.ts`)
   - CRUD operations for API keys
   - Input validation and error handling
   - Statistics and cleanup endpoints

### Frontend Components

1. **Settings UI** (`apps/frontend/app/settings/page.tsx`)

   - Complete API key management interface
   - Key creation, editing, and deletion
   - Usage statistics display
   - Security warnings and best practices

2. **API Client** (`apps/frontend/lib/api.ts`)
   - API key management functions
   - Type-safe interfaces
   - Error handling

### MCP Server

1. **Authentication Middleware**

   - Validates API keys against backend
   - Injects user context into requests
   - Permission-based access control

2. **Tool Updates**
   - `memorize` and `find-memories` tools use authenticated user context
   - No longer require `userId` parameter
   - Automatic user association

## Troubleshooting

### Common Issues

1. **Invalid API Key Error**

   - Check if key is active and not expired
   - Verify correct format: `memos_<64-character-hex>`
   - Ensure proper Authorization header format

2. **Permission Denied**

   - Check if API key has required permissions
   - Verify the operation requires the correct permission level
   - Admin permission may be required for certain operations

3. **Key Not Found**
   - API key may have been deleted
   - Check if key has expired
   - Verify you're using the correct API key

### Database Maintenance

```sql
-- Clean up expired API keys
SELECT cleanup_expired_api_keys();

-- View API key statistics
SELECT * FROM api_keys_view WHERE user_id = 'your-user-id';

-- Disable all keys for a user
UPDATE api_keys SET is_active = false WHERE user_id = 'user-id';
```

## Migration Guide

### From Previous Authentication

If you were previously using the MCP server without API keys:

1. Create an API key in the settings UI
2. Update your MCP client configuration to use the API key
3. Remove any hardcoded user IDs from your MCP tool calls

### Database Migration

Run the database migration to add the API keys table:

```sql
-- Apply the migration
\i migrations/001_create_api_keys_table.sql

-- Or if using the combined schema
\i database.sql
```

## Future Enhancements

1. **Rate Limiting**: Implement per-key rate limiting
2. **Webhook Support**: API key events and notifications
3. **Team Management**: Shared API keys for organizations
4. **Audit Trails**: Detailed logging of API key usage
5. **Key Rotation**: Automatic key rotation policies

## Support

For issues or questions about the API key system:

1. Check the troubleshooting section above
2. Review the server logs for authentication errors
3. Verify your API key permissions and status
4. Test with a new API key to isolate issues

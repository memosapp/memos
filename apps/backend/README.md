# Memos Backend

A Node.js backend for the Memos project - an application for storing and managing chat history with powerful hybrid search capabilities.

## Features

- **RESTful API** for memo management
- **PostgreSQL** database with pgvector extension for vector search
- **Google Gemini AI** integration for text embeddings
- **Hybrid search** combining keyword and semantic search
- **TypeScript** for type safety
- **Express.js** framework with proper middleware

## Tech Stack

- **Framework**: Express.js
- **Database**: PostgreSQL with pgvector extension
- **Embedding Service**: Google Gemini AI (using @google/genai SDK)
- **Language**: TypeScript
- **Dependencies**: `express`, `cors`, `pg`, `@google/genai`, `dotenv`

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Supabase Project** with pgvector extension enabled
3. **Google Gemini API key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:

   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Set up the database:**

   ```bash
   # Apply migrations to your Supabase project
   npx supabase db push
   ```

## Development

Start the development server:

```bash
pnpm run dev
```

Build for production:

```bash
pnpm run build
```

Start production server:

```bash
pnpm start
```

## API Endpoints

### Create Memo

```http
POST /memo
Content-Type: application/json

{
  "sessionId": "session_123",
  "userId": "user_456",
  "content": "This is a memo content",
  "summary": "Optional summary",
  "authorRole": "user",
  "importance": 1.0,
  "tags": ["tag1", "tag2"]
}
```

### Get All Memos

```http
GET /memos?userId=user_456&sessionId=session_123&limit=10&offset=0
```

### Get Single Memo

```http
GET /memo/123
```

### Update Memo

```http
PATCH /memo/123
Content-Type: application/json

{
  "content": "Updated content",
  "summary": "Updated summary"
}
```

### Delete Memo

```http
DELETE /memo/123
```

### Search Memos

```http
POST /search
Content-Type: application/json

{
  "query": "search text",
  "userId": "user_456",
  "sessionId": "session_123",
  "limit": 10
}
```

## Database Schema

The database uses PostgreSQL with the pgvector extension. The main `memos` table stores:

- **id**: Primary key
- **session_id**: Chat session identifier
- **user_id**: User identifier
- **content**: Memo content
- **summary**: Optional summary
- **author_role**: Role (user/agent/system)
- **importance**: Importance score (1.0 default)
- **access_count**: Number of times accessed
- **tags**: Array of tags
- **embedding**: 768-dimensional vector from Gemini AI
- **created_at**: Creation timestamp
- **updated_at**: Update timestamp

## Error Handling

The API includes comprehensive error handling:

- Validation errors (400)
- Not found errors (404)
- Database errors (500)
- AI service errors (500)

## Search Capabilities

The backend supports hybrid search combining:

1. **Keyword search**: Full-text search on content and summary
2. **Semantic search**: Vector similarity using Gemini embeddings
3. **Filters**: By user, session, tags, and importance

## Security Notes

- All database queries use parameterized statements
- Input validation on all endpoints
- CORS configured for cross-origin requests
- Environment variables for sensitive data

## Contributing

1. Follow TypeScript best practices
2. Use proper error handling
3. Add tests for new features
4. Update documentation

# Memos - Project Overview

## Project Background

**Memos** is a modern chat history storage and management system with AI-powered semantic search capabilities. The project is designed to store, organize, and intelligently retrieve conversational data across multiple sessions and users.

### Key Features

- **Persistent Memory**: Store chat messages with rich metadata (sessions, users, roles, importance, tags)
- **AI-Powered Search**: Hybrid search combining keyword matching and semantic similarity using embeddings
- **Multi-User Support**: Handle multiple users and conversation sessions
- **Vector Similarity**: Leverage PostgreSQL with pgvector for efficient semantic search
- **RESTful API**: Clean API design for easy integration with various frontends

### Technology Stack

- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL + pgvector
- **AI Integration**: Google Gemini AI for text embeddings
- **Frontend**: React.js (planned)
- **MCP**: Model Context Protocol server for AI tool integration
- **Database**: PostgreSQL with vector extensions for semantic search
- **Deployment**: Docker containerization

---

## Architecture Overview

This is a **monorepo** organized into three main applications:

```
memos/
├── apps/
│   ├── backend/     # Node.js API server
│   ├── frontend/    # React.js web application
│   └── mcp/         # Model Context Protocol server
├── packages/
│   └── shared/      # Shared utilities and types
└── package.json     # Workspace configuration
```

---

## Backend Architecture (`apps/backend/`)

### Purpose

The backend is a **Node.js REST API** that provides memo storage, retrieval, and intelligent search capabilities. It integrates with Google Gemini AI for generating embeddings and uses PostgreSQL with pgvector for vector similarity search.

### Architecture Pattern

**Layered Architecture** following Express.js best practices:

```
src/
├── server.ts              # Application entry point
├── app.ts                 # Express app configuration
├── config/
│   ├── database.ts        # PostgreSQL connection & pool
│   └── gemini.ts          # Google Gemini AI client
├── types/
│   └── index.ts           # TypeScript interfaces & enums
├── routes/
│   ├── health.ts          # Health check endpoint
│   ├── memos.ts           # Memo CRUD endpoints
│   └── search.ts          # Search endpoint
├── controllers/
│   ├── memoController.ts  # Memo business logic
│   └── searchController.ts # Search business logic
├── services/
│   └── embeddingService.ts # AI embedding generation
└── utils/
    └── tagUtils.ts        # Tag parsing utilities
```

### Key Components

#### **Database Schema**

- **PostgreSQL** with **pgvector** extension for vector operations
- **Memos Table**: Stores content, metadata, and 3072-dimensional embeddings
- **Indexes**: Optimized for text search and session/user queries

#### **AI Integration**

- **Google Gemini AI**: `gemini-embedding-001` model for text embeddings
- **3072-dimensional vectors**: High-quality semantic representations
- **Hybrid Search**: Combines keyword matching (30%) + semantic similarity (70%)

#### **API Endpoints**

- `POST /memo` - Create memo with AI embedding generation
- `GET /memos` - Retrieve memos with filtering
- `GET /memo/:id` - Get specific memo (tracks access count)
- `PATCH /memo/:id` - Update memo (regenerates embedding if content changes)
- `DELETE /memo/:id` - Delete memo
- `POST /search` - Hybrid search with vector similarity
- `GET /health` - Health check

### Development Setup

```bash
cd apps/backend
pnpm install
pnpm run dev  # Development server with auto-reload
```

### Environment Variables

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=memos
DB_USER=memos_user
DB_PASSWORD=memos_password
GEMINI_API_KEY=your_gemini_api_key
```

---

## Frontend Architecture (`apps/frontend/`)

### Purpose

The frontend is a **React.js web application** that provides a user interface for interacting with the memos system. It will offer chat-like interfaces, search capabilities, and memo management features.

### Architecture Pattern (Planned)

**Component-Based Architecture** with modern React patterns:

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── memo/             # Memo-specific components
│   └── search/           # Search interface components
├── pages/
│   ├── Dashboard.tsx     # Main dashboard
│   ├── Search.tsx        # Search interface
│   └── Settings.tsx      # Configuration
├── services/
│   └── api.ts            # Backend API integration
├── hooks/
│   └── useMemos.ts       # Custom React hooks
├── types/
│   └── index.ts          # TypeScript definitions
└── utils/
    └── helpers.ts        # Utility functions
```

### Key Features (Planned)

- **Chat Interface**: Display memos in conversational format
- **Search UI**: Advanced search with filters and sorting
- **Session Management**: Switch between different conversation sessions
- **Real-time Updates**: Live updates when new memos are added
- **Responsive Design**: Mobile-friendly interface

### Technology Stack

- **React.js** with TypeScript
- **State Management**: React Context or Redux Toolkit
- **Styling**: Tailwind CSS or styled-components
- **HTTP Client**: Axios or fetch API
- **Routing**: React Router

---

## MCP Architecture (`apps/mcp/`)

### Purpose

The MCP (Model Context Protocol) server provides a **standardized interface** for AI tools to interact with the memos system. This allows AI assistants to read, write, and search memos programmatically.

### Architecture Pattern

**Protocol Server** implementing the MCP specification:

```
src/
├── index.ts              # MCP server entry point
├── handlers/
│   ├── memoHandlers.ts   # Memo-related MCP tools
│   └── searchHandlers.ts # Search-related MCP tools
├── types/
│   └── mcp.ts            # MCP protocol types
└── utils/
    └── validation.ts     # Input validation
```

### Key Features

- **MCP Tools**: Expose memo operations as standardized tools
- **Tool Discovery**: Allow AI tools to discover available capabilities
- **Validation**: Ensure proper input/output formatting
- **Error Handling**: Graceful error responses in MCP format

### MCP Tools (Planned)

- `create_memo` - Create new memos
- `search_memos` - Search existing memos
- `get_memo` - Retrieve specific memo
- `update_memo` - Update memo content
- `delete_memo` - Remove memo

### Integration

The MCP server acts as a **bridge** between AI tools and the backend API:

```
AI Tool → MCP Server → Backend API → Database
```

---

## Data Flow

### Memo Creation Flow

1. **Frontend/MCP** → `POST /memo` → **Backend**
2. **Backend** → Generate embedding → **Gemini AI**
3. **Backend** → Store memo + embedding → **PostgreSQL**
4. **Backend** → Return created memo → **Frontend/MCP**

### Search Flow

1. **Frontend/MCP** → `POST /search` → **Backend**
2. **Backend** → Generate query embedding → **Gemini AI**
3. **Backend** → Hybrid search (keyword + vector) → **PostgreSQL**
4. **Backend** → Return ranked results → **Frontend/MCP**

---

## Development Workflow

### Prerequisites

- Node.js 18+
- PostgreSQL 16+ with pgvector extension
- Docker (for database setup)
- Google Gemini AI API key

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database
cd apps/backend
docker-compose up -d
npm run setup-db

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start backend
npm run dev

# 5. Start frontend (in separate terminal)
cd ../frontend
npm run dev

# 6. Start MCP server (in separate terminal)
cd ../mcp
npm run dev
```

### Testing

```bash
# Backend API tests
curl -X GET http://localhost:3000/health

# Create memo
curl -X POST http://localhost:3000/memo \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test", "userId": "user", "content": "Hello world", "authorRole": "user"}'

# Search memos
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "hello", "limit": 5}'
```

---

## Deployment Architecture

### Production Setup

- **Backend**: Docker container with Node.js runtime
- **Frontend**: Static build deployed to CDN
- **Database**: Managed PostgreSQL with pgvector extension
- **MCP**: Deployed as standalone service

### Environment Configuration

Each component has environment-specific configurations:

- **Development**: Docker containers with Supabase integration
- **Staging**: Shared Supabase project, production-like setup
- **Production**: Managed Supabase services, optimized for performance

---

## Docker Development Setup

### Prerequisites

- Docker and Docker Compose installed
- Supabase account and project set up

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd memos
   ```

2. **Configure environment variables**

   ```bash
   # Create backend environment file
   cp apps/backend/.env.example apps/backend/.env

   # Add your Supabase credentials:
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your_anon_key_here
   GEMINI_API_KEY=your_gemini_api_key_here  # Optional
   ```

3. **Start all services**

   ```bash
   ./start-dev.sh
   ```

4. **Verify setup**
   ```bash
   ./verify-ports.sh
   ```

### Services

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:3000
- **MCP Server**: http://localhost:3002
- **Database**: Supabase (cloud hosted)

### Available Scripts

- `./start-dev.sh` - Start all services with health checks
- `./stop-dev.sh` - Stop all services
- `./verify-ports.sh` - Check service availability and Supabase connection

### Current Architecture

The project uses Supabase as the primary database and backend service:

- ✅ **Schema**: All tables and functions hosted on Supabase
- ✅ **AI Embeddings**: Uses Google Gemini API (gemini-embedding-001) with 1536 dimensions
- ✅ **Manual Embedding Generation**: Immediate generation during memo operations
- ✅ **RLS Policies**: Row Level Security implemented
- ✅ **Vector Search**: Enhanced hybrid search with semantic similarity thresholds

**Benefits**: Direct control over embedding generation with improved semantic quality.

---

## Future Enhancements

### Short-term

- Complete frontend React application
- Add user authentication and authorization
- Implement real-time notifications
- Add more sophisticated search filters

### Long-term

- Support for multiple AI providers
- Advanced analytics and insights
- Export/import functionality
- Mobile application
- Multi-language support

---

## Contributing

### Code Style

- **TypeScript**: Strict typing enabled
- **ESLint**: Enforced code standards
- **Prettier**: Consistent formatting
- **Conventional Commits**: Standardized commit messages

### Development Guidelines

1. Follow the established architecture patterns
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Ensure proper error handling and logging
5. Maintain backward compatibility when possible

### Getting Help

- Check existing issues and documentation
- Review the API documentation in each component
- Follow the established patterns in the codebase
- Test changes thoroughly before submitting PRs

# 🧠 Memos - Intelligent Chat History Management

A modern, AI-powered chat history storage and management system with semantic search capabilities. Store, organize, and intelligently retrieve conversational data across multiple sessions and users.

## 🚀 Project Overview

**Memos** is a full-stack application designed to revolutionize how we store and retrieve conversational data. By combining traditional keyword search with AI-powered semantic similarity, it provides an intelligent system for managing chat histories, conversations, and memory-based interactions.

### ✨ Key Features

- **🔍 Hybrid Search**: Combines keyword matching (30%) with semantic similarity (70%) for intelligent retrieval
- **🤖 AI-Powered**: Leverages Google Gemini AI for generating high-quality text embeddings
- **👥 Multi-User Support**: Handle multiple users and conversation sessions
- **📊 Vector Database**: PostgreSQL with pgvector for efficient semantic search
- **🔗 MCP Integration**: Model Context Protocol server for AI tool integration
- **⚡ Real-time**: Modern React frontend with real-time updates
- **🐳 Docker Ready**: Containerized deployment for easy setup

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 16+ with pgvector extension
- **AI Service**: Google Gemini AI (gemini-embedding-001)
- **Vector Dimensions**: 3072-dimensional embeddings

### Frontend

- **Framework**: Next.js 15+ with React 19
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React + React Icons

### MCP (Model Context Protocol)

- **SDK**: @modelcontextprotocol/sdk
- **Runtime**: TypeScript with tsx
- **Validation**: Zod for schema validation

### Development Tools

- **Package Manager**: pnpm
- **Build Tool**: TypeScript compiler
- **Development**: Hot-reload with ts-node-dev
- **Containerization**: Docker & Docker Compose

## 📦 Installation and Setup

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Docker and Docker Compose
- Google Gemini AI API key

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd memos
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up the database**

   ```bash
   # Start PostgreSQL with pgvector
   docker-compose up -d postgres

   # Or use the setup script
   ./setup-db.sh
   ```

4. **Configure environment variables**

   ```bash
   # Create backend environment file
   cp apps/backend/.env.example apps/backend/.env

   # Edit the file with your configuration
   nano apps/backend/.env
   ```

   Required environment variables:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=memos_user
   DB_PASSWORD=memos_password
   DB_NAME=memos
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Start the development servers**

   ```bash
   # Terminal 1: Start backend
   cd apps/backend
   pnpm dev

   # Terminal 2: Start frontend
   cd apps/frontend
   pnpm dev

   # Terminal 3: Start MCP server (optional)
   cd apps/mcp
   pnpm dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

## 📁 Folder Structure

```
memos/
├── apps/
│   ├── backend/                 # Node.js REST API
│   │   ├── src/
│   │   │   ├── controllers/     # Business logic
│   │   │   ├── routes/          # API endpoints
│   │   │   ├── services/        # External services (AI)
│   │   │   ├── config/          # Database & AI configuration
│   │   │   ├── types/           # TypeScript definitions
│   │   │   ├── utils/           # Utility functions
│   │   │   ├── app.ts           # Express app setup
│   │   │   └── server.ts        # Entry point
│   │   ├── database.sql         # Database schema
│   │   └── package.json
│   │
│   ├── frontend/                # Next.js React application
│   │   ├── app/                 # Next.js 15 app directory
│   │   │   ├── memories/        # Memory management pages
│   │   │   ├── settings/        # Settings page
│   │   │   └── layout.tsx       # Root layout
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # Radix UI components
│   │   │   ├── shared/          # Shared components
│   │   │   └── dashboard/       # Dashboard components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── store/               # Redux store
│   │   ├── lib/                 # Utility libraries
│   │   └── styles/              # Global styles
│   │
│   └── mcp/                     # Model Context Protocol server
│       ├── src/
│       │   └── index.ts         # MCP server entry point
│       └── package.json
│
├── packages/
│   └── shared/                  # Shared utilities & types
│
├── docker-compose.yml           # Database setup
├── setup-db.sh                 # Database setup script
├── pnpm-workspace.yaml         # Workspace configuration
└── README.md                   # This file
```

## 🏃‍♂️ How to Run and Test

### Development Mode

```bash
# Start all services in development mode
pnpm dev

# Or start individual services
cd apps/backend && pnpm dev    # Backend on port 3000
cd apps/frontend && pnpm dev   # Frontend on port 3000
cd apps/mcp && pnpm dev        # MCP server
```

### Production Build

```bash
# Build all applications
pnpm build

# Or build individual apps
cd apps/backend && pnpm build
cd apps/frontend && pnpm build
cd apps/mcp && pnpm build
```

### Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Create a new memo
curl -X POST http://localhost:3000/memo \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123",
    "userId": "user_456",
    "content": "This is a test memo about machine learning",
    "authorRole": "user",
    "tags": ["test", "ml", "ai"]
  }'

# Search memos
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "limit": 10,
    "sessionId": "session_123"
  }'

# Get all memos
curl http://localhost:3000/memos

# Get specific memo
curl http://localhost:3000/memo/1
```

### Database Management

```bash
# Start database
docker-compose up -d postgres

# Stop database
docker-compose down

# View database logs
docker-compose logs -f postgres

# Access database directly
docker-compose exec postgres psql -U memos_user -d memos
```

## 📖 API Reference

### Base URL

```
http://localhost:3000
```

### Authentication

Currently, the API does not require authentication. This may change in future versions.

### Endpoints

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Create Memo

```http
POST /memo
```

**Request Body:**

```json
{
  "sessionId": "string",
  "userId": "string",
  "content": "string",
  "authorRole": "user" | "agent" | "system",
  "summary": "string (optional)",
  "importance": 1.0,
  "tags": ["string"]
}
```

**Response:**

```json
{
  "id": 1,
  "sessionId": "session_123",
  "userId": "user_456",
  "content": "This is a test memo",
  "authorRole": "user",
  "importance": 1.0,
  "accessCount": 0,
  "tags": ["test"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Memos

```http
GET /memos?sessionId=session_123&userId=user_456&limit=10&offset=0
```

**Query Parameters:**

- `sessionId` (optional): Filter by session
- `userId` (optional): Filter by user
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

#### Get Memo by ID

```http
GET /memo/:id
```

**Response:** Same as Create Memo response

#### Update Memo

```http
PATCH /memo/:id
```

**Request Body:** Same as Create Memo (all fields optional)

#### Delete Memo

```http
DELETE /memo/:id
```

**Response:**

```json
{
  "message": "Memo deleted successfully"
}
```

#### Search Memos

```http
POST /search
```

**Request Body:**

```json
{
  "query": "string",
  "limit": 10,
  "sessionId": "string (optional)",
  "userId": "string (optional)"
}
```

**Response:**

```json
{
  "results": [
    {
      "id": 1,
      "content": "...",
      "similarity": 0.95,
      "relevanceScore": 0.87
    }
  ],
  "total": 1,
  "processingTime": "0.123s"
}
```

## 🤝 Contributing

We welcome contributions to the Memos project! Please follow these guidelines:

### Development Guidelines

1. **Code Style**

   - Use TypeScript with strict type checking
   - Follow ESLint and Prettier configurations
   - Write descriptive commit messages using conventional commits
   - Maintain consistent code formatting

2. **Before Contributing**

   - Check existing issues and pull requests
   - Fork the repository and create a feature branch
   - Ensure all tests pass and linting is clean
   - Update documentation for any API changes

3. **Pull Request Process**
   - Create descriptive pull request titles
   - Include detailed description of changes
   - Reference related issues
   - Ensure CI/CD pipelines pass
   - Request review from maintainers

### Setting Up Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/memos.git
cd memos

# Install dependencies
pnpm install

# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Code Quality Standards

- **Testing**: Write unit tests for new features
- **Documentation**: Update README and inline documentation
- **Error Handling**: Implement proper error handling and logging
- **Performance**: Consider performance implications of changes
- **Security**: Follow security best practices

### Reporting Issues

When reporting bugs or requesting features:

1. Check existing issues first
2. Use the appropriate issue template
3. Provide detailed reproduction steps
4. Include system information and logs
5. Tag issues appropriately

### Architecture Decisions

- Follow the established layered architecture
- Keep components focused and single-purpose
- Maintain clear separation between frontend and backend
- Use TypeScript interfaces for data contracts
- Follow REST API conventions

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for embedding generation
- PostgreSQL and pgvector for vector database capabilities
- The React and Next.js communities for excellent tooling
- All contributors and maintainers

---

For more detailed information, see the [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) file.

**Happy coding! 🚀**

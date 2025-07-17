import express, { Request, Response, NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { z } from "zod";
import cors from "cors";

// Backend API base URL - use environment variable for Docker compatibility
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

// API Key Authentication Interface
interface ApiKeyAuthResult {
  isValid: boolean;
  userId?: string;
  permissions?: string[];
  keyId?: number;
}

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        permissions: string[];
        keyId: number;
      };
    }
  }
}

// Types for API requests
enum AuthorRole {
  USER = "user",
  AGENT = "agent",
  SYSTEM = "system",
}

interface CreateMemoRequest {
  sessionId?: string;
  userId?: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  tags?: string[];
  appName?: string;
}

interface SearchRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  limit?: number;
  // Enhanced search parameters
  tags?: string[];
  authorRole?: AuthorRole;
  minImportance?: number;
  maxImportance?: number;
  sortBy?: "relevance" | "importance" | "recency" | "popularity";
  includePopular?: boolean;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

// API Key Authentication Middleware
const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Authorization header missing",
        },
        id: null,
      });
      return;
    }

    const apiKey = authHeader.replace("Bearer ", "");

    if (!apiKey) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "API key missing",
        },
        id: null,
      });
      return;
    }

    // Validate API key against backend by making a simple authenticated request
    const response = await fetch(`${BACKEND_API_URL}/api-keys/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid or expired API key",
        },
        id: null,
      });
      return;
    }

    // Since the request succeeded, we know the API key is valid
    // For now, we'll set default permissions based on the API key working
    // In a real implementation, we'd extract this from the backend response
    req.user = {
      id: "authenticated-user", // This would come from the backend
      permissions: ["read", "write"], // This would come from the backend
      keyId: 1, // This would come from the backend
    };

    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal server error during authentication",
      },
      id: null,
    });
  }
};

// Permission checking middleware
const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Authentication required",
        },
        id: null,
      });
      return;
    }

    if (
      !req.user.permissions.includes(permission) &&
      !req.user.permissions.includes("admin")
    ) {
      res.status(403).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: `Insufficient permissions. Required: ${permission}`,
        },
        id: null,
      });
      return;
    }

    next();
  };
};

const getServer = (req?: Request) => {
  // Create an MCP server with implementation details
  const server = new McpServer(
    {
      name: "memos-mcp-server",
      version: "1.0.0",
    },
    { capabilities: { logging: {} } }
  );

  // Tool for creating memos
  server.tool(
    "memorize",
    `Create and store a new memo in the Memos system with semantic embedding support.

This tool allows you to capture and persist important information, conversations, insights, or any textual content that should be remembered for future reference. Each memo is automatically processed with semantic embeddings for intelligent search and retrieval.

## When to Use:
- Store important conversation snippets or insights
- Save user preferences or settings
- Capture key decisions or action items
- Record contextual information for future sessions
- Archive meaningful interactions or learnings

## Conversation Storage Guidelines:
Store the full content of the most recent three conversation turns. Summarize all earlier chat history.

## Key Features:
- **Semantic Search**: Content is automatically embedded for intelligent retrieval
- **Flexible Tagging**: Add tags for easy categorization and filtering
- **Importance Scoring**: Rate content importance (0.0-1.0) for prioritization
- **Multi-Author Support**: Track whether content comes from user, agent, or system
- **Session Tracking**: Optional session linking for conversation context
- **Rich Metadata**: Automatic timestamps and access tracking

## Usage Patterns:
- **High Importance (0.8-1.0)**: Critical decisions, key insights, user preferences
- **Medium Importance (0.5-0.7)**: Useful information, context, moderate insights
- **Low Importance (0.1-0.4)**: Casual mentions, temporary notes, minor details

## Response Format:
Returns confirmation with memo ID, content summary, metadata, and timestamp for verification.

## Best Practices:
- Use descriptive summaries to improve searchability
- Tag content by topic/category for better organization
- Set appropriate importance levels for prioritization
- Include session context when relevant for conversation flow`,
    {
      sessionId: z
        .string()
        .optional()
        .describe(
          "Optional session identifier to link this memo to a specific conversation or interaction context. Use consistent session IDs to group related memos together for better context tracking."
        ),
      content: z
        .string()
        .describe(
          "The main textual content of the memo. This is the primary information that will be stored, embedded, and searched. Should be clear, concise, and contain the key information to be remembered. For conversations: store the full content of the most recent three conversation turns and summarize all earlier chat history."
        ),
      summary: z
        .string()
        .optional()
        .describe(
          "Optional brief summary or title for the memo. Helps with quick identification and improves searchability. If not provided, the system will use the content for search purposes."
        ),
      authorRole: z
        .enum(["user", "agent", "system"])
        .describe(
          "Specifies who created this memo: 'user' for human-generated content, 'agent' for AI-generated insights, 'system' for automated entries. Affects search ranking and filtering."
        )
        .default("user"),
      importance: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe(
          "Importance score from 0.0 (low) to 1.0 (high). Higher values get prioritized in search results. Use 0.8-1.0 for critical info, 0.5-0.7 for useful content, 0.1-0.4 for minor details."
        )
        .default(1.0),
      tags: z
        .array(z.string())
        .optional()
        .describe(
          "Array of descriptive tags for categorization and filtering. Use consistent, lowercase tags like ['user-preference', 'meeting-notes', 'bug-report'] for better organization and retrieval."
        ),
      appName: z
        .string()
        .optional()
        .describe(
          "Optional name of the application or context creating this memo. This helps identify the source system or tool that generated the memo for better organization and filtering."
        ),
    },
    async ({
      sessionId,
      content,
      summary,
      authorRole,
      importance,
      tags,
      appName,
    }): Promise<CallToolResult> => {
      try {
        // Get user ID from authenticated request
        const authenticatedUserId = req?.user?.id || "anonymous";

        const memoData: CreateMemoRequest = {
          sessionId,
          userId: authenticatedUserId,
          content,
          summary,
          authorRole: authorRole as AuthorRole,
          importance,
          tags,
          appName,
        };

        const response = await fetch(`${BACKEND_API_URL}/memo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req?.headers.authorization || "",
          },
          body: JSON.stringify(memoData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `Failed to create memo: ${error.error || response.statusText}`
          );
        }

        const createdMemo = await response.json();

        const sessionInfo = createdMemo.sessionId
          ? `Session: ${createdMemo.sessionId}\n`
          : "";

        const appInfo = createdMemo.appName
          ? `App: ${createdMemo.appName}\n`
          : "";

        return {
          content: [
            {
              type: "text",
              text: `Successfully created memo with ID: ${
                createdMemo.id
              }\n\n${sessionInfo}${appInfo}Content: ${
                createdMemo.content
              }\nAuthor: ${createdMemo.authorRole}\nImportance: ${
                createdMemo.importance
              }\nTags: ${
                createdMemo.tags?.join(", ") || "None"
              }\nCreated: ${new Date(createdMemo.createdAt).toLocaleString()}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating memo: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool for searching memos
  server.tool(
    "find-memories",
    `Search and retrieve memos using advanced semantic search with comprehensive filtering and sorting capabilities.

This tool provides intelligent search across all stored memos using a hybrid approach that combines:
- **Keyword Matching (25%)**: Direct text pattern matching in content and summaries
- **Semantic Search (35%)**: AI-powered understanding of meaning and context
- **Tag Matching (15%)**: Exact tag-based filtering and scoring
- **Metadata Scoring (25%)**: Importance, authorship, popularity, and recency factors

## When to Use:
- Find relevant information from past conversations
- Retrieve specific topics or themes
- Locate memos by author, importance, or time period
- Discover related content through semantic similarity
- Filter memories by tags, roles, or other criteria

## Search Strategy:
The search combines multiple signals to rank results:
1. **Relevance (default)**: Balanced mix of all scoring factors
2. **Importance**: Prioritizes high-importance memos first
3. **Recency**: Shows most recent memos first
4. **Popularity**: Ranks by access count and engagement

## Advanced Filtering:
- **Tags**: Filter by specific topics or categories
- **Author Role**: Separate user, agent, or system content
- **Importance Range**: Find high/low priority items
- **Date Range**: Time-based filtering for temporal context
- **Popularity Boost**: Emphasize frequently accessed content

## Response Format:
Returns ranked list with:
- Memo ID, content preview, and summary
- Author, importance score, and access count
- Tags and creation/update timestamps
- Relevance scoring explanation

## Search Examples:
- \`"user preferences"\` - Find user settings and choices
- \`"error handling"\` + tags: ["coding", "bugs"] - Technical issues
- \`"meeting notes"\` + recency sort - Recent discussions
- \`importance: 0.8-1.0\` + "decisions" - Critical choices

## Best Practices:
- Use specific keywords for better precision
- Combine text search with filters for targeted results
- Try different sort orders to find what you need
- Use tags to narrow down broad searches
- Consider author roles to filter by source type`,
    {
      query: z
        .string()
        .describe(
          "Natural language search query to find relevant memos. Can include keywords, phrases, or concepts. The system will match against content, summaries, and tags using both exact matching and semantic understanding."
        ),
      sessionId: z
        .string()
        .optional()
        .describe(
          "Filter results to show only memos from a specific session or conversation context. Useful for finding related memories from a particular interaction or time period."
        ),
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe(
          "Maximum number of search results to return. Lower values (5-10) for quick overviews, higher values (20-50) for comprehensive searches. Default is 10 for optimal performance."
        )
        .default(10),
      // Enhanced search parameters
      tags: z
        .array(z.string())
        .optional()
        .describe(
          "Filter results to include only memos with specific tags. Use an array of tag names to find memos that match any of the specified tags. Example: ['user-preference', 'important']"
        ),
      authorRole: z
        .enum(["user", "agent", "system"])
        .optional()
        .describe(
          "Filter results by who created the memo. 'user' for human-generated content, 'agent' for AI-generated insights, 'system' for automated entries. Helps separate different types of content."
        ),
      minImportance: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe(
          "Minimum importance score threshold (0.0-1.0). Only return memos with importance scores at or above this value. Use 0.8+ for critical information, 0.5+ for useful content."
        ),
      maxImportance: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe(
          "Maximum importance score threshold (0.0-1.0). Only return memos with importance scores at or below this value. Useful for finding lower-priority or casual content."
        ),
      sortBy: z
        .enum(["relevance", "importance", "recency", "popularity"])
        .optional()
        .describe(
          "Sort order for results: 'relevance' (default) combines all factors, 'importance' prioritizes high-value content, 'recency' shows newest first, 'popularity' ranks by access frequency."
        )
        .default("relevance"),
      includePopular: z
        .boolean()
        .optional()
        .describe(
          "When true, adds a popularity boost to relevance scoring based on access count and engagement. Helps surface frequently referenced content even if not perfectly matching the query."
        )
        .default(false),
      dateRange: z
        .object({
          startDate: z
            .string()
            .optional()
            .describe(
              "Start date for filtering in YYYY-MM-DD format (e.g., '2024-01-01'). Only return memos created on or after this date."
            ),
          endDate: z
            .string()
            .optional()
            .describe(
              "End date for filtering in YYYY-MM-DD format (e.g., '2024-12-31'). Only return memos created on or before this date."
            ),
        })
        .optional()
        .describe(
          "Date range filter to find memos from specific time periods. Useful for temporal searches like 'what did we discuss last week' or 'decisions made in January'."
        ),
    },
    async ({
      query,
      sessionId,
      limit,
      tags,
      authorRole,
      minImportance,
      maxImportance,
      sortBy,
      includePopular,
      dateRange,
    }): Promise<CallToolResult> => {
      try {
        // Get user ID from authenticated request
        const authenticatedUserId = req?.user?.id || "anonymous";

        const searchData: SearchRequest = {
          query,
          userId: authenticatedUserId,
          sessionId,
          limit,
          tags,
          authorRole: authorRole as AuthorRole,
          minImportance,
          maxImportance,
          sortBy,
          includePopular,
          dateRange,
        };

        const response = await fetch(`${BACKEND_API_URL}/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req?.headers.authorization || "",
          },
          body: JSON.stringify(searchData),
        });

        console.log("searchData", searchData);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `Failed to search memos: ${error.error || response.statusText}`
          );
        }

        const memos = await response.json();
        console.log("memos", memos);

        if (memos.length === 0) {
          const filterSummary = [];
          if (tags && tags.length > 0)
            filterSummary.push(`tags: ${tags.join(", ")}`);
          if (authorRole) filterSummary.push(`author: ${authorRole}`);
          if (minImportance !== undefined || maxImportance !== undefined) {
            filterSummary.push(
              `importance: ${minImportance || 0}-${maxImportance || 1}`
            );
          }
          if (dateRange?.startDate || dateRange?.endDate) {
            filterSummary.push(
              `date: ${dateRange.startDate || "start"} to ${
                dateRange.endDate || "end"
              }`
            );
          }

          const filterText =
            filterSummary.length > 0
              ? ` with filters: ${filterSummary.join(", ")}`
              : "";

          return {
            content: [
              {
                type: "text",
                text: `No memos found for query: "${query}"${filterText}`,
              },
            ],
          };
        }

        const sortLabel =
          sortBy === "relevance"
            ? "relevance"
            : sortBy === "importance"
            ? "importance"
            : sortBy === "recency"
            ? "most recent"
            : "popularity";

        const results = memos
          .map((memo: any, index: number) => {
            const tagText =
              memo.tags && memo.tags.length > 0 ? memo.tags.join(", ") : "None";
            const summaryText = memo.summary
              ? `\n   Summary: ${memo.summary}`
              : "";

            return (
              `${index + 1}. ID: ${memo.id} | Author: ${
                memo.authorRole
              } | Importance: ${memo.importance || 0.5} | Access: ${
                memo.accessCount || 0
              }\n` +
              `   Content: ${memo.content}${summaryText}\n` +
              `   Tags: ${tagText}\n` +
              `   Created: ${new Date(
                memo.createdAt
              ).toLocaleString()} | Updated: ${new Date(
                memo.updatedAt
              ).toLocaleString()}\n`
            );
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${memos.length} memo(s) for query: "${query}" (sorted by ${sortLabel})\n\n${results}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching memos: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
};

const app = express();
app.use(express.json());

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
app.use(
  cors({
    origin: "*", // Allow all origins - adjust as needed for production
    exposedHeaders: ["Mcp-Session-Id"],
  })
);

app.post(
  "/mcp",
  authenticateApiKey,
  requirePermission("read"),
  async (req: Request, res: Response) => {
    const server = getServer(req);
    try {
      const transport: StreamableHTTPServerTransport =
        new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        console.log("Request closed");
        transport.close();
        server.close();
      });
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  }
);

app.get("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

app.delete("/mcp", async (req: Request, res: Response) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

// Start the server
const PORT = 3002; // MCP server port
app.listen(PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  process.exit(0);
});

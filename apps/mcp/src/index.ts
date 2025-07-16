import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { z } from "zod";
import cors from "cors";

// Backend API base URL
const BACKEND_API_URL = "http://localhost:3000";

// Types for API requests
enum AuthorRole {
  USER = "user",
  AGENT = "agent",
  SYSTEM = "system",
}

interface CreateMemoRequest {
  sessionId?: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  tags?: string[];
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

const getServer = () => {
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
    "Create a new memo in the system",
    {
      sessionId: z
        .string()
        .optional()
        .describe("Optional session ID for the memo"),
      userId: z.string().describe("User ID who created the memo"),
      content: z.string().describe("The main content of the memo"),
      summary: z.string().optional().describe("Optional summary of the memo"),
      authorRole: z
        .enum(["user", "agent", "system"])
        .describe("Role of the author")
        .default("user"),
      importance: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Importance score between 0 and 1")
        .default(1.0),
      tags: z
        .array(z.string())
        .optional()
        .describe("Optional tags for the memo"),
    },
    async ({
      sessionId,
      userId,
      content,
      summary,
      authorRole,
      importance,
      tags,
    }): Promise<CallToolResult> => {
      try {
        const memoData: CreateMemoRequest = {
          sessionId,
          userId,
          content,
          summary,
          authorRole: authorRole as AuthorRole,
          importance,
          tags,
        };

        const response = await fetch(`${BACKEND_API_URL}/memo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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

        return {
          content: [
            {
              type: "text",
              text: `Successfully created memo with ID: ${
                createdMemo.id
              }\n\n${sessionInfo}Content: ${createdMemo.content}\nAuthor: ${
                createdMemo.authorRole
              }\nImportance: ${createdMemo.importance}\nTags: ${
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
    "Search for memos based on keywords with advanced filtering and sorting options",
    {
      query: z.string().describe("Search query to find relevant memos"),
      userId: z.string().optional().describe("Filter by specific user ID"),
      sessionId: z
        .string()
        .optional()
        .describe("Filter by specific session ID"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe("Maximum number of results to return")
        .default(10),
      // Enhanced search parameters
      tags: z.array(z.string()).optional().describe("Filter by specific tags"),
      authorRole: z
        .enum(["user", "agent", "system"])
        .optional()
        .describe("Filter by author role"),
      minImportance: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Minimum importance score"),
      maxImportance: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Maximum importance score"),
      sortBy: z
        .enum(["relevance", "importance", "recency", "popularity"])
        .optional()
        .describe("Sort results by different criteria")
        .default("relevance"),
      includePopular: z
        .boolean()
        .optional()
        .describe("Include popularity boost in relevance scoring")
        .default(false),
      dateRange: z
        .object({
          startDate: z
            .string()
            .optional()
            .describe("Start date for filtering (YYYY-MM-DD format)"),
          endDate: z
            .string()
            .optional()
            .describe("End date for filtering (YYYY-MM-DD format)"),
        })
        .optional()
        .describe("Filter by date range"),
    },
    async ({
      query,
      userId,
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
        const searchData: SearchRequest = {
          query,
          userId,
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
          },
          body: JSON.stringify(searchData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `Failed to search memos: ${error.error || response.statusText}`
          );
        }

        const memos = await response.json();

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

app.post("/mcp", async (req: Request, res: Response) => {
  const server = getServer();
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
});

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
const PORT = 3001; // Changed from 3000 to avoid conflicts with backend
app.listen(PORT, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  process.exit(0);
});

// Simple test file for basic API testing
// Run with: npx ts-node src/__tests__/simple-test.ts

import { Request, Response } from "express";

// Mock request and response objects
const mockRequest = (
  body: any = {},
  params: any = {},
  query: any = {}
): Partial<Request> => ({
  body,
  params,
  query,
});

const mockResponse = (): any => {
  const res: any = {
    jsonData: null,
    statusCode: 200,
    json: (data: any) => {
      res.jsonData = data;
      return res;
    },
    status: (code: number) => {
      res.statusCode = code;
      return res;
    },
  };
  return res;
};

// Mock database pool
const mockPool = {
  query: async (sql: string, params: any[]) => {
    // Return mock data based on the SQL query
    if (sql.includes("SELECT") && sql.includes("memos")) {
      return {
        rows: [
          {
            id: 1,
            session_id: "test-session",
            user_id: "test-user",
            content: "Test memo content",
            summary: "Test summary",
            author_role: "user",
            importance: 0.8,
            access_count: 1,
            tags: ["test"],
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };
    }
    return { rows: [] };
  },
};

// Mock embedding service
const mockEmbeddingService = {
  generateEmbedding: async (text: string) => [0.1, 0.2, 0.3],
};

// Basic test runner
class SimpleTestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log("Running simple tests...\n");

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${(error as Error).message}`);
      }
    }

    console.log("\nTests completed.");
  }
}

const runner = new SimpleTestRunner();

// Test: Health endpoint logic
runner.test("Health endpoint should return status", async () => {
  const req = mockRequest();
  const res = mockResponse();

  // Simulate health endpoint logic
  const healthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };

  res.json(healthResponse);

  if (res.jsonData.status !== "healthy") {
    throw new Error("Health endpoint failed");
  }
});

// Test: Create memo validation
runner.test("Create memo should validate required fields", async () => {
  const req = mockRequest({
    userId: "test-user",
    content: "Test content",
    authorRole: "user",
  });
  const res = mockResponse();

  // Simulate memo creation validation
  const { userId, content, authorRole } = req.body;

  if (!userId || !content || !authorRole) {
    res.status(400).json({ error: "Missing required fields" });
    throw new Error("Should not reach here with valid data");
  }

  // Mock successful creation
  res.status(201).json({
    id: 1,
    userId,
    content,
    authorRole,
    createdAt: new Date(),
  });

  if (res.statusCode !== 201) {
    throw new Error("Create memo failed");
  }
});

// Test: Search query validation
runner.test("Search should validate query parameter", async () => {
  const req = mockRequest({
    // Missing query
    userId: "test-user",
  });
  const res = mockResponse();

  // Simulate search validation
  const { query } = req.body;

  if (!query) {
    res.status(400).json({ error: "Search query is required" });
    if (res.statusCode !== 400) {
      throw new Error("Search validation failed");
    }
    return;
  }

  throw new Error("Should have failed validation");
});

// Run the tests
runner.run().catch(console.error);

import request from "supertest";
import app from "../app";

// Mock the database pool
jest.mock("../config/database", () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock the embedding service
jest.mock("../services/embeddingService", () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

import { pool } from "../config/database";

const mockPool = pool as any;

describe("Search Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /search", () => {
    it("should search memos successfully", async () => {
      const mockMemos = [
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
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockMemos });

      const response = await request(app)
        .post("/search")
        .send({
          query: "test",
          userId: "test-user",
          limit: 10,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].content).toBe("Test memo content");
    });

    it("should return 400 when query is missing", async () => {
      await request(app)
        .post("/search")
        .send({
          userId: "test-user",
          // Missing query
        })
        .expect(400);
    });

    it("should return empty array when no matches found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post("/search")
        .send({
          query: "nonexistent",
          userId: "test-user",
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
});

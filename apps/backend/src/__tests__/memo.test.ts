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

describe("Memo Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /memo", () => {
    it("should create a new memo successfully", async () => {
      const mockMemo = {
        id: 1,
        session_id: "test-session",
        user_id: "test-user",
        content: "Test memo content",
        summary: "Test summary",
        author_role: "user",
        importance: 0.8,
        access_count: 0,
        tags: ["test"],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockMemo] });

      const response = await request(app)
        .post("/memo")
        .send({
          userId: "test-user",
          content: "Test memo content",
          summary: "Test summary",
          authorRole: "user",
          importance: 0.8,
          tags: ["test"],
        })
        .expect(201);

      expect(response.body.content).toBe("Test memo content");
      expect(response.body.userId).toBe("test-user");
    });

    it("should return 400 when required fields are missing", async () => {
      await request(app)
        .post("/memo")
        .send({
          userId: "test-user",
          // Missing content
        })
        .expect(400);
    });
  });

  describe("GET /memo/:id", () => {
    it("should retrieve a memo by ID", async () => {
      const mockMemo = {
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
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockMemo] });

      const response = await request(app).get("/memo/1").expect(200);

      expect(response.body.content).toBe("Test memo content");
      expect(response.body.id).toBe(1);
    });

    it("should return 404 when memo not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await request(app).get("/memo/999").expect(404);
    });
  });
});

import request from "supertest";
import app from "../app";

describe("Health Endpoint", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({
        status: "OK",
        timestamp: expect.any(String),
      });
    });
  });
});

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    telemetryRaw: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";

const telemetryRawFindMany = prisma.telemetryRaw.findMany as jest.Mock;
const telemetryRawFindUnique = prisma.telemetryRaw.findUnique as jest.Mock;
const sessionFindMany = prisma.session.findMany as jest.Mock;
const sessionFindUnique = prisma.session.findUnique as jest.Mock;
const sessionDelete = prisma.session.delete as jest.Mock;

describe("API integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /health", () => {
    it("returns ok status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("GET /api/telemetry", () => {
    it("returns telemetry items from database layer", async () => {
      telemetryRawFindMany.mockResolvedValueOnce([
        { id: "raw-1", topic: "rato/telemetria", payload: {}, robotId: null },
      ]);

      const response = await request(app).get("/api/telemetry?limit=10");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.items).toHaveLength(1);
      expect(telemetryRawFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe("GET /api/telemetry/:id", () => {
    it("returns 404 when telemetry is not found", async () => {
      telemetryRawFindUnique.mockResolvedValueOnce(null);

      const response = await request(app).get("/api/telemetry/missing-id");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Telemetry not found" });
    });

    it("returns telemetry item when found", async () => {
      const item = {
        id: "raw-1",
        topic: "rato/telemetria",
        payload: { step: 1 },
        robotId: null,
      };
      telemetryRawFindUnique.mockResolvedValueOnce(item);

      const response = await request(app).get("/api/telemetry/raw-1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(item);
    });
  });

  describe("GET /api/sessions", () => {
    it("returns session metadata list", async () => {
      const createdAt = new Date("2026-01-01T00:00:00.000Z");
      sessionFindMany.mockResolvedValueOnce([
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          sessionName: "Run 1",
          algorithm: "DFS",
          createdAt,
          isCompleted: true,
          durationMs: 1000,
          initialVoltage: 12,
          finalVoltage: 11,
        },
      ]);

      const response = await request(app).get("/api/sessions");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.items[0]).toEqual(
        expect.objectContaining({
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Run 1",
          algorithm: "DFS",
        })
      );
    });
  });

  describe("GET /api/sessions/:id", () => {
    it("returns 400 for invalid uuid", async () => {
      const response = await request(app).get("/api/sessions/not-a-uuid");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "invalid_id" });
    });

    it("returns 404 when session is not found", async () => {
      sessionFindUnique.mockResolvedValueOnce(null);

      const response = await request(app).get(
        "/api/sessions/550e8400-e29b-41d4-a716-446655440000"
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "session_not_found" });
    });

    it("returns session detail with steps", async () => {
      const createdAt = new Date("2026-01-01T00:00:00.000Z");
      const stepTimestamp = new Date("2026-01-01T00:01:00.000Z");
      sessionFindUnique.mockResolvedValueOnce({
        id: "550e8400-e29b-41d4-a716-446655440000",
        sessionName: "Run 1",
        algorithm: "DFS",
        createdAt,
        isCompleted: true,
        durationMs: 1000,
        initialVoltage: 12,
        finalVoltage: 11,
        telemetrySteps: [
          {
            id: "step-1",
            stepOrder: 1,
            posX: 0,
            posY: 0,
            voltage: 11.5,
            current: 200,
            timestamp: stepTimestamp,
          },
        ],
      });

      const response = await request(app).get(
        "/api/sessions/550e8400-e29b-41d4-a716-446655440000"
      );

      expect(response.status).toBe(200);
      expect(response.body.steps).toHaveLength(1);
      expect(response.body.name).toBe("Run 1");
    });
  });

  describe("DELETE /api/sessions/:id", () => {
    it("returns 404 when session does not exist", async () => {
      sessionFindUnique.mockResolvedValueOnce(null);

      const response = await request(
        app
      ).delete("/api/sessions/550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "session_not_found" });
    });

    it("deletes existing session", async () => {
      sessionFindUnique.mockResolvedValueOnce({ id: "550e8400-e29b-41d4-a716-446655440000" });
      sessionDelete.mockResolvedValueOnce(undefined);

      const response = await request(
        app
      ).delete("/api/sessions/550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(204);
      expect(sessionDelete).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440000" },
      });
    });
  });

  describe("error middleware", () => {
    it("returns 500 for unhandled route errors", async () => {
      sessionFindMany.mockRejectedValueOnce(new Error("db unavailable"));
      jest.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app).get("/api/sessions");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "internal_error" });
    });
  });
});

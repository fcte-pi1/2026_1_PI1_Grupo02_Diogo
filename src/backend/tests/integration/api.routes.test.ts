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

const socketEmitMock = jest.fn();
jest.mock("../../src/websocket/socket", () => {
  const actual = jest.requireActual("../../src/websocket/socket");
  return {
    ...actual,
    getSocket: jest.fn(() => ({ emit: socketEmitMock })),
  };
});

import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { stopSimulator } from "../../src/services/simulator.service";

const telemetryRawFindMany = prisma.telemetryRaw.findMany as jest.Mock;
const telemetryRawFindUnique = prisma.telemetryRaw.findUnique as jest.Mock;
const sessionFindMany = prisma.session.findMany as jest.Mock;
const sessionFindUnique = prisma.session.findUnique as jest.Mock;
const sessionDelete = prisma.session.delete as jest.Mock;

describe("API integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopSimulator();
  });

  afterEach(() => {
    stopSimulator();
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

  describe("POST /api/telemetry/simulator", () => {
    it("starts, pauses and stops the simulator", async () => {
      const start = await request(app)
        .post("/api/telemetry/simulator")
        .send({ action: "start" });

      expect(start.status).toBe(200);
      expect(start.body).toEqual(
        expect.objectContaining({
          message: "Simulador iniciado/retomado.",
          running: true,
          paused: false,
        })
      );

      const pause = await request(app)
        .post("/api/telemetry/simulator")
        .send({ action: "pause" });

      expect(pause.status).toBe(200);
      expect(pause.body).toEqual(
        expect.objectContaining({
          message: "Simulador pausado.",
          running: true,
          paused: true,
        })
      );

      const stop = await request(app)
        .post("/api/telemetry/simulator")
        .send({ action: "stop" });

      expect(stop.status).toBe(200);
      expect(stop.body).toEqual({
        message: "Simulador parado e zerado.",
        running: false,
        paused: false,
      });
    });

    it("returns 400 for invalid simulator action", async () => {
      const response = await request(app)
        .post("/api/telemetry/simulator")
        .send({ action: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Ação inválida. Use 'start', 'pause' ou 'stop'.",
      });
    });
  });

  describe("POST /api/telemetry/simulator/update", () => {
    it("updates simulator variables", async () => {
      const response = await request(app)
        .post("/api/telemetry/simulator/update")
        .send({ posX: 2, posY: 4, voltage: 11.8, wallNorth: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Variáveis do barramento atualizadas.");
      expect(response.body.config).toEqual(
        expect.objectContaining({
          posX: 2,
          posY: 4,
          voltage: 11.8,
          wallNorth: true,
        })
      );
    });
  });

  describe("GET /api/telemetry/simulator/status", () => {
    it("returns current simulator status", async () => {
      await request(app)
        .post("/api/telemetry/simulator")
        .send({ action: "start" });

      const response = await request(app).get("/api/telemetry/simulator/status");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          running: true,
          paused: false,
          stepOrder: 0,
        })
      );
    });
  });
});

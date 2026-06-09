jest.mock("../../../src/repositories/maze.repository", () => ({
  findOrCreateDefaultMaze: jest.fn(),
}));

jest.mock("../../../src/repositories/session.repository", () => ({
  createConsolidatedSession: jest.fn(),
}));

jest.mock("../../../src/repositories/session-step.repository", () => ({
  createOrphanSessionStep: jest.fn(),
  findOrphanSteps: jest.fn(),
  findOrphanStepsLimited: jest.fn(),
  linkOrphanStepsToSession: jest.fn(),
}));

jest.mock("../../../src/repositories/telemetry.repository", () => ({
  createTelemetry: jest.fn(),
  listTelemetry: jest.fn(),
  getTelemetryById: jest.fn(),
}));

jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock("../../../src/websocket/socket", () =>
  require("../../mocks/socket")
);

import { prisma } from "../../../src/lib/prisma";
import { findOrCreateDefaultMaze } from "../../../src/repositories/maze.repository";
import { createConsolidatedSession } from "../../../src/repositories/session.repository";
import {
  createOrphanSessionStep,
  findOrphanSteps,
  findOrphanStepsLimited,
  linkOrphanStepsToSession,
} from "../../../src/repositories/session-step.repository";
import {
  createTelemetry,
  getTelemetryById,
  listTelemetry,
} from "../../../src/repositories/telemetry.repository";
import {
  consolidateSession,
  getOrphanStepsForReplay,
  getRecentTelemetry,
  getTelemetryByIdService,
  recordOrphanTelemetryStep,
  resetTelemetryRunContextForTests,
  storeTelemetry,
} from "../../../src/services/telemetry.service";
import * as socketMock from "../../mocks/socket";
import {
  createValidTelemetryPayload,
  telemetryPayloadToBuffer,
} from "../../helpers/telemetry.factory";

const mazeMock = findOrCreateDefaultMaze as jest.Mock;
const createOrphanMock = createOrphanSessionStep as jest.Mock;
const findOrphansMock = findOrphanSteps as jest.Mock;
const findOrphansLimitedMock = findOrphanStepsLimited as jest.Mock;
const linkOrphansMock = linkOrphanStepsToSession as jest.Mock;
const createConsolidatedMock = createConsolidatedSession as jest.Mock;
const createTelemetryMock = createTelemetry as jest.Mock;
const listTelemetryMock = listTelemetry as jest.Mock;
const getTelemetryByIdMock = getTelemetryById as jest.Mock;
const transactionMock = prisma.$transaction as jest.Mock;

describe("telemetry.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTelemetryRunContextForTests();
    mazeMock.mockResolvedValue({ id: "maze-1" });
    transactionMock.mockImplementation(async (callback) => callback({}));
  });

  describe("storeTelemetry", () => {
    it("stores valid payload and records orphan step", async () => {
      const payload = createValidTelemetryPayload({ robotId: "robot-01" });
      const created = { id: "raw-1", topic: "rato/telemetria", payload };
      const step = { id: "step-1", stepOrder: 1 };
      createTelemetryMock.mockResolvedValueOnce(created);
      createOrphanMock.mockResolvedValueOnce(step);
      socketMock.getSocket.mockReturnValue({ emit: jest.fn() });

      const result = await storeTelemetry(
        "rato/telemetria",
        telemetryPayloadToBuffer(payload)
      );

      expect(result).toEqual(created);
      expect(createTelemetryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "rato/telemetria",
          robotId: "robot-01",
        })
      );
      expect(socketMock.emitTelemetry).toHaveBeenCalledWith(created);
      expect(createOrphanMock).toHaveBeenCalled();
    });

    it("stores invalid json as raw payload", async () => {
      const created = { id: "raw-2" };
      createTelemetryMock.mockResolvedValueOnce(created);

      const result = await storeTelemetry(
        "rato/telemetria",
        Buffer.from("not-json", "utf-8")
      );

      expect(result).toEqual(created);
      expect(createTelemetryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { raw: "not-json" },
        })
      );
      expect(createOrphanMock).not.toHaveBeenCalled();
    });

    it("stores validation errors without creating orphan step", async () => {
      const invalidPayload = { step: "invalid" };
      const created = { id: "raw-3" };
      createTelemetryMock.mockResolvedValueOnce(created);

      const result = await storeTelemetry(
        "rato/telemetria",
        telemetryPayloadToBuffer(invalidPayload)
      );

      expect(result).toEqual(created);
      expect(createOrphanMock).not.toHaveBeenCalled();
    });

    it("consolidates session when conclusao is true", async () => {
      const payload = createValidTelemetryPayload({ conclusao: true, step: 2 });
      const created = { id: "raw-4" };
      const step = {
        id: "step-1",
        stepOrder: 1,
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
        posX: 0,
        posY: 0,
        voltage: 11.5,
        current: 200,
      };
      const lastStep = {
        ...step,
        id: "step-2",
        stepOrder: 2,
        timestamp: new Date("2026-01-01T00:00:05.000Z"),
      };

      createTelemetryMock.mockResolvedValueOnce(created);
      createOrphanMock.mockResolvedValueOnce(step);
      findOrphansMock.mockResolvedValueOnce([step, lastStep]);
      createConsolidatedMock.mockResolvedValueOnce({ id: "session-1" });
      linkOrphansMock.mockResolvedValueOnce(undefined);
      socketMock.getSocket.mockReturnValue({ emit: jest.fn() });

      await storeTelemetry(
        "rato/telemetria",
        telemetryPayloadToBuffer(payload)
      );

      expect(createConsolidatedMock).toHaveBeenCalled();
      expect(linkOrphansMock).toHaveBeenCalledWith("session-1", expect.any(Object));
    });
  });

  describe("recordOrphanTelemetryStep", () => {
    it("creates orphan step and emits websocket events", async () => {
      const payload = createValidTelemetryPayload();
      const step = { id: "step-1" };
      const emit = jest.fn();
      createOrphanMock.mockResolvedValueOnce(step);
      socketMock.getSocket.mockReturnValue({ emit });

      const result = await recordOrphanTelemetryStep(payload);

      expect(result).toEqual(step);
      expect(emit).toHaveBeenCalledWith("telemetry:step", step);
      expect(emit).toHaveBeenCalledWith("telemetry:subscribe", step);
    });

    it("continues when websocket server is not initialized", async () => {
      const payload = createValidTelemetryPayload();
      const step = { id: "step-1" };
      createOrphanMock.mockResolvedValueOnce(step);
      socketMock.getSocket.mockImplementation(() => {
        throw new Error("Socket server not initialized");
      });
      jest.spyOn(console, "error").mockImplementationOnce(() => {});

      const result = await recordOrphanTelemetryStep(payload);

      expect(result).toEqual(step);
    });
  });

  describe("consolidateSession", () => {
    it("returns null when there are no orphan steps", async () => {
      findOrphansMock.mockResolvedValueOnce([]);

      const result = await consolidateSession(createValidTelemetryPayload());

      expect(result).toBeNull();
      expect(createConsolidatedMock).not.toHaveBeenCalled();
    });

    it("creates consolidated session from orphan steps", async () => {
      const firstStep = {
        id: "step-1",
        stepOrder: 1,
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
        posX: 0,
        posY: 0,
        voltage: 12,
        current: 200,
      };
      const lastStep = {
        ...firstStep,
        id: "step-2",
        stepOrder: 2,
        timestamp: new Date("2026-01-01T00:00:10.000Z"),
        voltage: 11.5,
      };
      findOrphansMock.mockResolvedValueOnce([firstStep, lastStep]);
      createConsolidatedMock.mockResolvedValueOnce({ id: "session-1" });
      linkOrphansMock.mockResolvedValueOnce(undefined);
      jest.spyOn(console, "log").mockImplementation(() => {});

      const result = await consolidateSession(
        createValidTelemetryPayload({ modo: "FLOOD FILL", estado: "FINALIZADO" })
      );

      expect(result).toBe("session-1");
      expect(createConsolidatedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          algorithm: "FLOOD FILL",
          mode: "FINALIZADO",
          mazeId: "maze-1",
          durationMs: 10000,
        }),
        expect.any(Object)
      );
    });
  });

  describe("query helpers", () => {
    it("delegates getRecentTelemetry to repository", async () => {
      listTelemetryMock.mockResolvedValueOnce([{ id: "a" }]);

      const result = await getRecentTelemetry(10);

      expect(listTelemetryMock).toHaveBeenCalledWith(10);
      expect(result).toEqual([{ id: "a" }]);
    });

    it("delegates getTelemetryByIdService to repository", async () => {
      getTelemetryByIdMock.mockResolvedValueOnce({ id: "abc" });

      const result = await getTelemetryByIdService("abc");

      expect(getTelemetryByIdMock).toHaveBeenCalledWith("abc");
      expect(result).toEqual({ id: "abc" });
    });

    it("delegates getOrphanStepsForReplay to repository", async () => {
      findOrphansLimitedMock.mockResolvedValueOnce([{ id: "step-1" }]);

      const result = await getOrphanStepsForReplay(5);

      expect(findOrphansLimitedMock).toHaveBeenCalledWith(5);
      expect(result).toEqual([{ id: "step-1" }]);
    });
  });
});

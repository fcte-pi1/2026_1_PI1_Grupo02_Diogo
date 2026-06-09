jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    session: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    sessionStep: {
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma";
import {
  closeSession,
  createConsolidatedSession,
  createSession,
  deleteSessionById,
  findActiveSession,
  findActiveSessionWithSteps,
  findFirstStepOfSession,
  findManySessionMetadata,
  findSessionDetailWithSteps,
  findSessionMetadataById,
  findSessionWithSteps,
  sessionExists,
} from "../../../src/repositories/session.repository";

const sessionFindFirst = prisma.session.findFirst as jest.Mock;
const sessionCreate = prisma.session.create as jest.Mock;
const sessionUpdate = prisma.session.update as jest.Mock;
const sessionFindMany = prisma.session.findMany as jest.Mock;
const sessionFindUnique = prisma.session.findUnique as jest.Mock;
const sessionDelete = prisma.session.delete as jest.Mock;
const stepFindFirst = prisma.sessionStep.findFirst as jest.Mock;

describe("session.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("finds active session by robot id", async () => {
    sessionFindFirst.mockResolvedValueOnce({ id: "session-1" });

    const result = await findActiveSession("robot-01");

    expect(sessionFindFirst).toHaveBeenCalled();
    expect(result).toEqual({ id: "session-1" });
  });

  it("creates session", async () => {
    sessionCreate.mockResolvedValueOnce({ id: "session-1" });

    const result = await createSession({
      sessionName: "Run",
      algorithm: "DFS",
      mode: "EXPLORANDO",
      mazeId: "maze-1",
    });

    expect(result).toEqual({ id: "session-1" });
  });

  it("creates consolidated session as completed", async () => {
    sessionCreate.mockResolvedValueOnce({ id: "session-1" });

    const result = await createConsolidatedSession({
      sessionName: "Run",
      algorithm: "DFS",
      mode: "FINALIZADO",
      mazeId: "maze-1",
      durationMs: 1000,
      initialVoltage: 12,
      finalVoltage: 11,
      startPosX: 0,
      startPosY: 0,
    });

    expect(sessionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ isCompleted: true }),
    });
    expect(result).toEqual({ id: "session-1" });
  });

  it("closes session", async () => {
    sessionUpdate.mockResolvedValueOnce({ id: "session-1", isCompleted: true });

    const result = await closeSession("session-1", {
      durationMs: 1000,
      avgSpeed: 1.2,
      finalVoltage: 11,
      totalDrainMah: 50,
    });

    expect(sessionUpdate).toHaveBeenCalled();
    expect(result.isCompleted).toBe(true);
  });

  it("lists session metadata", async () => {
    sessionFindMany.mockResolvedValueOnce([{ id: "session-1" }]);

    const result = await findManySessionMetadata();

    expect(result).toEqual([{ id: "session-1" }]);
  });

  it("finds session metadata by id", async () => {
    sessionFindUnique.mockResolvedValueOnce({ id: "session-1" });

    const result = await findSessionMetadataById("session-1");

    expect(result).toEqual({ id: "session-1" });
  });

  it("finds session with steps", async () => {
    sessionFindUnique.mockResolvedValueOnce({
      id: "session-1",
      telemetrySteps: [],
    });

    const result = await findSessionWithSteps("session-1");

    expect(result).toEqual({ id: "session-1", telemetrySteps: [] });
  });

  it("finds session detail with steps", async () => {
    sessionFindUnique.mockResolvedValueOnce({
      id: "session-1",
      telemetrySteps: [],
    });

    const result = await findSessionDetailWithSteps("session-1");

    expect(result).toEqual({ id: "session-1", telemetrySteps: [] });
  });

  it("checks session existence", async () => {
    sessionFindUnique.mockResolvedValueOnce({ id: "session-1" });

    await expect(sessionExists("session-1")).resolves.toBe(true);
  });

  it("deletes session by id", async () => {
    sessionDelete.mockResolvedValueOnce(undefined);

    await deleteSessionById("session-1");

    expect(sessionDelete).toHaveBeenCalledWith({ where: { id: "session-1" } });
  });

  it("finds first step of session", async () => {
    stepFindFirst.mockResolvedValueOnce({ id: "step-1" });

    const result = await findFirstStepOfSession("session-1");

    expect(result).toEqual({ id: "step-1" });
  });

  it("finds active session with steps", async () => {
    sessionFindFirst.mockResolvedValueOnce({
      id: "session-1",
      telemetrySteps: [],
    });

    const result = await findActiveSessionWithSteps(10);

    expect(result).toEqual({ id: "session-1", telemetrySteps: [] });
  });
});

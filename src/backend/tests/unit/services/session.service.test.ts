jest.mock("../../../src/repositories/session.repository", () => ({
  findManySessionMetadata: jest.fn(),
  findSessionDetailWithSteps: jest.fn(),
  sessionExists: jest.fn(),
  deleteSessionById: jest.fn(),
}));

import {
  deleteSession,
  getSessionDetail,
  listSessionMetadata,
} from "../../../src/services/session.service";
import {
  deleteSessionById,
  findManySessionMetadata,
  findSessionDetailWithSteps,
  sessionExists,
} from "../../../src/repositories/session.repository";

const findManyMock = findManySessionMetadata as jest.Mock;
const findDetailMock = findSessionDetailWithSteps as jest.Mock;
const existsMock = sessionExists as jest.Mock;
const deleteMock = deleteSessionById as jest.Mock;

describe("session.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists session metadata mapped to DTOs", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    findManyMock.mockResolvedValueOnce([
      {
        id: "s1",
        sessionName: "Run 1",
        algorithm: "DFS",
        createdAt,
        isCompleted: true,
        durationMs: 1000,
        avgSpeed: 3.6,
        initialVoltage: 12,
        finalVoltage: 11,
        totalDrainMah: 200,
      },
    ]);

    const result = await listSessionMetadata();

    expect(result).toEqual([
      {
        id: "s1",
        name: "Run 1",
        algorithm: "DFS",
        createdAt: createdAt.toISOString(),
        completed: true,
        durationMs: 1000,
        avgSpeed: 3.6,
        initialVoltage: 12,
        finalVoltage: 11,
        totalDrainMah: 200,
      },
    ]);
  });

  it("returns null when session detail is not found", async () => {
    findDetailMock.mockResolvedValueOnce(null);

    const result = await getSessionDetail("missing-id");

    expect(result).toBeNull();
  });

  it("returns session detail with mapped steps", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const stepTimestamp = new Date("2026-01-01T00:01:00.000Z");
    findDetailMock.mockResolvedValueOnce({
      id: "s1",
      sessionName: "Run 1",
      algorithm: "DFS",
      createdAt,
      isCompleted: true,
      durationMs: 1000,
      avgSpeed: 3.6,
      initialVoltage: 12,
      finalVoltage: 11,
      totalDrainMah: 200,
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

    const result = await getSessionDetail("s1");

    expect(result).toEqual({
      id: "s1",
      name: "Run 1",
      algorithm: "DFS",
      createdAt: createdAt.toISOString(),
      completed: true,
      durationMs: 1000,
      avgSpeed: 3.6,
      initialVoltage: 12,
      finalVoltage: 11,
      totalDrainMah: 200,
      maze: undefined,
      steps: [
        {
          id: "step-1",
          stepOrder: 1,
          posX: 0,
          posY: 0,
          voltage: 11.5,
          current: 200,
          createdAt: stepTimestamp.toISOString(),
        },
      ],
    });
  });

  it("returns false when deleting a missing session", async () => {
    existsMock.mockResolvedValueOnce(false);

    const result = await deleteSession("missing-id");

    expect(result).toBe(false);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes existing session", async () => {
    existsMock.mockResolvedValueOnce(true);
    deleteMock.mockResolvedValueOnce(undefined);

    const result = await deleteSession("s1");

    expect(result).toBe(true);
    expect(deleteMock).toHaveBeenCalledWith("s1");
  });
});

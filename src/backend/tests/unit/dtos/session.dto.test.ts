import {
  toSessionMetadataDto,
  toSessionStepDto,
} from "../../../src/dtos/session.dto";

describe("session.dto", () => {
  it("maps session metadata to DTO", () => {
    const createdAt = new Date("2026-01-15T10:00:00.000Z");

    const dto = toSessionMetadataDto({
      id: "session-1",
      sessionName: "Corrida teste",
      algorithm: "DFS",
      createdAt,
      isCompleted: true,
      durationMs: 5000,
      avgSpeed: 12.5,
      initialVoltage: 12,
      finalVoltage: 11.2,
      totalDrainMah: 215,
    });

    expect(dto).toEqual({
      id: "session-1",
      name: "Corrida teste",
      algorithm: "DFS",
      createdAt: createdAt.toISOString(),
      completed: true,
      durationMs: 5000,
      avgSpeed: 12.5,
      initialVoltage: 12,
      finalVoltage: 11.2,
      totalDrainMah: 215,
    });
  });

  it("maps session step to DTO", () => {
    const timestamp = new Date("2026-01-15T10:01:00.000Z");

    const dto = toSessionStepDto({
      id: "step-1",
      stepOrder: 3,
      posX: 2,
      posY: 4,
      voltage: 11.8,
      current: 220,
      timestamp,
    });

    expect(dto).toEqual({
      id: "step-1",
      stepOrder: 3,
      posX: 2,
      posY: 4,
      voltage: 11.8,
      current: 220,
      createdAt: timestamp.toISOString(),
    });
  });
});

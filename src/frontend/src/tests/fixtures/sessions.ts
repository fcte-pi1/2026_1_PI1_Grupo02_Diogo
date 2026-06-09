import type { SessionDetail, SessionMetadata } from "../../types/session";

export const sessionMetadataFixture: SessionMetadata = {
  id: "sess-1",
  name: "Corrida Teste",
  algorithm: "DFS",
  createdAt: "2026-01-15T10:00:00.000Z",
  completed: true,
  durationMs: 125000,
  initialVoltage: 12.1,
  finalVoltage: 10.5,
};

export const sessionDetailFixture: SessionDetail = {
  ...sessionMetadataFixture,
  steps: [
    {
      id: "step-1",
      stepOrder: 1,
      posX: 0,
      posY: 0,
      voltage: 12,
      current: 200,
      createdAt: "2026-01-15T10:00:01.000Z",
    },
    {
      id: "step-2",
      stepOrder: 2,
      posX: 1,
      posY: 0,
      voltage: 11.8,
      current: 210,
      createdAt: "2026-01-15T10:00:02.000Z",
    },
    {
      id: "step-3",
      stepOrder: 3,
      posX: 1,
      posY: 1,
      voltage: 11.5,
      current: 220,
      createdAt: "2026-01-15T10:00:03.000Z",
    },
  ],
};

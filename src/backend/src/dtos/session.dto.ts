import type { Session, SessionStep } from "@prisma/client";

export type SessionMetadataDto = {
  id: string;
  name: string;
  algorithm: string;
  createdAt: string;
  completed: boolean;
  durationMs: number | null;
  initialVoltage: number | null;
  finalVoltage: number | null;
};

export type SessionStepDto = {
  id: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  createdAt: string;
};

export type SessionDetailDto = SessionMetadataDto & {
  steps: SessionStepDto[];
};

type SessionMetadataSource = Pick<
  Session,
  | "id"
  | "sessionName"
  | "algorithm"
  | "createdAt"
  | "isCompleted"
  | "durationMs"
  | "initialVoltage"
  | "finalVoltage"
>;

type SessionStepSource = Pick<
  SessionStep,
  "id" | "stepOrder" | "posX" | "posY" | "voltage" | "current" | "timestamp"
>;

export const toSessionMetadataDto = (
  session: SessionMetadataSource
): SessionMetadataDto => ({
  id: session.id,
  name: session.sessionName,
  algorithm: session.algorithm,
  createdAt: session.createdAt.toISOString(),
  completed: session.isCompleted,
  durationMs: session.durationMs,
  initialVoltage: session.initialVoltage,
  finalVoltage: session.finalVoltage,
});

export const toSessionStepDto = (step: SessionStepSource): SessionStepDto => ({
  id: step.id,
  stepOrder: step.stepOrder,
  posX: step.posX,
  posY: step.posY,
  voltage: step.voltage,
  current: step.current,
  createdAt: step.timestamp.toISOString(),
});

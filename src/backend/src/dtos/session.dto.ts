import type { Session, SessionStep } from "@prisma/client";

export type SessionMetadataDto = {
  id: string;
  name: string;
  algorithm: string;
  createdAt: string;
  completed: boolean;
  durationMs: number | null;
  avgSpeed: number | null;
  initialVoltage: number | null;
  finalVoltage: number | null;
  totalDrainMah: number | null; // CORREÇÃO: Alinhado com o Prisma
};

export type SensorData = {
  front: number;
  left: number;
  right: number;
};

export type SessionStepDto = {
  id: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  createdAt: string;
  sensors?: SensorData;
};

export type MazeCellDto = {
  posX: number;
  posY: number;
  wallNorth: boolean;
  wallSouth: boolean;
  wallEast: boolean;
  wallWest: boolean;
};

export type MazeDto = {
  id: string;
  name: string;
  width: number;
  height: number;
  cells: MazeCellDto[];
};

export type SessionDetailDto = SessionMetadataDto & {
  steps: SessionStepDto[];
  maze?: MazeDto;
};

// CORREÇÃO: "avgCurrent" removido do Pick, substituído por "totalDrainMah"
type SessionMetadataSource = Pick<
  Session,
  | "id"
  | "sessionName"
  | "algorithm"
  | "createdAt"
  | "isCompleted"
  | "durationMs"
  | "avgSpeed"
  | "initialVoltage"
  | "finalVoltage"
  | "totalDrainMah"
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
  avgSpeed: session.avgSpeed,
  initialVoltage: session.initialVoltage,
  finalVoltage: session.finalVoltage,
  totalDrainMah: session.totalDrainMah, // CORREÇÃO AQUI
});

type MazeSource = {
  id: string;
  name: string;
  width: number;
  height: number;
  cells: MazeCellDto[];
};

export const toMazeDto = (maze: MazeSource): MazeDto => ({
  id: maze.id,
  name: maze.name,
  width: maze.width,
  height: maze.height,
  cells: maze.cells,
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
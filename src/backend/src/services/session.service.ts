import type { Session, SessionStep } from "@prisma/client";
import type { TelemetryPayloadDto } from "../dtos/telemetry.dto";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import {
  findActiveSession,
  createSession,
  closeSession,
  findSessionWithSteps,
  findFirstStepOfSession,
} from "../repositories/session.repository";
import {
  createSessionStep,
  countStepsInSession,
  findStepsBySession,
} from "../repositories/session-step.repository";

type ProcessResult = {
  session: Session;
  step: SessionStep;
  isNewSession: boolean;
  isCompleted: boolean;
};

const resolveDefaultMazeId = async (): Promise<string> => {
  if (env.defaultMazeId) {
    return env.defaultMazeId;
  }
  const maze = await prisma.maze.findFirst({ orderBy: { createdAt: "asc" } });
  if (!maze) {
    throw new Error(
      "No maze found in database and DEFAULT_MAZE_ID is not set"
    );
  }
  return maze.id;
};

export const resolveActiveSession = async (
  robotId: string,
  payload: TelemetryPayloadDto
): Promise<{ session: Session; isNew: boolean }> => {
  const existing = await findActiveSession(robotId);
  if (existing) {
    return { session: existing, isNew: false };
  }

  if (payload.step !== 0 && payload.estado !== "EXPLORANDO") {
    throw new Error(
      `No active session for robot "${robotId}" and payload is not a session start (step=${payload.step}, estado=${payload.estado})`
    );
  }

  const mazeId = await resolveDefaultMazeId();
  const algorithm = payload.modo === "DFS" ? "DFS" : "Flood Fill";
  const mode = payload.modo === "DFS" ? "Exploração" : "Corrida";

  const session = await createSession({
    sessionName: `${robotId} — ${new Date().toISOString()}`,
    algorithm,
    mode,
    mazeId,
    startPosX: payload.posicao.x,
    startPosY: payload.posicao.y,
    initialVoltage: payload.energia.tensaoV,
  });

  console.log(
    `✅ New Session Created Automatically | id=${session.id} | robot=${robotId}`
  );

  return { session, isNew: true };
};

export const injectSessionStep = async (
  session: Session,
  payload: TelemetryPayloadDto
): Promise<SessionStep> => {
  const stepOrder = await countStepsInSession(session.id);
  return createSessionStep({
    sessionId: session.id,
    stepOrder,
    posX: payload.posicao.x,
    posY: payload.posicao.y,
    voltage: payload.energia.tensaoV,
    current: payload.energia.correnteMa,
    consumption: null,
  });
};

export const finalizeSession = async (
  session: Session,
  payload: TelemetryPayloadDto
): Promise<Session> => {
  const totalSteps = await countStepsInSession(session.id);
  const durationMs = payload.tempoMs;
  const avgSpeed = durationMs > 0 ? totalSteps / (durationMs / 1000) : 0;

  const firstStep = await findFirstStepOfSession(session.id);
  const initialVoltage = firstStep?.voltage ?? payload.energia.tensaoV;
  const finalVoltage = payload.energia.tensaoV;
  const drain = initialVoltage - finalVoltage;
  const totalDrainMah = drain > 0 ? drain : 0;

  const closed = await closeSession(session.id, {
    durationMs,
    avgSpeed,
    finalVoltage,
    totalDrainMah,
  });

  console.log(
    `🏁 Session Finalized | id=${session.id} | duration=${durationMs}ms | steps=${totalSteps} | avgSpeed=${avgSpeed.toFixed(2)}`
  );

  return closed;
};

export const processSessionStep = async (
  robotId: string,
  payload: TelemetryPayloadDto
): Promise<ProcessResult> => {
  const { session, isNew: isNewSession } = await resolveActiveSession(
    robotId,
    payload
  );

  const step = await injectSessionStep(session, payload);

  if (payload.conclusao) {
    const finalized = await finalizeSession(session, payload);
    return { session: finalized, step, isNewSession, isCompleted: true };
  }

  return { session, step, isNewSession, isCompleted: false };
};

export const getSessionReplay = async (
  sessionId: string
): Promise<(Session & { telemetrySteps: SessionStep[] }) | null> =>
  findSessionWithSteps(sessionId);

export const getOrderedSteps = async (
  sessionId: string
): Promise<SessionStep[]> => findStepsBySession(sessionId);

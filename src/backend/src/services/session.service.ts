import type { Session, SessionStep } from "@prisma/client";
import type { TelemetryPayloadDto } from "../dtos/telemetry.dto";
import { prisma } from "../lib/prisma";
import {
  findActiveSession,
  createSession,
  closeSession,
  findSessionWithSteps,
} from "../repositories/session.repository";
import { findStepsBySession } from "../repositories/session-step.repository";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ProcessResult = {
  session: Session;
  step: SessionStep | null;
  isNewSession: boolean;
  isCompleted: boolean;
};

// ---------------------------------------------------------------------------
// Buffer em memória: acumula payloads por robotId até conclusao=true
// ---------------------------------------------------------------------------

const stepBuffer = new Map<string, TelemetryPayloadDto[]>();

// ---------------------------------------------------------------------------
// Helpers privados
// ---------------------------------------------------------------------------

const resolveDefaultMazeId = async (): Promise<string> => {
  const maze = await prisma.maze.findFirst({ orderBy: { createdAt: "asc" } });
  if (!maze) {
    throw new Error("Nenhum Maze encontrado no banco.");
  }
  return maze.id;
};

// ---------------------------------------------------------------------------
// Funções exportadas
// ---------------------------------------------------------------------------

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

/**
 * Persiste todos os steps acumulados de uma vez via createMany.
 * stepOrder é determinado pela posição do payload no array do buffer.
 */
export const injectSessionStep = async (
  session: Session,
  payloads: TelemetryPayloadDto[]
): Promise<void> => {
  if (payloads.length === 0) return;

  await prisma.sessionStep.createMany({
    data: payloads.map((p, index) => ({
      sessionId: session.id,
      stepOrder: index,
      posX: p.posicao.x,
      posY: p.posicao.y,
      voltage: p.energia.tensaoV,
      current: p.energia.correnteMa,
      consumption: null,
    })),
  });
};

/**
 * Consolida as métricas da sessão usando os dados já disponíveis no buffer,
 * sem consultas adicionais ao banco.
 */
export const finalizeSession = async (
  session: Session,
  payload: TelemetryPayloadDto,
  totalSteps: number,
  initialVoltage: number
): Promise<Session> => {
  const durationMs = payload.tempoMs;
  const avgSpeed = durationMs > 0 ? totalSteps / (durationMs / 1000) : 0;

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

/**
 * Orquestra o ciclo de vida completo de uma sessão:
 * - Acumula payloads em memória enquanto conclusao=false
 * - Quando conclusao=true: flush em lote → finaliza sessão → limpa buffer
 */
export const processSessionStep = async (
  robotId: string,
  payload: TelemetryPayloadDto
): Promise<ProcessResult> => {
  const { session, isNew: isNewSession } = await resolveActiveSession(
    robotId,
    payload
  );

  // Acumula sempre (inclusive o payload com conclusao=true)
  const buffer = stepBuffer.get(robotId) ?? [];
  buffer.push(payload);
  stepBuffer.set(robotId, buffer);

  if (!payload.conclusao) {
    return { session, step: null, isNewSession, isCompleted: false };
  }

  // --- Flush ---
  const buffered = stepBuffer.get(robotId) ?? [];
  const totalSteps = buffered.length;
  const initialVoltage = buffered[0]?.energia.tensaoV ?? payload.energia.tensaoV;

  await injectSessionStep(session, buffered);

  const finalized = await finalizeSession(
    session,
    payload,
    totalSteps,
    initialVoltage
  );

  stepBuffer.delete(robotId);

  return { session: finalized, step: null, isNewSession, isCompleted: true };
};

// ---------------------------------------------------------------------------
// Queries de replay
// ---------------------------------------------------------------------------

export const getSessionReplay = async (
  sessionId: string
): Promise<(Session & { telemetrySteps: SessionStep[] }) | null> =>
  findSessionWithSteps(sessionId);

export const getOrderedSteps = async (
  sessionId: string
): Promise<SessionStep[]> => findStepsBySession(sessionId);

import type { SessionStep, TelemetryRaw } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { TelemetryPayloadDto } from "../dtos/telemetry.dto";
import { validateTelemetryPayload } from "../dtos/telemetry.dto";
import { prisma } from "../lib/prisma";
import { findOrCreateDefaultMaze } from "../repositories/maze.repository";
import { createConsolidatedSession } from "../repositories/session.repository";
import {
  createOrphanSessionStep,
  findOrphanSteps,
  findOrphanStepsLimited,
  linkOrphanStepsToSession,
} from "../repositories/session-step.repository";
import {
  createTelemetry,
  getTelemetryById,
  listTelemetry,
} from "../repositories/telemetry.repository";
import { emitTelemetry, getSocket } from "../websocket/socket";

type ParsedTelemetry = {
  payload: unknown;
  robotId?: string;
  validatedPayload?: TelemetryPayloadDto;
};

type ActiveRunContext = {
  algorithm: string;
  mode: string;
  mazeId: string;
};

let activeRunContext: ActiveRunContext | null = null;

const CELL_SIZE_CM = 18;

const computeTotalDistanceCm = (steps: SessionStep[]): number => {
  let total = 0;

  for (let i = 1; i < steps.length; i++) {
    const dx = Math.abs(steps[i].posX - steps[i - 1].posX);
    const dy = Math.abs(steps[i].posY - steps[i - 1].posY);
    total += (dx + dy) * CELL_SIZE_CM;
  }

  return total;
};

const computeAvgSpeedCmPerSecond = (
  steps: SessionStep[],
  durationMs: number
): number => {
  if (durationMs <= 0 || steps.length === 0) {
    return 0;
  }

  return computeTotalDistanceCm(steps) / (durationMs / 1000);
};

const computeAvgCurrentMa = (steps: SessionStep[]): number => {
  if (steps.length === 0) {
    return 0;
  }

  const totalCurrent = steps.reduce((sum, step) => sum + step.current, 0);
  return totalCurrent / steps.length;
};

export const resetTelemetryRunContextForTests = (): void => {
  activeRunContext = null;
};

const parsePayload = (buffer: Buffer): ParsedTelemetry => {
  const raw = buffer.toString("utf-8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    const robotId =
      typeof parsed === "object" &&
      parsed !== null &&
      "robotId" in parsed &&
      typeof (parsed as { robotId?: unknown }).robotId === "string"
        ? (parsed as { robotId: string }).robotId
        : undefined;

    const validation = validateTelemetryPayload(parsed);
    if (!validation.isValid) {
      console.log("❌ ERRO DE VALIDAÇÃO DO DTO:", validation.errors);
      return {
        payload: { validationErrors: validation.errors },
        robotId,
      };
    }
    return { payload: validation.payload, robotId };
  } catch {
    return { payload: { raw } };
  }
};

const ensureActiveRunContext = async (
  espData: TelemetryPayloadDto
): Promise<ActiveRunContext> => {
  if (activeRunContext) {
    return activeRunContext;
  }

  const maze = await findOrCreateDefaultMaze();
  activeRunContext = {
    algorithm: espData.modo,
    mode: espData.estado,
    mazeId: maze.id,
  };

  return activeRunContext;
};

export const recordOrphanTelemetryStep = async (
  espData: TelemetryPayloadDto
) => {
  await ensureActiveRunContext(espData);

  const stepRecord = await createOrphanSessionStep({
    stepOrder: espData.step,
    posX: espData.posicao.x,
    posY: espData.posicao.y,
    voltage: espData.energia.tensaoV,
    current: espData.energia.correnteMa,
  });

  try {
    const io = getSocket();
    const enrichedPayload = {
      ...stepRecord,
      sensors: espData.sensores
        ? {
            front: espData.sensores.frenteCm,
            left: espData.sensores.esquerdaCm,
            right: espData.sensores.direitaCm,
          }
        : { front: 0, left: 0, right: 0 },
      walls: espData.paredes
        ? {
            north: espData.paredes.norte,
            south: espData.paredes.sul,
            east: espData.paredes.leste,
            west: espData.paredes.oeste,
          }
        : { north: false, south: false, east: false, west: false },
      conclusao: espData.conclusao,
      estado: espData.estado,
      modo: espData.modo,
    };

    // Emite o payload completo enriquecido para o useWebSocket do React escutar
    io.emit("telemetry:step", enrichedPayload);
  } catch (wsError) {
    console.error(
      "[WS_STREAM_ERROR] Servidor WS não inicializado ou falhou ao emitir:",
      wsError
    );
  }

  return stepRecord;
};

export const consolidateSession = async (
  espData: TelemetryPayloadDto
): Promise<string | null> => {
  const runContext = await ensureActiveRunContext(espData);

  return prisma.$transaction(async (tx) => {
    const orphanSteps = await findOrphanSteps(tx);

    if (orphanSteps.length === 0) {
      return null;
    }

    const firstStep = orphanSteps[0];
    const lastStep = orphanSteps[orphanSteps.length - 1];
    const durationMs = lastStep.timestamp.getTime() - firstStep.timestamp.getTime();
    const avgSpeed = computeAvgSpeedCmPerSecond(orphanSteps, durationMs);
    const avgCurrent = computeAvgCurrentMa(orphanSteps);

    // 🚀 ADICIONADO: Pega o sessionName customizado se existir no payload (ex: "Teste - 1234")
    // Fazemos um casting para any pois o sessionName é injetado pelo simulador, não está no DTO oficial
    const customSessionName = (espData as any).sessionName;

    const session = await createConsolidatedSession(
      {
        sessionName: customSessionName || `Corrida - ${new Date().toLocaleString("pt-BR")}`,
        algorithm: runContext.algorithm,
        mode: runContext.mode,
        mazeId: runContext.mazeId,
        durationMs,
        avgSpeed,
        initialVoltage: firstStep.voltage,
        finalVoltage: lastStep.voltage,
        avgCurrent,
        startPosX: firstStep.posX,
        startPosY: firstStep.posY,
      },
      tx
    );

    await linkOrphanStepsToSession(session.id, tx);
    activeRunContext = null;

    console.log(`[CONSOLIDATE] 🏁 Sessão [${session.id}] gerada em lote com ${orphanSteps.length} passos.`);

    return session.id;
  });
};

export const storeTelemetry = async (
  topic: string,
  payload: Buffer
): Promise<TelemetryRaw> => {
  const parsed = parsePayload(payload);

  const created = await createTelemetry({
    topic,
    payload: parsed.payload as Prisma.InputJsonValue,
    robotId: parsed.robotId,
  });

  emitTelemetry(created);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let espData = parsed.payload as any;
  if (espData && espData.validationErrors) {
    try {
      espData = JSON.parse(payload.toString("utf-8"));
    } catch {
      console.error("❌ Falha crítica ao ler JSON de contingência da ESP32");
      return created;
    }
  }

  if (espData && !espData.validationErrors) {
    try {
      await recordOrphanTelemetryStep(espData as TelemetryPayloadDto);

      if ((espData as TelemetryPayloadDto).conclusao === true) {
        const sessionId = await consolidateSession(espData as TelemetryPayloadDto);
        if (sessionId) {
          console.log(
            `[AUTO-STOP] 🏁 Robô concluiu o labirinto. Métrica unificada na Session: [${sessionId}]`
          );
        }
      }
    } catch (dbError) {
      console.error(
        "❌ Erro ao processar regras de Session/SessionStep no banco:",
        dbError
      );
    }
  }

  return created;
};

export const getRecentTelemetry = async (
  limit: number
): Promise<TelemetryRaw[]> => listTelemetry(limit);

export const getTelemetryByIdService = async (
  id: string
): Promise<TelemetryRaw | null> => getTelemetryById(id);

export const getOrphanStepsForReplay = async (limit: number) =>
  findOrphanStepsLimited(limit);

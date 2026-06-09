import type { TelemetryRaw } from "@prisma/client";
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
    io.emit("telemetry:step", stepRecord);
    io.emit("telemetry:subscribe", stepRecord);
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
    const durationMs =
      lastStep.timestamp.getTime() - firstStep.timestamp.getTime();

    const session = await createConsolidatedSession(
      {
        sessionName: `Corrida - ${new Date().toLocaleString("pt-BR")}`,
        algorithm: runContext.algorithm,
        mode: runContext.mode,
        mazeId: runContext.mazeId,
        durationMs,
        initialVoltage: firstStep.voltage,
        finalVoltage: lastStep.voltage,
        startPosX: firstStep.posX,
        startPosY: firstStep.posY,
      },
      tx
    );

    await linkOrphanStepsToSession(session.id, tx);

    activeRunContext = null;

    console.log(
      `[CONSOLIDATE] 🏁 Sessão [${session.id}] gerada em lote com ${orphanSteps.length} passos.`
    );

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

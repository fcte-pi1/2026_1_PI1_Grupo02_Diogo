import type { TelemetryRaw } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { TelemetryPayloadDto } from "../dtos/telemetry.dto";
import { validateTelemetryPayload } from "../dtos/telemetry.dto";
import { prisma } from "../lib/prisma";
import {
  createTelemetry,
  getTelemetryById,
  listTelemetry,
} from "../repositories/telemetry.repository";
import { emitTelemetry, getSocket } from "../websocket/socket";

type ParsedTelemetry = {
  payload: unknown;
  robotId?: string;
};

type ActiveRunContext = {
  algorithm: string;
  mode: string;
  mazeId: string;
};

let activeRunContext: ActiveRunContext | null = null;

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

const ensureDefaultMaze = async (): Promise<string> => {
  let maze = await prisma.maze.findFirst();
  if (!maze) {
    maze = await prisma.maze.create({
      data: { name: "Labirinto padrão", width: 16, height: 16 },
    });
  }
  return maze.id;
};

const ensureActiveRunContext = async (
  espData: TelemetryPayloadDto
): Promise<ActiveRunContext> => {
  if (activeRunContext) {
    return activeRunContext;
  }

  const mazeId = await ensureDefaultMaze();
  activeRunContext = {
    algorithm: espData.modo || "DFS",
    mode: espData.estado || "Exploração",
    mazeId,
  };

  return activeRunContext;
};

export const recordOrphanTelemetryStep = async (
  espData: TelemetryPayloadDto
): Promise<any> => {
  await ensureActiveRunContext(espData);

  const stepRecord = await prisma.sessionStep.create({
    data: {
      sessionId: null as any, 
      stepOrder: Number(espData.step ?? 0),
      posX: Number(espData.posicao?.x ?? 0),
      posY: Number(espData.posicao?.y ?? 0),
      voltage: Number(espData.energia?.tensaoV ?? 0),
      current: Number(espData.energia?.correnteMa ?? 0),
    } as any,
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
    const orphanSteps = await tx.sessionStep.findMany({
      where: { 
        sessionId: {
          equals: null as any
        }
      },
      orderBy: { stepOrder: "asc" },
    });

    if (orphanSteps.length === 0) {
      return null;
    }

    const firstStep = orphanSteps[0];
    const lastStep = orphanSteps[orphanSteps.length - 1];
    const durationMs = lastStep.timestamp.getTime() - firstStep.timestamp.getTime();

    const session = await tx.session.create({
      data: {
        sessionName: `Corrida Consolidada - ${new Date().toLocaleString("pt-BR")}`,
        algorithm: runContext.algorithm,
        mode: runContext.mode,
        mazeId: runContext.mazeId,
        isCompleted: true,
        durationMs,
        initialVoltage: firstStep.voltage,
        finalVoltage: lastStep.voltage,
        startPosX: firstStep.posX,
        startPosY: firstStep.posY,
      },
    });

    await tx.sessionStep.updateMany({
      where: { 
        sessionId: {
          equals: null as any
        }
      },
      data: { sessionId: session.id },
    });

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
      await recordOrphanTelemetryStep(espData);

      if (espData.conclusao === true) {
        const sessionId = await consolidateSession(espData);
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
  prisma.sessionStep.findMany({
    where: { 
      sessionId: {
        equals: null as any
      }
    },
    orderBy: { stepOrder: "asc" },
    take: limit,
  });
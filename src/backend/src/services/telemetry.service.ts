import type { Prisma, TelemetryRaw } from "@prisma/client";
import { emitTelemetry } from "../websocket/socket";
import {
  createTelemetry,
  getTelemetryById,
  listTelemetry,
} from "../repositories/telemetry.repository";

type ParsedTelemetry = {
  payload: Prisma.InputJsonValue;
  robotId?: string;
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
    return { payload: parsed as Prisma.InputJsonValue, robotId };
  } catch {
    return { payload: { raw } as Prisma.InputJsonValue };
  }
};

export const storeTelemetry = async (
  topic: string,
  payload: Buffer
): Promise<TelemetryRaw> => {
  const parsed = parsePayload(payload);
  const created = await createTelemetry({
    topic,
    payload: parsed.payload,
    robotId: parsed.robotId,
  });
  emitTelemetry(created);
  return created;
};

export const getRecentTelemetry = async (
  limit: number
): Promise<TelemetryRaw[]> => listTelemetry(limit);

export const getTelemetryByIdService = async (
  id: string
): Promise<TelemetryRaw | null> => getTelemetryById(id);

import type { Telemetry } from "@prisma/client";
import { emitTelemetry } from "../websocket/socket";
import {
  createTelemetry,
  getTelemetryById,
  listTelemetry,
} from "../repositories/telemetry.repository";

type ParsedTelemetry = {
  payload: unknown;
  robotId?: string;
};

const parsePayload = (buffer: Buffer): ParsedTelemetry => {
  const raw = buffer.toString("utf-8");
  try {
    const parsed = JSON.parse(raw) as { robotId?: unknown };
    const robotId =
      typeof parsed?.robotId === "string" ? parsed.robotId : undefined;
    return { payload: parsed, robotId };
  } catch {
    return { payload: { raw } };
  }
};

export const storeTelemetry = async (
  topic: string,
  payload: Buffer
): Promise<Telemetry> => {
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
): Promise<Telemetry[]> => listTelemetry(limit);

export const getTelemetryByIdService = async (
  id: string
): Promise<Telemetry | null> => getTelemetryById(id);

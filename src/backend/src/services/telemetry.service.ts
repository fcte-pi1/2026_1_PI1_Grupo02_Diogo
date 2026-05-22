import type { Prisma, Telemetry } from "@prisma/client";
import { emitTelemetry } from "../websocket/socket";
import { validateTelemetryPayload } from "../dtos/telemetry.dto";
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
    const validation = validateTelemetryPayload(parsed);
    if (!validation.isValid) {
      return {
        payload: {
          raw: parsed,
          validationErrors: validation.errors,
        } as Prisma.InputJsonValue,
        robotId,
      };
    }
    return { payload: validation.payload as Prisma.InputJsonValue, robotId };
  } catch {
    return { payload: { raw } as Prisma.InputJsonValue };
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

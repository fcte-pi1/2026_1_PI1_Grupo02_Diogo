import type { Prisma, TelemetryRaw } from "@prisma/client";
import { emitTelemetry } from "../websocket/socket";
import { validateTelemetryPayload, type TelemetryPayloadDto } from "../dtos/telemetry.dto";
import {
  createTelemetry,
  getTelemetryById,
  listTelemetry,
} from "../repositories/telemetry.repository";
import { processSessionStep } from "./session.service";

type ParsedTelemetry = {
  payload: Prisma.InputJsonValue;
  robotId?: string;
  validatedPayload?: TelemetryPayloadDto;
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
    return {
      payload: validation.payload as Prisma.InputJsonValue,
      robotId,
      validatedPayload: validation.payload,
    };
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

  if (parsed.validatedPayload && parsed.robotId) {
    try {
      const result = await processSessionStep(
        parsed.robotId,
        parsed.validatedPayload
      );
      if (result.isNewSession) {
        console.log(
          `📋 [Session] New session started | id=${result.session.id}`
        );
      }
      if (result.isCompleted) {
        console.log(
          `🏁 [Session] Session completed | id=${result.session.id}`
        );
      }
    } catch (error) {
      console.error("[Session Pipeline] Non-fatal error:", error);
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

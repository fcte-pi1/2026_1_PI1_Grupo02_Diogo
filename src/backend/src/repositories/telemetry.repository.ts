import type { Prisma, TelemetryRaw } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const createTelemetry = async (
  data: Prisma.TelemetryRawCreateInput
): Promise<TelemetryRaw> => prisma.telemetryRaw.create({ data });

export const listTelemetry = async (limit: number): Promise<TelemetryRaw[]> =>
  prisma.telemetryRaw.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const getTelemetryById = async (
  id: string
): Promise<TelemetryRaw | null> =>
  prisma.telemetryRaw.findUnique({
    where: { id },
  });

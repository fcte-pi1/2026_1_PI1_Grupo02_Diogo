import type { Prisma, Telemetry } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const createTelemetry = async (
  data: Prisma.TelemetryCreateInput
): Promise<Telemetry> => prisma.telemetry.create({ data });

export const listTelemetry = async (limit: number): Promise<Telemetry[]> =>
  prisma.telemetry.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const getTelemetryById = async (
  id: string
): Promise<Telemetry | null> =>
  prisma.telemetry.findUnique({
    where: { id },
  });

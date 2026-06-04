import type { Prisma, SessionStep } from "@prisma/client";
import { prisma } from "../lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

type CreateSessionStepData = {
  sessionId: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  consumption?: number | null;
};

type CreateOrphanStepData = {
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
};

export const createSessionStep = async (
  data: CreateSessionStepData,
  client: DbClient = prisma
): Promise<SessionStep> => client.sessionStep.create({ data });

export const createOrphanSessionStep = async (
  data: CreateOrphanStepData,
  client: DbClient = prisma
): Promise<SessionStep> =>
  client.sessionStep.create({
    data: {
      sessionId: null,
      ...data,
    },
  });

export const countStepsInSession = async (
  sessionId: string
): Promise<number> => prisma.sessionStep.count({ where: { sessionId } });

export const findStepsBySession = async (
  sessionId: string
): Promise<SessionStep[]> =>
  prisma.sessionStep.findMany({
    where: { sessionId },
    orderBy: { stepOrder: "asc" },
  });

export const findOrphanSteps = async (
  client: DbClient = prisma
): Promise<SessionStep[]> =>
  client.sessionStep.findMany({
    where: { sessionId: null },
    orderBy: { stepOrder: "asc" },
  });

export const findOrphanStepsLimited = async (
  limit: number
): Promise<SessionStep[]> =>
  prisma.sessionStep.findMany({
    where: { sessionId: null },
    orderBy: { stepOrder: "asc" },
    take: limit,
  });

export const linkOrphanStepsToSession = async (
  sessionId: string,
  client: DbClient = prisma
): Promise<void> => {
  await client.sessionStep.updateMany({
    where: { sessionId: null },
    data: { sessionId },
  });
};

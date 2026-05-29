import type { SessionStep } from "@prisma/client";
import { prisma } from "../lib/prisma";

type CreateSessionStepData = {
  sessionId: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  consumption?: number | null;
};

export const createSessionStep = async (
  data: CreateSessionStepData
): Promise<SessionStep> => prisma.sessionStep.create({ data });

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

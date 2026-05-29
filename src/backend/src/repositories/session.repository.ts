import type { Session, SessionStep } from "@prisma/client";
import { prisma } from "../lib/prisma";

type CreateSessionData = {
  sessionName: string;
  algorithm: string;
  mode: string;
  mazeId: string;
  startPosX?: number;
  startPosY?: number;
  initialVoltage?: number;
};

type CloseSessionData = {
  durationMs: number;
  avgSpeed: number;
  finalVoltage: number;
  totalDrainMah: number;
};

export const findActiveSession = async (
  robotId: string
): Promise<Session | null> =>
  prisma.session.findFirst({
    where: {
      isCompleted: false,
      sessionName: { contains: robotId },
    },
  });

export const createSession = async (
  data: CreateSessionData
): Promise<Session> => prisma.session.create({ data });

export const closeSession = async (
  sessionId: string,
  data: CloseSessionData
): Promise<Session> =>
  prisma.session.update({
    where: { id: sessionId },
    data: { ...data, isCompleted: true },
  });

export const findSessionWithSteps = async (
  sessionId: string
): Promise<(Session & { telemetrySteps: SessionStep[] }) | null> =>
  prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      telemetrySteps: { orderBy: { stepOrder: "asc" } },
    },
  });

export const findFirstStepOfSession = async (
  sessionId: string
): Promise<SessionStep | null> =>
  prisma.sessionStep.findFirst({
    where: { sessionId },
    orderBy: { stepOrder: "asc" },
  });

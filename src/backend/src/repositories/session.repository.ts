import type { Prisma, Session, SessionStep } from "@prisma/client";
import { prisma } from "../lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export const sessionMetadataSelect = {
  id: true,
  sessionName: true,
  algorithm: true,
  createdAt: true,
  isCompleted: true,
  durationMs: true,
  initialVoltage: true,
  finalVoltage: true,
} satisfies Prisma.SessionSelect;

export type SessionMetadataRecord = Prisma.SessionGetPayload<{
  select: typeof sessionMetadataSelect;
}>;

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

type CreateConsolidatedSessionData = {
  sessionName: string;
  algorithm: string;
  mode: string;
  mazeId: string;
  durationMs: number;
  initialVoltage: number;
  finalVoltage: number;
  startPosX: number;
  startPosY: number;
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
  data: CreateSessionData,
  client: DbClient = prisma
): Promise<Session> => client.session.create({ data });

export const createConsolidatedSession = async (
  data: CreateConsolidatedSessionData,
  client: DbClient = prisma
): Promise<Session> =>
  client.session.create({
    data: {
      ...data,
      isCompleted: true,
    },
  });

export const closeSession = async (
  sessionId: string,
  data: CloseSessionData
): Promise<Session> =>
  prisma.session.update({
    where: { id: sessionId },
    data: { ...data, isCompleted: true },
  });

export const findManySessionMetadata = async (): Promise<
  SessionMetadataRecord[]
> =>
  prisma.session.findMany({
    select: sessionMetadataSelect,
    orderBy: { createdAt: "desc" },
  });

export const findSessionMetadataById = async (
  id: string
): Promise<SessionMetadataRecord | null> =>
  prisma.session.findUnique({
    where: { id },
    select: sessionMetadataSelect,
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

export const findSessionDetailWithSteps = async (id: string) =>
  prisma.session.findUnique({
    where: { id },
    select: {
      ...sessionMetadataSelect,
      telemetrySteps: {
        orderBy: { stepOrder: "asc" },
        select: {
          id: true,
          stepOrder: true,
          posX: true,
          posY: true,
          voltage: true,
          current: true,
          timestamp: true,
        },
      },
    },
  });

export const sessionExists = async (id: string): Promise<boolean> => {
  const session = await prisma.session.findUnique({
    where: { id },
    select: { id: true },
  });
  return session !== null;
};

export const deleteSessionById = async (id: string): Promise<void> => {
  await prisma.session.delete({ where: { id } });
};

export const findFirstStepOfSession = async (
  sessionId: string
): Promise<SessionStep | null> =>
  prisma.sessionStep.findFirst({
    where: { sessionId },
    orderBy: { stepOrder: "asc" },
  });

export const findActiveSessionWithSteps = async (limit: number) =>
  prisma.session.findFirst({
    where: { isCompleted: false },
    include: {
      telemetrySteps: {
        orderBy: { stepOrder: "asc" },
        take: limit,
      },
    },
  });

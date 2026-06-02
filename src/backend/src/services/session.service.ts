import type { Prisma } from "@prisma/client";
import {
  toSessionMetadataDto,
  toSessionStepDto,
  type SessionDetailDto,
  type SessionMetadataDto,
} from "../dtos/session.dto";
import { prisma } from "../lib/prisma";

const sessionMetadataSelect = {
  id: true,
  sessionName: true,
  algorithm: true,
  createdAt: true,
  isCompleted: true,
  durationMs: true,
  initialVoltage: true,
  finalVoltage: true,
} satisfies Prisma.SessionSelect;

export const listSessionMetadata = async (): Promise<SessionMetadataDto[]> => {
  const sessions = await prisma.session.findMany({
    select: sessionMetadataSelect,
    orderBy: { createdAt: "desc" },
  });

  return sessions.map(toSessionMetadataDto);
};

export const getSessionDetail = async (
  id: string
): Promise<SessionDetailDto | null> => {
  const session = await prisma.session.findUnique({
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

  if (!session) {
    return null;
  }

  const { telemetrySteps, ...metadata } = session;

  return {
    ...toSessionMetadataDto(metadata),
    steps: telemetrySteps.map(toSessionStepDto),
  };
};

export const deleteSession = async (id: string): Promise<boolean> => {
  const existing = await prisma.session.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.session.delete({ where: { id } });
  return true;
};

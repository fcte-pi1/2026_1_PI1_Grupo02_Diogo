import {
  toSessionMetadataDto,
  toSessionStepDto,
  type SessionDetailDto,
  type SessionMetadataDto,
} from "../dtos/session.dto";
import {
  deleteSessionById,
  findManySessionMetadata,
  findSessionDetailWithSteps,
  sessionExists,
} from "../repositories/session.repository";

export const listSessionMetadata = async (): Promise<SessionMetadataDto[]> => {
  const sessions = await findManySessionMetadata();
  return sessions.map(toSessionMetadataDto);
};

export const getSessionDetail = async (
  id: string
): Promise<SessionDetailDto | null> => {
  const session = await findSessionDetailWithSteps(id);

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
  const exists = await sessionExists(id);
  if (!exists) {
    return false;
  }

  await deleteSessionById(id);
  return true;
};

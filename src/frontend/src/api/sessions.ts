import { apiRequest } from "./client";
import type {
  SessionDetail,
  SessionListResponse,
  SessionMetadata,
} from "../types/session";

export const listSessions = (): Promise<SessionListResponse> =>
  apiRequest<SessionListResponse>("/api/sessions");

export const getSessionById = (id: string): Promise<SessionDetail> =>
  apiRequest<SessionDetail>(`/api/sessions/${id}`);

export const deleteSession = (id: string): Promise<void> =>
  apiRequest<void>(`/api/sessions/${id}`, { method: "DELETE" });

export type { SessionDetail, SessionMetadata };

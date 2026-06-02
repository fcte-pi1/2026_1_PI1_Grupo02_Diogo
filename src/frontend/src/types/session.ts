export interface SessionMetadata {
  id: string;
  name: string;
  algorithm: string;
  createdAt: string;
  completed: boolean;
  durationMs: number | null;
  initialVoltage: number | null;
  finalVoltage: number | null;
}

export interface SessionStep {
  id: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  createdAt: string;
}

export interface SessionDetail extends SessionMetadata {
  steps: SessionStep[];
}

export interface SessionListResponse {
  items: SessionMetadata[];
  count: number;
}

export interface TelemetryStep {
  id: string;
  sessionId: string;
  timestamp: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  consumption?: number;
}

export const buildTelemetryStep = (
  overrides: Partial<TelemetryStep> = {}
): TelemetryStep => ({
  id: "step-1",
  sessionId: "session-e2e",
  timestamp: new Date().toISOString(),
  stepOrder: 1,
  posX: 0,
  posY: 0,
  voltage: 11.5,
  current: 240,
  ...overrides,
});

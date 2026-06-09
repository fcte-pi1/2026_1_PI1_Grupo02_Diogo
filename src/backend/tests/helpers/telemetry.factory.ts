import type { TelemetryPayloadDto } from "../../src/dtos/telemetry.dto";

export const createValidTelemetryPayload = (
  overrides: Partial<TelemetryPayloadDto> = {}
): TelemetryPayloadDto => ({
  step: 1,
  tempoMs: 1000,
  modo: "DFS",
  estado: "EXPLORANDO",
  posicao: { x: 0, y: 0 },
  direcao: "norte",
  paredes: { norte: false, sul: true, leste: false, oeste: true },
  motores: { pwmEsquerdo: 120, pwmDireito: 120 },
  sensores: { esquerdaCm: 10, frenteCm: 5, direitaCm: 12 },
  energia: { tensaoV: 11.5, correnteMa: 250 },
  conclusao: false,
  ...overrides,
});

export const telemetryPayloadToBuffer = (
  payload: TelemetryPayloadDto | Record<string, unknown>
): Buffer => Buffer.from(JSON.stringify(payload), "utf-8");

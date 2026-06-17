export const createValidTelemetryPayload = (overrides = {}) => ({
  step: 1,
  tempoMs: 1500,
  modo: "DFS",
  estado: "EXPLORANDO",
  conclusao: false,
  posicao: { x: 0, y: 0 },
  direcao: "norte",
  paredes: { norte: false, sul: false, leste: false, oeste: false },
  energia: { tensaoV: 11.1, correnteMa: 220 },
  motores: { pwmEsquerdo: 200, pwmDireito: 200 },
  sensores: { frenteCm: 10, esquerdaCm: 12, direitaCm: 12 },
  robotId: "UAV-MOUSE-01",
  ...overrides,
});

export const telemetryPayloadToBuffer = (payload: any) => {
  return Buffer.from(JSON.stringify(payload), "utf-8");
};

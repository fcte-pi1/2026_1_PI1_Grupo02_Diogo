import { z } from "zod";

export const telemetryPayloadSchema = z.object({
  step: z.number(),
  tempoMs: z.number(),
  modo: z.enum(["DFS", "FLOOD FILL", "CORRIDA"]),
  estado: z.enum([
    "PARADO",
    "EXPLORANDO",
    "ERRO",
    "FINALIZADO",
  ]),
  posicao: z.object({
    x: z.number(),
    y: z.number(),
  }),
  direcao: z.enum(["norte", "sul", "leste", "oeste"]),
  ultimoMovimento: z.enum([
    "frente",
    "curva_a_esquerda",
    "curva_a_direita",
    "meia_volta",
  ]).optional(),
  paredes: z.object({
    norte: z.boolean(),
    sul: z.boolean(),
    leste: z.boolean(),
    oeste: z.boolean(),
  }),
  motores: z.object({
    pwmEsquerdo: z.number(),
    pwmDireito: z.number(),
  }),
  sensores: z.object({
    esquerdaCm: z.number(),
    frenteCm: z.number(),
    direitaCm: z.number(),
  }),
  energia: z.object({
    tensaoV: z.number(),
    correnteMa: z.number(),
  }),
  conclusao: z.boolean(),
  robotId: z.string().min(1).optional(),
});

export type TelemetryPayloadDto = z.infer<typeof telemetryPayloadSchema>;

type TelemetryPayloadValidationResult = {
  isValid: boolean;
  errors: string[];
  payload?: TelemetryPayloadDto;
};

export const validateTelemetryPayload = (
  value: unknown
): TelemetryPayloadValidationResult => {
  const result = telemetryPayloadSchema.safeParse(value);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "payload";
      return `${path}: ${issue.message}`;
    });
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [], payload: result.data };
};

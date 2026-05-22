import { z } from "zod";

export const telemetryPayloadSchema = z.object({
  step: z.number().finite(),
  tempoMs: z.number().finite(),
  modo: z.enum(["DFS", "FLOOD FILL"]),
  estado: z.enum([
    "PARADO",
    "EXPLORANDO",
    "CORRIDA_RAPIDA",
    "ERRO",
    "FINALIZADO",
  ]),
  posicao: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  direcao: z.enum(["norte", "sul", "leste", "oeste"]),
  ultimoMovimento: z.enum([
    "frente",
    "curva_a_esquerda",
    "curva_a_direita",
    "meia_volta",
  ]),
  paredes: z.object({
    norte: z.boolean(),
    sul: z.boolean(),
    leste: z.boolean(),
    oeste: z.boolean(),
  }),
  motores: z.object({
    rpmEsquerdo: z.number().finite(),
    rpmDireito: z.number().finite(),
  }),
  sensores: z.object({
    esquerdaCm: z.number().finite(),
    frenteCm: z.number().finite(),
    direitaCm: z.number().finite(),
  }),
  energia: z.object({
    tensaoV: z.number().finite(),
    correnteMa: z.number().finite(),
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

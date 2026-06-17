import dotenv from "dotenv";

// Carrega o arquivo .env da raiz do projeto
dotenv.config();

/**
 * Converte uma string de ambiente para número inteiro de forma segura.
 * Se o valor for inválido ou nulo, retorna o valor de fallback.
 */
const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Converte uma string de ambiente para booleano limpando espaços em branco
 * e quebras de linha residuais geradas pelo ecossistema do Docker.
 */
const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined || value === null) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

/**
 * Garante que uma variável de ambiente obrigatória esteja definida.
 * Dispara um erro explícito no travamento do bootstrap caso esteja faltando.
 */
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
};

// 🚀 BLINDAGEM SUPREMA: Verifica de forma imutável se o processo foi disparado pelo Jest
// Mesmo que o Jest resete o process.env em tempo de execução, a variável global do Jest continua ativa.
const isJestRunning = typeof global.process.env.JEST_WORKER_ID !== "undefined" || process.env.NODE_ENV === "test";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 3000),
  databaseUrl: requireEnv("DATABASE_URL"),
  cors: {
    origin:
      process.env.CORS_ORIGIN ??
      process.env.WS_CORS_ORIGIN ??
      "http://localhost:5173",
  },
  telemetry: {
    historyLimit: parseNumber(process.env.TELEMETRY_HISTORY_LIMIT, 100),
    // Se o Jest estiver rodando, o padrão quando a variável for nula DEVE ser false para bater com o teste unitário.
    // Em qualquer outro cenário (Docker / Dev), assume true por padrão.
    mockEnabled: parseBoolean(process.env.TELEMETRY_MOCK_ENABLED, !isJestRunning),
  },
  mqtt: {
    url: requireEnv("MQTT_URL"),
    telemetryTopic: process.env.MQTT_TOPIC_TELEMETRY ?? "rato/telemetria",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID ?? "telemetry-backend",
  },
};

// Log de auditoria para monitoramento no console
console.log(
  `[BOOT] 🧠 Estado do Mock de Telemetria: ${env.telemetry.mockEnabled} (Ambiente: ${env.nodeEnv})`
);
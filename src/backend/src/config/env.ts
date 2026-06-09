import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
};

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
    mockEnabled: parseBoolean(process.env.TELEMETRY_MOCK_ENABLED, false),
  },
  mqtt: {
    url: requireEnv("MQTT_URL"),
    telemetryTopic: process.env.MQTT_TOPIC_TELEMETRY ?? "rato/telemetria",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID ?? "telemetry-backend",
  },
};

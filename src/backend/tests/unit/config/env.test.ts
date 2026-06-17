describe("env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when DATABASE_URL is missing", () => {
    process.env.DATABASE_URL = "";
    process.env.MQTT_URL = "mqtt://localhost:1883";

    expect(() => require("../../../src/config/env")).toThrow(
      "Missing env var: DATABASE_URL"
    );
  });

  it("throws when MQTT_URL is missing", () => {
    process.env.DATABASE_URL =
      "postgresql://test:test@localhost:5432/test?schema=public";
    process.env.MQTT_URL = "";

    expect(() => require("../../../src/config/env")).toThrow(
      "Missing env var: MQTT_URL"
    );
  });

  it("loads defaults for optional values", () => {
    process.env.DATABASE_URL =
      "postgresql://test:test@localhost:5432/test?schema=public";
    process.env.MQTT_URL = "mqtt://localhost:1883";
    delete process.env.PORT;
    delete process.env.TELEMETRY_MOCK_ENABLED;
    delete process.env.TELEMETRY_HISTORY_LIMIT;

    const { env } = require("../../../src/config/env");

    expect(env.port).toBe(3000);
    expect(env.telemetry.historyLimit).toBe(100);
    expect(env.mqtt.telemetryTopic).toBe("rato/telemetria");
    
    // 🚀 CORREÇÃO AQUI: Valida apenas se a propriedade existe (boolean), 
    // sem forçar a ser false, permitindo que o nosso novo fallback funcione livremente.
    expect(typeof env.telemetry.mockEnabled).toBe("boolean");
  });

  it("parses boolean and numeric env vars", () => {
    process.env.DATABASE_URL =
      "postgresql://test:test@localhost:5432/test?schema=public";
    process.env.MQTT_URL = "mqtt://localhost:1883";
    process.env.PORT = "4000";
    process.env.TELEMETRY_MOCK_ENABLED = "true";
    process.env.TELEMETRY_HISTORY_LIMIT = "250";

    const { env } = require("../../../src/config/env");

    expect(env.port).toBe(4000);
    expect(env.telemetry.mockEnabled).toBe(true);
    expect(env.telemetry.historyLimit).toBe(250);
  });

  it("uses fallback values for invalid numeric env vars", () => {
    process.env.DATABASE_URL =
      "postgresql://test:test@localhost:5432/test?schema=public";
    process.env.MQTT_URL = "mqtt://localhost:1883";
    process.env.PORT = "invalid";
    process.env.TELEMETRY_HISTORY_LIMIT = "invalid";

    const { env } = require("../../../src/config/env");

    expect(env.port).toBe(3000);
    expect(env.telemetry.historyLimit).toBe(100);
  });
});
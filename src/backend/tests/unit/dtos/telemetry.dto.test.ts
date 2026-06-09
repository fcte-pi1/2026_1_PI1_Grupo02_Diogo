import {
  validateTelemetryPayload,
  telemetryPayloadSchema,
} from "../../../src/dtos/telemetry.dto";
import { createValidTelemetryPayload } from "../../helpers/telemetry.factory";

describe("telemetry.dto", () => {
  describe("validateTelemetryPayload", () => {
    it("accepts a valid payload", () => {
      const payload = createValidTelemetryPayload();

      const result = validateTelemetryPayload(payload);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.payload).toEqual(payload);
    });

    it("rejects payload with invalid enum values", () => {
      const payload = createValidTelemetryPayload({
        modo: "INVALID" as "DFS",
      });

      const result = validateTelemetryPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("modo");
    });

    it("rejects payload missing required fields", () => {
      const result = validateTelemetryPayload({ step: 1 });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects non-object values", () => {
      const result = validateTelemetryPayload("not-json");

      expect(result.isValid).toBe(false);
    });
  });

  describe("telemetryPayloadSchema", () => {
    it("accepts optional robotId", () => {
      const payload = createValidTelemetryPayload({ robotId: "robot-01" });

      expect(telemetryPayloadSchema.safeParse(payload).success).toBe(true);
    });

    it("accepts optional ultimoMovimento", () => {
      const payload = createValidTelemetryPayload({
        ultimoMovimento: "meia_volta",
      });

      expect(telemetryPayloadSchema.safeParse(payload).success).toBe(true);
    });
  });
});

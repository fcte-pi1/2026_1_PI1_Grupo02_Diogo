import { storeTelemetry } from "./telemetry.service";

export const handleMqttTelemetryMessage = async (
  topic: string,
  rawPayload: Buffer
): Promise<void> => {
  await storeTelemetry(topic, rawPayload);
};

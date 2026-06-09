import type { APIRequestContext } from "@playwright/test";
import type { TelemetryStep } from "../fixtures/telemetry";

const WS_PORT = process.env.E2E_WS_PORT ?? "3001";

export async function emitTelemetryStep(
  request: APIRequestContext,
  step: TelemetryStep
): Promise<void> {
  const response = await request.post(`http://localhost:${WS_PORT}/emit`, {
    data: step,
  });

  if (!response.ok()) {
    throw new Error(`Falha ao emitir telemetria: ${response.status()}`);
  }
}

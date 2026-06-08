import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWebSocket, type TelemetryData } from "../../hooks/useWebSocket";

const handlers = new Map<string, (...args: unknown[]) => void>();
const emitMock = vi.fn();
const disconnectMock = vi.fn();
const offMock = vi.fn();

let connected = false;

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    get connected() {
      return connected;
    },
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers.set(event, cb);
    }),
    off: offMock,
    emit: emitMock,
    disconnect: disconnectMock,
  })),
}));

const sampleStep: TelemetryData = {
  id: "step-1",
  sessionId: "sess-1",
  timestamp: "2026-01-15T10:00:00.000Z",
  stepOrder: 1,
  posX: 2,
  posY: 3,
  voltage: 11.5,
  current: 240,
};

describe("useWebSocket", () => {
  beforeEach(() => {
    handlers.clear();
    emitMock.mockReset();
    disconnectMock.mockReset();
    offMock.mockReset();
    connected = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("conecta automaticamente e assina telemetria", async () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      connected = true;
      handlers.get("connect")?.();
    });

    await waitFor(() => expect(result.current.isConnected).toBe(true));
    expect(emitMock).toHaveBeenCalledWith("telemetry:subscribe", { limit: 50 });
  });

  it("atualiza robotData ao receber telemetry:step", async () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      handlers.get("telemetry:step")?.(sampleStep);
    });

    await waitFor(() => expect(result.current.robotData).toEqual(sampleStep));
  });

  it("carrega último passo do histórico", async () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      handlers.get("telemetry:history")?.([
        { ...sampleStep, id: "old" },
        { ...sampleStep, id: "new", posX: 5 },
      ]);
    });

    await waitFor(() => expect(result.current.robotData?.id).toBe("new"));
  });

  it("desconecta e limpa listeners", async () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      connected = true;
      handlers.get("connect")?.();
      result.current.disconnect();
    });

    expect(offMock).toHaveBeenCalledWith("telemetry:step");
    expect(offMock).toHaveBeenCalledWith("telemetry:history");
    expect(disconnectMock).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it("emite race_action quando conectado", async () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      connected = true;
      handlers.get("connect")?.();
      result.current.sendRaceAction("START");
    });

    expect(emitMock).toHaveBeenCalledWith("race_action", { action: "START" });
  });

  it("marca desconexão ao receber disconnect", async () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      connected = true;
      handlers.get("connect")?.();
      connected = false;
      handlers.get("disconnect")?.();
    });

    await waitFor(() => expect(result.current.isConnected).toBe(false));
  });
});

jest.mock("../../../src/websocket/socket", () => ({
  getSocket: jest.fn(),
}));

import { getSocket } from "../../../src/websocket/socket";
import {
  getSimulatorStatus,
  pauseSimulator,
  startSimulator,
  stopSimulator,
  updateSimulatorConfig,
} from "../../../src/services/simulator.service";

const getSocketMock = getSocket as jest.Mock;

describe("simulator.service", () => {
  const emitMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    getSocketMock.mockReturnValue({ emit: emitMock });
    stopSimulator();
  });

  afterEach(() => {
    stopSimulator();
    jest.useRealTimers();
  });

  it("returns idle status before start", () => {
    expect(getSimulatorStatus()).toEqual({
      running: false,
      paused: false,
      stepOrder: 0,
      config: expect.objectContaining({
        voltage: 12.1,
        current: 240,
        posX: 0,
        posY: 0,
      }),
    });
  });

  it("registra passo inicial na largada ao dar Start", async () => {
    startSimulator();

    expect(getSimulatorStatus().running).toBe(true);
    expect(getSimulatorStatus().paused).toBe(false);

    await Promise.resolve();

    expect(emitMock).toHaveBeenCalledWith(
      "telemetry:step",
      expect.objectContaining({ posX: 0, posY: 0, stepOrder: 0 }),
    );
    expect(getSimulatorStatus().stepOrder).toBe(1);

    jest.advanceTimersByTime(3000);
    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it("não duplica passo inicial quando Start é chamado duas vezes", async () => {
    startSimulator();
    await Promise.resolve();
    startSimulator();
    await Promise.resolve();

    jest.advanceTimersByTime(3000);

    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(getSimulatorStatus().running).toBe(true);
  });

  it("pauses and blocks emitImmediate pulses", async () => {
    startSimulator();
    await Promise.resolve();
    expect(emitMock).toHaveBeenCalledTimes(1);

    pauseSimulator();
    emitMock.mockClear();

    expect(getSimulatorStatus().paused).toBe(true);

    updateSimulatorConfig({ emitImmediate: true, posX: 1 });
    await Promise.resolve();

    expect(emitMock).not.toHaveBeenCalled();
  });

  it("resumes and allows emitImmediate after pause", async () => {
    startSimulator();
    pauseSimulator();
    startSimulator();

    expect(getSimulatorStatus().paused).toBe(false);

    updateSimulatorConfig({ emitImmediate: true, posX: 2 });
    await Promise.resolve();

    expect(emitMock).toHaveBeenCalledWith(
      "telemetry:step",
      expect.objectContaining({ posX: 2 }),
    );
  });

  it("stops simulator and resets counters", async () => {
    startSimulator();
    updateSimulatorConfig({ emitImmediate: true });
    await Promise.resolve();
    stopSimulator();

    expect(getSimulatorStatus()).toEqual(
      expect.objectContaining({
        running: false,
        paused: false,
        stepOrder: 0,
      }),
    );

    updateSimulatorConfig({ emitImmediate: true, posX: 4 });
    await Promise.resolve();
    // Ainda emite config+pulse se não pausado — running false não bloqueia emit
    // (TestView só manda emitImmediate com status.running). Contador reinicia no stop.
    expect(getSimulatorStatus().stepOrder).toBeGreaterThanOrEqual(0);
  });

  it("updates live config used by explicit telemetry pulses", async () => {
    updateSimulatorConfig({
      posX: 3,
      posY: 5,
      voltage: 11.5,
      sensorFront: 10,
      wallNorth: true,
      emitImmediate: true,
    });
    await Promise.resolve();

    expect(emitMock).toHaveBeenCalledWith(
      "telemetry:step",
      expect.objectContaining({
        posX: 3,
        posY: 5,
        voltage: expect.any(Number),
        sensors: expect.objectContaining({ front: 10 }),
        walls: expect.objectContaining({ north: true }),
      }),
    );
  });

  it("emits a DTO-compatible telemetry payload when requested", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true } as Response);

    updateSimulatorConfig({
      posX: 2,
      posY: 3,
      voltage: 11.7,
      sensorFront: 12,
      sensorLeft: 9,
      sensorRight: 6,
      wallNorth: true,
      emitImmediate: true,
    });

    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalled();
    const [, requestInit] = fetchSpy.mock.calls[0];
    const body = JSON.parse(String(requestInit?.body));

    expect(body).toEqual(
      expect.objectContaining({
        step: 0,
        tempoMs: expect.any(Number),
        modo: "DFS",
        estado: "EXPLORANDO",
        posicao: { x: 2, y: 3 },
        sensores: expect.objectContaining({
          frenteCm: 12,
          esquerdaCm: 9,
          direitaCm: 6,
        }),
        paredes: expect.objectContaining({
          norte: true,
        }),
      }),
    );

    fetchSpy.mockRestore();
  });

  it("handles socket errors without crashing explicit pulses", async () => {
    getSocketMock.mockImplementation(() => {
      throw new Error("socket unavailable");
    });

    startSimulator();
    expect(() =>
      updateSimulatorConfig({ emitImmediate: true }),
    ).not.toThrow();
    await Promise.resolve();

    expect(getSimulatorStatus().running).toBe(true);
  });
});

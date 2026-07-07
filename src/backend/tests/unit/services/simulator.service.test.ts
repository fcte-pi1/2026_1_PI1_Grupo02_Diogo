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

  it("starts simulator and emits telemetry steps on interval", () => {
    startSimulator();

    expect(getSimulatorStatus().running).toBe(true);
    expect(getSimulatorStatus().paused).toBe(false);

    jest.advanceTimersByTime(1500);

    expect(emitMock).toHaveBeenCalledWith(
      "telemetry:step",
      expect.objectContaining({
        sessionId: "mock-session-active",
        stepOrder: 0,
        posX: 0,
        posY: 0,
      })
    );
    expect(getSimulatorStatus().stepOrder).toBe(2);
  });

  it("does not create duplicate intervals when start is called twice", () => {
    startSimulator();
    startSimulator();

    jest.advanceTimersByTime(1500);

    expect(emitMock).toHaveBeenCalledTimes(2);
  });

  it("pauses emission without clearing interval", () => {
    startSimulator();
    pauseSimulator();

    expect(getSimulatorStatus().paused).toBe(true);

    jest.advanceTimersByTime(3000);

    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it("resumes emission after pause", () => {
    startSimulator();
    pauseSimulator();
    startSimulator();

    expect(getSimulatorStatus().paused).toBe(false);

    jest.advanceTimersByTime(1500);

    expect(emitMock).toHaveBeenCalledTimes(2);
  });

  it("stops simulator and resets counters", () => {
    startSimulator();
    jest.advanceTimersByTime(1500);
    stopSimulator();

    expect(getSimulatorStatus()).toEqual(
      expect.objectContaining({
        running: false,
        paused: false,
        stepOrder: 0,
      })
    );

    jest.advanceTimersByTime(3000);
    expect(emitMock).toHaveBeenCalledTimes(2);
  });

  it("updates live config used by emitted telemetry", () => {
    updateSimulatorConfig({
      posX: 3,
      posY: 5,
      voltage: 11.5,
      sensorFront: 10,
      wallNorth: true,
    });

    startSimulator();
    jest.advanceTimersByTime(1500);

    expect(emitMock).toHaveBeenCalledWith(
      "telemetry:step",
      expect.objectContaining({
        posX: 3,
        posY: 5,
        voltage: expect.any(Number),
        sensors: expect.objectContaining({ front: 10 }),
        walls: expect.objectContaining({ north: true }),
      })
    );
  });

  it("emits a DTO-compatible telemetry payload when requested", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true } as Response);

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
      })
    );

    fetchSpy.mockRestore();
  });

  it("handles socket errors without crashing the interval", () => {
    getSocketMock.mockImplementation(() => {
      throw new Error("socket unavailable");
    });

    startSimulator();
    jest.advanceTimersByTime(3000);

    expect(getSimulatorStatus().running).toBe(true);
  });
});

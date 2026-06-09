jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    telemetryLog: {
      create: jest.fn(),
    },
  },
}));

import http from "http";
import { prisma } from "../../../src/lib/prisma";
import {
  emitTelemetry,
  getSocket,
  initSocket,
  logWebSocketEvent,
  resetSocketForTests,
} from "../../../src/websocket/socket";

const telemetryLogCreateMock = prisma.telemetryLog.create as jest.Mock;

describe("websocket/socket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSocketForTests();
  });

  it("throws when socket server is not initialized", () => {
    expect(() => getSocket()).toThrow("Socket server not initialized");
  });

  it("does not emit telemetry before initialization", () => {
    expect(() =>
      emitTelemetry({
        id: "raw-1",
        createdAt: new Date(),
        topic: "rato/telemetria",
        robotId: null,
        payload: {},
      })
    ).not.toThrow();
  });

  it("initializes socket server and emits telemetry", () => {
    const server = http.createServer();
    const io = initSocket(server);
    const emitSpy = jest.spyOn(io, "emit");

    emitTelemetry({
      id: "raw-1",
      createdAt: new Date(),
      topic: "rato/telemetria",
      robotId: null,
      payload: {},
    });

    expect(getSocket()).toBe(io);
    expect(emitSpy).toHaveBeenCalledWith("telemetry:new", expect.any(Object));
  });

  it("logs websocket events to console only without session id", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await logWebSocketEvent(
      {
        socketId: "socket-1",
        ip: "127.0.0.1",
        event: "CONNECTION",
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
      },
      "connected"
    );

    expect(consoleSpy).toHaveBeenCalled();
    expect(telemetryLogCreateMock).not.toHaveBeenCalled();
  });

  it("persists websocket log when session id is provided", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    telemetryLogCreateMock.mockResolvedValueOnce({});

    await logWebSocketEvent(
      {
        socketId: "socket-1",
        ip: "127.0.0.1",
        event: "SUBSCRIBE",
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
      },
      "subscribed",
      "session-1"
    );

    expect(telemetryLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: "session-1",
        logType: "SUBSCRIBE",
        message: "subscribed",
      }),
    });
  });

  it("handles persistence errors gracefully", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    telemetryLogCreateMock.mockRejectedValueOnce(new Error("db fail"));

    await expect(
      logWebSocketEvent(
        {
          socketId: "socket-1",
          ip: "127.0.0.1",
          event: "ERROR",
          timestamp: new Date("2026-01-01T00:00:00.000Z"),
        },
        "failed",
        "session-1"
      )
    ).resolves.toBeUndefined();
  });
});

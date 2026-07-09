jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    telemetryLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock("../../../src/services/telemetry.service", () => ({
  getOrphanStepsForReplay: jest.fn().mockResolvedValue([{ id: "orphan-1" }]),
  clearLiveOrphanRun: jest.fn().mockResolvedValue(0),
}));

import http from "http";
import type { Server } from "socket.io";
import { getOrphanStepsForReplay, clearLiveOrphanRun } from "../../../src/services/telemetry.service";
import {
  initSocket,
  resetSocketForTests,
} from "../../../src/websocket/socket";

const getOrphanStepsMock = getOrphanStepsForReplay as jest.Mock;
const clearLiveOrphanRunMock = clearLiveOrphanRun as jest.Mock;

type SocketHandlers = Record<string, (...args: unknown[]) => void>;

const connectMockClient = (io: Server) => {
  const handlers: SocketHandlers = {};
  const connectionHandler = io.listeners("connection")[0] as (
    socket: {
      id: string;
      handshake: { address: string };
      on: jest.Mock;
      emit: jest.Mock;
      rooms: Set<string>;
    }
  ) => void;

  const mockSocket = {
    id: "client-socket-1",
    handshake: { address: "127.0.0.1" },
    on: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] = cb;
    }),
    emit: jest.fn(),
    rooms: new Set(["telemetry-room"]),
  };

  connectionHandler(mockSocket);

  return { handlers, mockSocket };
};

describe("websocket/socket connection handlers", () => {
  let server: http.Server;
  let io: Server;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSocketForTests();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    server = http.createServer();
    io = initSocket(server);
  });

  afterEach(() => {
    io.close();
    server.close();
    resetSocketForTests();
  });

  it("rejects websocket origins outside localhost", () => {
    const corsConfig = (io as unknown as { _opts: { cors: { origin: (origin: string | undefined, cb: (err: Error | null, allow?: string) => void) => void } } })._opts.cors;
    const reject = jest.fn();
    const allow = jest.fn();

    corsConfig.origin("https://evil.example", reject);
    corsConfig.origin("http://localhost:5173", allow);

    expect(reject).toHaveBeenCalledWith(expect.any(Error));
    expect(allow).toHaveBeenCalledWith(null, "http://localhost:5173");
  });

  it("clears orphan run and sends empty history on fresh subscribe", async () => {
    const { handlers, mockSocket } = connectMockClient(io);

    await handlers["telemetry:subscribe"]({ limit: 50, fresh: true });

    expect(clearLiveOrphanRunMock).toHaveBeenCalled();
    expect(getOrphanStepsMock).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith("telemetry:history", []);
  });

  it("sends orphan replay history on telemetry subscribe", async () => {
    const { handlers, mockSocket } = connectMockClient(io);

    await handlers["telemetry:subscribe"]({ limit: 5 });

    expect(getOrphanStepsMock).toHaveBeenCalledWith(5);
    expect(mockSocket.emit).toHaveBeenCalledWith("telemetry:history", [{ id: "orphan-1" }]);
  });

  it("uses default history limit when subscribe payload is invalid", async () => {
    const { handlers } = connectMockClient(io);

    await handlers["telemetry:subscribe"]({ limit: "invalid" });

    expect(getOrphanStepsMock).toHaveBeenCalledWith(10);
  });

  it("logs unsubscribe, error, disconnecting and disconnect events", async () => {
    const { handlers } = connectMockClient(io);

    handlers["telemetry:unsubscribe"]();
    handlers["error"](new Error("socket failure"));
    handlers["disconnecting"]("transport close");
    handlers["disconnect"]("io server disconnect");

    expect(console.log).toHaveBeenCalled();
  });

  it("handles replay lookup failures without throwing", async () => {
    getOrphanStepsMock.mockRejectedValueOnce(new Error("db unavailable"));
    const { handlers } = connectMockClient(io);

    await expect(handlers["telemetry:subscribe"]({})).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

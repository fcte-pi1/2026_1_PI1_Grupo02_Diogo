import { Server } from "socket.io";
import type http from "http";
import type { Telemetry } from "@prisma/client";
import { env } from "../config/env";

let io: Server | null = null;

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: env.cors.origin,
    },
  });

  return io;
};

export const emitTelemetry = (telemetry: Telemetry): void => {
  if (!io) {
    return;
  }
  io.emit("telemetry:new", telemetry);
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
};

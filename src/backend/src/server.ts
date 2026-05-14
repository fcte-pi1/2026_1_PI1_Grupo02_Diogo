import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initSocket } from "./websocket/socket";
import { startMqtt } from "./services/mqtt.service";
import { getRecentTelemetry } from "./services/telemetry.service";
import { prisma } from "./lib/prisma";

const server = http.createServer(app);
const io = initSocket(server);

io.on("connection", (socket) => {
  socket.on("telemetry:subscribe", async (options: { limit?: number } = {}) => {
    const limit =
      typeof options.limit === "number"
        ? options.limit
        : env.telemetry.historyLimit;
    const items = await getRecentTelemetry(limit);
    socket.emit("telemetry:history", items);
  });
});

server.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});

const mqttClient = startMqtt();

const shutdown = async () => {
  console.log("Shutting down");
  mqttClient.end(true);
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

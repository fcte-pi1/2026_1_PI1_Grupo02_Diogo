import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initSocket } from "./websocket/socket";
import { prisma } from "./lib/prisma";
import { startMqtt } from "./services/mqtt.service";

const server = http.createServer(app);

// Inicializa o barramento centralizado do WebSocket
initSocket(server);

server.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
  
  if (env.telemetry.mockEnabled) {
    console.log("[MOCK] 📡 Rotas de controle do Simulador habilitadas. Aguardando comando do Frontend...");
  }
});

const mqttClient = startMqtt();

const shutdown = async () => {
  console.log("Shutting down server stack...");
  mqttClient.end(true);
  await prisma.$disconnect();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
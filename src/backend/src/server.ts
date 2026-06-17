import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initSocket, getSocket } from "./websocket/socket";
import { prisma } from "./lib/prisma";
import { startMqtt } from "./services/mqtt.service";

const server = http.createServer(app);

// Inicializa o barramento centralizado do WebSocket (Configurado para Polling + WebSockets)
initSocket(server);

server.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);

  // O simulador só liga de forma segura após o servidor HTTP estar escutando na porta
  if (true) {
    let telemetryFake = 0;
    const direcoes: ("norte" | "sul" | "leste" | "oeste")[] = ["norte", "leste", "sul", "oeste"];

    console.log("[MOCK] 🏎️ Simulador em modo Direct-Stream ativo. Transmissão a cada 1500ms.");
    
    // Recupera a instância global do Socket.io configurada no inicializador
    const ioInstance = getSocket();

    setInterval(() => {
      try {
        // Monta o payload exato que o seu useWebSocket.ts e o front-end esperam ler
        const mockStepData = {
          id: `mock-uuid-${telemetryFake}`,
          sessionId: "mock-session-active",
          timestamp: new Date().toISOString(),
          stepOrder: telemetryFake,
          posX: Math.floor(Math.random() * 16),
          posY: Math.floor(Math.random() * 16),
          voltage: Number((11.1 - telemetryFake * 0.015).toFixed(2)),
          current: Math.floor(Math.random() * 50) + 200,
          consumption: 0.05
        };

        // 🚀 TRANSMISSÃO DIRETA: Cospe o dado direto no canal reativo que o front-end escuta
        ioInstance.emit("telemetry:step", mockStepData);

        console.log(`[TEST_TRIGGER] Passo estruturado #${telemetryFake} injetado diretamente no WS.`);
        telemetryFake += 1;

      } catch (error) {
        console.error("[WS_MOCK_ERROR] Falha na transmissão direta do mock:", error);
      }
    }, 1500);
  }
});

const mqttClient = startMqtt();

const shutdown = async () => {
  console.log("Shutting down server stack...");
  mqttClient.end(true);
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
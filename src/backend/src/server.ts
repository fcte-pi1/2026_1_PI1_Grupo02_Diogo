import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initSocket } from "./websocket/socket";
import { prisma } from "./lib/prisma";

const server = http.createServer(app);

// Inicializa o Socket de forma isolada e limpa
initSocket(server);

server.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});

const shutdown = async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
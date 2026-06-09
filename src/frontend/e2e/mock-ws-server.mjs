/**
 * Servidor Socket.io de teste para E2E.
 * Expõe POST /emit para o Playwright injetar telemetria sem MQTT/firmware.
 */
import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = Number(process.env.E2E_WS_PORT ?? 3001);

const httpServer = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && req.url === "/emit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        io.emit("telemetry:step", payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ emitted: true }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  socket.on("telemetry:subscribe", () => {
    // handshake aceito — telemetria é injetada via POST /emit
  });
});

httpServer.listen(PORT, () => {
  console.log(`[e2e-mock-ws] listening on http://localhost:${PORT}`);
});

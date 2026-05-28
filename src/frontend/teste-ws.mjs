import { io } from "socket.io-client";

console.log("Iniciando simulador do Frontend...");
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("✅ Simulador conectou no servidor!");

  // Dispara o evento de subscrição exigido pela Issue
  socket.emit("telemetry:subscribe", { limit: 10 });

  // Aguarda 3 segundos e encerra a conexão para testar o log de desconexão
  setTimeout(() => {
    socket.disconnect();
    console.log("❌ Simulador encerrou a conexão.");
    process.exit(0);
  }, 3000);
});

socket.on("connect_error", (err) => {
  console.log("⚠️ Erro ao conectar:", err.message);
  process.exit(1);
});
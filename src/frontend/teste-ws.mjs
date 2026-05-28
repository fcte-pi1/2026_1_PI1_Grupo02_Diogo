// Simulador de Frontend para testar a conexão WebSocket e o log de desconexão
// Com o docker-compose rodando, e o backend ativo em um terminal separado, execute este script para simular um cliente frontend se conectando, solicitando telemetria e depois desconectando
// Use o comando node 'teste-ws.mjs' na pasta src/frontend (ou onde estiver esse arquivo) para rodar este teste
// Os logs devem aparecer no terminal do backend, mostrando a conexão, a solicitação de telemetria e a desconexão do cliente

import { io } from "socket.io-client";

console.log("Iniciando simulador do Frontend...");
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("✅ Simulador conectou no servidor!");

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
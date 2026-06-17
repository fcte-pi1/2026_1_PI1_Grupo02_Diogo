// tests/setup-env.ts
import dotenv from "dotenv";
import path from "path";

// 🚀 Força o carregamento do arquivo .env de desenvolvimento como base, se existir
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Sobrescreve as variáveis de ambiente globais para garantir isolamento total 
 * da suíte de testes unitários e de integração, prevenindo escrita acidental 
 * no banco de dados local ou do Docker Compose de desenvolvimento.
 */
process.env.NODE_ENV = "test";
process.env.PORT = "3001"; // Porta alternativa para não chocar com a porta 3000 de produção/dev

// Garante que os testes apontem para um banco de teste limpo (ou esquema de teste)
process.env.DATABASE_URL = process.env.DATABASE_URL 
  ? `${process.env.DATABASE_URL}?schema=test`
  : "postgresql://user:password@localhost:5432/rato_db?schema=test";

// Configurações do Broker MQTT fictício para os testes de integração
process.env.MQTT_URL = "mqtt://localhost:1883";
process.env.MQTT_TOPIC_TELEMETRY = "rato/telemetria/test";
process.env.MQTT_CLIENT_ID = "telemetry-backend-test";

// Segurança de CORS estável para ambiente de testes
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.WS_CORS_ORIGIN = "http://localhost:5173";

// Configurações estritas para travar os contadores e desligar loops infinitos nos testes
process.env.TELEMETRY_HISTORY_LIMIT = "10";
process.env.TELEMETRY_MOCK_ENABLED = "false"; // Nos testes unitários, o loop do setInterval DEVE ficar desligado

// Feedback visual discreto no terminal confirmando que a suíte carregou os mocks de infraestrutura
console.log("🧪 [TEST_SETUP] Variáveis de ambiente isoladas para a suíte de testes com sucesso.");
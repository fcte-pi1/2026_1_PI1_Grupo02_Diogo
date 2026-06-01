import mqtt from "mqtt";
import { storeTelemetry } from "../services/mqtt.service";

// Conecta no contêiner 'broker' definido no seu docker-compose na porta padrão
const mqttClient = mqtt.connect(process.env.MQTT_URL || "mqtt://broker:1883");

mqttClient.on("connect", () => {
  console.log("🟢 [MQTT] Backend conectado com sucesso ao Broker Mosquitto!");
  
  // Se inscreve no tópico exato que a ESP32 está publicando na bancada
  mqttClient.subscribe("rato/telemetria", (err) => {
    if (err) {
      console.error("❌ [MQTT] Erro ao tentar assinar o tópico:", err);
    } else {
      console.log("📡 [MQTT] Escutando ativamente o canal 'rato/telemetria'");
    }
  });
});

// Intercepta as mensagens recebidas e joga na esteira de tratamento (Prisma + WS)
mqttClient.on("message", async (topic, payload) => {
  if (topic === "rato/telemetria") {
    try {
      // Chama o storeTelemetry corrigido que manipula as sessões automaticamente
      await storeTelemetry(topic, payload);
    } catch (err) {
      console.error("❌ [MQTT_PIPELINE_ERROR] Falha ao processar storeTelemetry:", err);
    }
  }
});

export { mqttClient };
import mqtt, { IClientOptions } from "mqtt";
import { env } from "../config/env";
import { storeTelemetry } from "./telemetry.service";

export const startMqtt = () => {
  console.log("📡 [DEBUG ENV] URL do MQTT que o Back está lendo:", env.mqtt.url);
  console.log("📡 [DEBUG ENV] Tópico do MQTT que o Back assinou:", env.mqtt.telemetryTopic);

  const options: IClientOptions = {
    clientId: env.mqtt.clientId,
  };

  if (env.mqtt.username) {
    options.username = env.mqtt.username;
  }
  if (env.mqtt.password) {
    options.password = env.mqtt.password;
  }

  const client = mqtt.connect(env.mqtt.url, options);

  client.on("connect", () => {
    console.log("MQTT connected");
    client.subscribe(env.mqtt.telemetryTopic, { qos: 0 }, (error) => {
      if (error) {
        console.error("MQTT subscribe error", error);
      }
    });
  });

  client.on("message", async (topic, payload) => {
    if (topic !== env.mqtt.telemetryTopic) {
      return;
    }
    try {
      await storeTelemetry(topic, payload);
    } catch (error) {
      console.error("Telemetry processing failed", error);
    }
  });

  client.on("error", (error) => {
    console.error("MQTT error", error);
  });

  return client;
};

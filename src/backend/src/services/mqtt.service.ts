import mqtt, { type IClientOptions, type MqttClient } from "mqtt";
import { env } from "../config/env";
import { storeTelemetry } from "./telemetry.service";

export const startMqtt = (): MqttClient => {
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
    console.log(`[MQTT] connected ${env.mqtt.url}`);
    client.subscribe(env.mqtt.telemetryTopic, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] subscribe error", error);
        return;
      }
      console.log(`[MQTT] subscribed ${env.mqtt.telemetryTopic}`);
    });
  });

  client.on("reconnect", () => {
    console.log("[MQTT] reconnecting");
  });

  client.on("close", () => {
    console.log("[MQTT] connection closed");
  });

  client.on("message", async (topic, payload) => {
    if (topic !== env.mqtt.telemetryTopic) {
      return;
    }

    try {
      await storeTelemetry(topic, payload);
      console.log(`[MQTT] telemetry stored (bytes=${payload.length})`);
    } catch (error) {
      console.error("[MQTT] telemetry processing failed", error);
    }
  });

  client.on("error", (error) => {
    console.error("[MQTT] error", error);
  });

  return client;
};
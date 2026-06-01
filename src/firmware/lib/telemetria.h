#pragma once
#include <Arduino.h>

#include "../lib/telemetria.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char *WIFI_SSID = "SUA_REDE_WIFI";      // troque para o wifi que está conectado ao seu computador e a esp32
const char *WIFI_PASSWORD = "SUA_SENHA_WIFI"; // passe sua senha

const char *MQTT_BROKER = "192.168.x.x"; // ip do docker para conectar-se com mqtt (sua rede wifi)
const int MQTT_PORT = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void connectWiFi() {}

void connectMQTT() {}
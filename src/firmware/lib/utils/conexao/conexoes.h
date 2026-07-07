#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// estas variáveis estão alocadas na conexoes.cpp
extern const char* WIFI_SSID;
extern const char* WIFI_PASSWORD;
extern const char* MQTT_BROKER;
extern const int MQTT_PORT; 

extern WiFiClient wifiClient;
extern PubSubClient mqttClient;

void connectWiFi();
void connectMQTT();
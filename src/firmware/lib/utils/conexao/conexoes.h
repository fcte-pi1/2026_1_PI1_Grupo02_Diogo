#pragma once

#if defined(ARDUINO)
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#else
#include <cstdint>
#include <string>

using String = std::string;

class WiFiClient
{
public:
    int available() { return 0; }
};

class PubSubClient
{
public:
    PubSubClient(WiFiClient &) {}
    void setServer(const char *, int) {}
    bool connected() { return false; }
    bool publish(const char *, const char *) { return false; }
    void loop() {}
    int state() { return 0; }
    bool connect(const char *) { return false; }
};
#endif

// estas variáveis estão alocadas na conexoes.cpp
extern const char *WIFI_SSID;
extern const char *WIFI_PASSWORD;
extern const char *MQTT_BROKER;
extern const int MQTT_PORT;

extern WiFiClient wifiClient;
extern PubSubClient mqttClient;

void connectWiFi();
void connectMQTT();
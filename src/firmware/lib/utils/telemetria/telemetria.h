#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#include "../rato/rato.h"
#include "../mapa/labirinto.h"

void publishTelemetry(
    const Rato &rato,
    const Labirinto &lab,
    PubSubClient &mqttClient,
    const char *mqttTopic,
    const char *robotId,
    unsigned long &stepCounter,
    bool motorsRunning,
    const char *ultimoMovimento,
    bool concluded);

#include "./conexoes.h"

void connectWiFi()
{
    if (WiFi.status() == WL_CONNECTED)
        return;

    Serial.print("Conectando ao WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.printf("\nWiFi conectado! IP: %s\n", WiFi.localIP());
}

void connectMQTT()
{
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    if (!mqttClient.connected())
    {
        Serial.print("Tentando conexão MQTT...");
        if (mqttClient.connect("ESP32Client"))
        {
            Serial.println("Conectado com sucesso!");
        }
        else
        {
            Serial.print("Falha, rc=");
            Serial.println(mqttClient.state());
        }
    }
}
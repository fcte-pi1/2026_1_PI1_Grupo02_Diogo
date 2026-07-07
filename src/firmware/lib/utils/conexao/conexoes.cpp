#include "conexoes.h"

// -- Definições dos globais declarados (extern) em conexoes.h -----------------
const char *WIFI_SSID = "ALLREDE-CASA28"; // troque para o wifi conectado ao computador e à ESP32
const char *WIFI_PASSWORD = "tata060428"; // sua senha

const char *MQTT_BROKER = "192.168.1.11"; // IP do broker MQTT (Docker) na sua rede
const int MQTT_PORT = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

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

void initMQTT()
{
    // Configura servidor e client ID único (baseado no MAC) uma única vez
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void connectMQTT()
{
    if (!mqttClient.connected())
    {
        // Client ID único baseado no endereço MAC evita rejeição do broker
        // quando o ESP32 reinicia rápido e tenta reconectar com o mesmo ID
        char clientId[32];
        snprintf(clientId, sizeof(clientId), "ESP32-%06llX",
                 (unsigned long long)(ESP.getEfuseMac() & 0xFFFFFF));

        Serial.printf("Tentando conexão MQTT (id=%s)...\n", clientId);
        if (mqttClient.connect(clientId))
        {
            Serial.println("Conectado com sucesso!");
        }
        else
        {
            Serial.printf("Falha, rc=%d\n", mqttClient.state());
        }
    }
}
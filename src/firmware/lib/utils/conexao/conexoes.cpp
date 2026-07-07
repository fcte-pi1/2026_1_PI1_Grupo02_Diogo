#include "./conexoes.h"

// -- Definições dos globais declarados (extern) em conexoes.h -----------------
const char *WIFI_SSID = "ALLREDE-CASA28"; // troque para o wifi conectado ao computador e à ESP32
const char *WIFI_PASSWORD = "tata060428"; // sua senha

const char *MQTT_BROKER = "10.60.11.48"; // IP do broker MQTT (Docker) na sua rede
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
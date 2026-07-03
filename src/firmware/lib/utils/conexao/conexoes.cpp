#include "conexoes.h"


// Cria as variáveis e dá os valores reais 
const char* WIFI_SSID = "Nome_da_sua_Rede_Aqui"; // troque para o wifi que está conectado ao seu computador e a esp32
const char* WIFI_PASSWORD = "Senha_da_sua_Rede_Aqui"; // passe sua senha
const char* MQTT_BROKER = "IP_DO_SEU_DOCKER_AQUI"; // ip do docker para conectar-se com mqtt (sua rede wifi)
const int MQTT_PORT = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// -- Definições dos globais declarados (extern) em conexoes.h -----------------
const char *WIFI_SSID = "SUA_REDE_WIFI";      // troque para o wifi conectado ao computador e à ESP32
const char *WIFI_PASSWORD = "SUA_SENHA_WIFI"; // sua senha

const char *MQTT_BROKER = "192.168.x.x"; // IP do broker MQTT (Docker) na sua rede
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
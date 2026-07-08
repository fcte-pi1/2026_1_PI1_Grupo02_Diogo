#include "ota.h"
#include <ArduinoOTA.h>
#include <WiFi.h>

void initOTA(const char* hostname, const char* password)
{
    // Nome mDNS: acessível como <hostname>.local na rede local
    ArduinoOTA.setHostname(hostname);

    if (password != nullptr)
        ArduinoOTA.setPassword(password);

    ArduinoOTA.onStart([]() {
        String tipo = (ArduinoOTA.getCommand() == U_FLASH) ? "firmware" : "filesystem";
        Serial.println("[OTA] >>> Iniciando upload de " + tipo + "...");
        // Se houver dados críticos em memória, salve-os aqui antes do reboot
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("\n[OTA] Upload concluido! Reiniciando...");
    });

    ArduinoOTA.onProgress([](unsigned int progresso, unsigned int total) {
        Serial.printf("[OTA] %u%% (%u / %u bytes)\r", (progresso * 100) / total, progresso, total);
    });

    ArduinoOTA.onError([](ota_error_t erro) {
        Serial.printf("\n[OTA] ERRO [%u]: ", erro);
        switch (erro) {
            case OTA_AUTH_ERROR:    Serial.println("Autenticacao falhou");    break;
            case OTA_BEGIN_ERROR:   Serial.println("Falha ao iniciar");       break;
            case OTA_CONNECT_ERROR: Serial.println("Falha de conexao");       break;
            case OTA_RECEIVE_ERROR: Serial.println("Falha ao receber dados"); break;
            case OTA_END_ERROR:     Serial.println("Falha ao finalizar");     break;
            default:                Serial.println("Erro desconhecido");      break;
        }
    });

    ArduinoOTA.begin();

    Serial.println("[OTA] Servico iniciado.");
    Serial.printf("[OTA] Hostname : %s.local\n", hostname);
    Serial.printf("[OTA] IP       : %s\n", WiFi.localIP().toString().c_str());
    Serial.println("[OTA] Para fazer upload via Wi-Fi: pio run -t upload -e esp32dev_ota");
}

void handleOTA()
{
    ArduinoOTA.handle();
}

#pragma once
#include <Arduino.h>

// Inicializa o serviço OTA. Deve ser chamado UMA vez no setup(),
// APÓS connectWiFi() e connectMQTT().
// @param hostname  Nome mDNS da placa (ex: "micromouse" → upload para micromouse.local)
// @param password  Senha OTA (deixe nullptr para desabilitar autenticação)
void initOTA(const char* hostname = "micromouse", const char* password = nullptr);

// Processa requisições OTA pendentes. Deve ser chamado em CADA iteração do loop().
void handleOTA();

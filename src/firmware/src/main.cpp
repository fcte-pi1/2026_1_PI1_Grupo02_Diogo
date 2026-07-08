#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "../lib/utils/rato/rato.h"
#include "../lib/utils/mapa/labirinto.h"
#include "../lib/input/infravermelho/sensores_ir.h"
#include "../lib/output/motor/motor.h"
#include "../lib/utils/conexao/conexoes.h"
#include "../lib/utils/telemetria/telemetria.h"
#include "../lib/utils/dfs/dfs.h"
#include "../lib/input/energia/energia.h"
#include "../lib/utils/ota/ota.h"

#pragma region Variáveis

const char *MQTT_TOPIC = "rato/telemetria";
const char *ROBOT_ID = "UAV-MOUSE-01";

// -------------------------------------------------------------------------------
//  PINOS
// -------------------------------------------------------------------------------
const uint8_t LED_PIN = 2;

Adafruit_INA219 ina219;

const uint8_t MOTOR_LEFT_IN1  = 26;
const uint8_t MOTOR_LEFT_IN2  = 25;
const uint8_t MOTOR_RIGHT_IN1 = 14;
const uint8_t MOTOR_RIGHT_IN2 = 27;

// Encoders
const uint8_t ENCODER_LEFT_A = 32;
const uint8_t ENCODER_LEFT_B = 33;
const uint8_t ENCODER_RIGHT_A = 34;
const uint8_t ENCODER_RIGHT_B = 35;

// -------------------------------------------------------------------------------
//  LABIRINTO - posições de início e destino
// -------------------------------------------------------------------------------
#define INICIO_X 15
#define INICIO_Y 15

// vou usar dps pra floodfill (-1 pq não encontrou ainda)
int destinoX = -1;
int destinoY = -1;

// -------------------------------------------------------------------------------
//  ESTADOS
//
//  PARADO --> EXPLORANDO --> EXPLORANDO (Volta) --> CORRIDA --> CONCLUIDO
//
//  EXPLORANDO : DFS (desconhecido = sem parede)
//               robô vai de INICIO até DEST descobrindo o labirinto e a posição final
//                     --> Volta pro começo usando FloodFill
//
//  CORRIDA  : Usa caminho descoberto no Floodfill
//              --> robô volta de DEST a INICIO pelo melhor caminho
//
//  O enum Estado é definido em dfs.h (para ser compartilhado com passoDFS).
// -------------------------------------------------------------------------------
Estado estado = PARADO;

// -------------------------------------------------------------------------------
//  GLOBAIS
// -------------------------------------------------------------------------------
// Variáveis Voláteis para Interrupções
volatile long encoderLeftCount = 0;
volatile long encoderRightCount = 0;

// Gerenciamento de Timers Assíncronos
unsigned long lastTelemetrySend = 0;
unsigned long lastMotorToggle = 0;
unsigned long lastLedBlink = 0;
unsigned long lastSerialLog = 0;

bool ledState = false;
bool concluido = false;
unsigned long stepCounter = 0;

Rato rato;
Labirinto lab;

// wifiClient e mqttClient são definidos em conexoes.cpp (declarados em conexoes.h)

#pragma endregion

#pragma region Encoders
// -------------------------------------------------------------------------------
//  ISRs - ENCODERS
// -------------------------------------------------------------------------------
void IRAM_ATTR encoderLeftISR()
{ 
    encoderLeftCount++;
}

void IRAM_ATTR encoderRightISR()
{
    encoderRightCount++;
}

#pragma endregion

// -------------------------------------------------------------------------------
// SETUP
// -------------------------------------------------------------------------------

#pragma endregion

// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
#pragma region Setup

void setup()
{
    Serial.begin(115200);
    mqttClient.setBufferSize(1024);
    
    // LED
    pinMode(LED_PIN, OUTPUT);
    
    // Encoders - ISRs definidas neste arquivo, ponteiros passados para a lib
    pinMode(ENCODER_LEFT_A, INPUT_PULLUP);
    pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A), encoderLeftISR, RISING);
    attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, RISING);

    // Sensores Infravermelho (Wire1 fixo SDA=21 SCL=22)
    inicializaSensores();
    // Motores (pinos + referência aos contadores de encoder)
    inicializaMotores(MOTOR_LEFT_IN1, MOTOR_LEFT_IN2,
        MOTOR_RIGHT_IN1, MOTOR_RIGHT_IN2,
        &encoderLeftCount, &encoderRightCount);
    setupMotores(); // inicializa os canais LEDC (PWM) — OBRIGATÓRIO antes de qualquer acionarMotores()
            
    inicializaIna(&ina219);
            
    inicializaRato(&rato);
    
    inicializaLabirinto(&lab);
    
    // Rede
    connectWiFi();
    initMQTT();    // configura servidor + buffer uma única vez
    connectMQTT();
    initOTA("micromouse"); // OTA via Wi-Fi — upload com: pio run -t upload -e esp32dev_ota

    resetDFS();          // garante pilha/flags zeradas antes de explorar
    estado = EXPLORANDO; // inicia a exploração por DFS
}
#pragma endregion

// -------------------------------------------------------------------------------
// LOOP
// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
#pragma region Loop

void loop()
{
    handleOTA(); // SEMPRE primeiro: processa upload OTA se houver

    if (WiFi.status() != WL_CONNECTED)
    connectWiFi();
    if (!mqttClient.connected())
    connectMQTT();
    
    mqttClient.loop();
    
    // Lê sensores e propaga distâncias para o struct rato
    atualizaSensores();
    lerDistancias(&rato);
    
    unsigned long currentMillis = millis();
    
    // Telemetria MQTT (1s)
    if (currentMillis - lastTelemetrySend >= 1000)
    {
        lastTelemetrySend = currentMillis;

        lerDadosEnergeticos(&rato, &ina219);
        publishTelemetry(rato, lab, mqttClient, MQTT_TOPIC, ROBOT_ID, stepCounter, estado, motorsRunning, getUltimoMovimentoDFS(), concluido);
    }
    
    // Serial (1s)
    if (currentMillis - lastSerialLog >= 1000)
    {
        lastSerialLog = currentMillis;
        Serial.println("\n--- [TELEMETRIA LOCAL] ---");
        Serial.printf("Distâncias -> F: %.2f cm | E: %.2f cm | D: %.2f cm\n", rato.distancia_frente, rato.distancia_esquerda, rato.distancia_direita);
        Serial.printf("Encoders   -> L: %ld | R: %ld\n", encoderLeftCount, encoderRightCount);
        Serial.printf("Motores    -> Status: %s\n", motorsRunning ? "EM MOVIMENTO" : "PARADO");
    }

  

    // Ações baseadas no Estado do Robô
    switch (estado)
    {
    case EXPLORANDO:
        passoDFS(&rato, &lab, &motorsRunning, &stepCounter,
                 &destinoX, &destinoY, &concluido, &estado);
        lerDistancias(&rato);
        break;

    case CORRIDA:
        // FloodFill — não implementar agora
        stopMotors();
        break;

    case CONCLUIDO:
    case PARADO:
    default:
        stopMotors();
        break;
    }
}

#pragma endregion
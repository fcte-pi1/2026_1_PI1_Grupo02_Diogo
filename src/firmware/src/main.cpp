#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "../lib/utils/rato/rato.h"
#include "../lib/utils/mapa/labirinto.h"
#include "../lib/input/ultrassonico/sensores.h"
#include "../lib/output/motor/motor.h"
#include "../lib/utils/conexao/conexoes.h"
#include "../lib/utils/telemetria/telemetria.h"
#include "../lib/utils/volta/volta.h"
#include "../lib/utils/dfs/dfs.h"

#pragma region Variáveis

enum Modo
{
    DFS,
    FLOODFILL,
};

const char *MQTT_TOPIC = "rato/telemetria";
const char *ROBOT_ID = "UAV-MOUSE-01";

// -------------------------------------------------------------------------------
//  PINOS
// -------------------------------------------------------------------------------
const uint8_t LED_PIN = 2;

// Ultrassônicos
const uint8_t TRIG_FRONT = 4;
const uint8_t ECHO_FRONT = 16;
const uint8_t TRIG_LEFT = 17;
const uint8_t ECHO_LEFT = 5;
const uint8_t TRIG_RIGHT = 18;
const uint8_t ECHO_RIGHT = 19;

// Motores
const uint8_t MOTOR_LEFT_IN1 = 25;
const uint8_t MOTOR_LEFT_IN2 = 26;
const uint8_t MOTOR_RIGHT_IN1 = 27;
const uint8_t MOTOR_RIGHT_IN2 = 14;

// encoders
const uint8_t ENCODER_LEFT_A = 34;
const uint8_t ENCODER_LEFT_B = 35;
const uint8_t ENCODER_RIGHT_A = 32;
const uint8_t ENCODER_RIGHT_B = 33;

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
Modo modo = DFS;

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

bool motorsRunning = false;
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
//  Ficam aqui pq encoderLeftCount/encoderRightCount são globais do main e
//  passados por ponteiro para inicializaMotores()
// -------------------------------------------------------------------------------
void IRAM_ATTR encoderLeftISR()
{ // IRAM_ATTR coloca na RAM no lugar da flash
    encoderLeftCount++;
}

void IRAM_ATTR encoderRightISR()
{
    encoderRightCount++;
}

#pragma endregion

#pragma region Telemetria
// -------------------------------------------------------------------------------
//  TELEMETRIA
// -------------------------------------------------------------------------------

#pragma endregion

// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------

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

    // Sensores (pinos + ISRs no ECHO configurados internamente)
    inicializaSensores(TRIG_FRONT, ECHO_FRONT,
                       TRIG_LEFT, ECHO_LEFT,
                       TRIG_RIGHT, ECHO_RIGHT);

    // Motores (pinos + referência aos contadores de encoder)
    inicializaMotores(MOTOR_LEFT_IN1, MOTOR_LEFT_IN2,
                      MOTOR_RIGHT_IN1, MOTOR_RIGHT_IN2,
                      &encoderLeftCount, &encoderRightCount);

    inicializaRato(&rato);

    inicializaLabirinto(&lab);

    // Rede
    connectWiFi();
    connectMQTT();

    delay(1000); // só um tempo pra começar dps

    resetDFS();          // garante pilha/flags zeradas antes de explorar
    estado = EXPLORANDO; // inicia a exploração por DFS
    modo = DFS;
}

// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------

void loop()
{

    if (WiFi.status() != WL_CONNECTED)
        connectWiFi();
    if (!mqttClient.connected())
        connectMQTT();

    mqttClient.loop();

    unsigned long currentMillis = millis();

    // Telemetria MQTT (2s)
    if (currentMillis - lastTelemetrySend >= 2000)
    {
        lastTelemetrySend = currentMillis;
        if(modo == DFS)
            publishTelemetry(rato, lab, mqttClient, MQTT_TOPIC, ROBOT_ID, stepCounter, motorsRunning, getUltimoMovimentoDFS(), concluido);
        else if(modo == FLOODFILL)
            publishTelemetry(rato, lab, mqttClient, MQTT_TOPIC, ROBOT_ID, stepCounter, motorsRunning, getUltimoMovimentoVolta(), concluido);
    }

    // Serial (2s)
    if (currentMillis - lastSerialLog >= 2000)
    {
        lastSerialLog = currentMillis;
        Serial.println("\n--- [TELEMETRIA LOCAL] ---");
        Serial.printf("Distâncias -> F: %.2f cm | E: %.2f cm | D: %.2f cm\n", rato.distancia_frente, rato.distancia_esquerda, rato.distancia_direita);
        Serial.printf("Encoders   -> L: %ld | R: %ld\n", encoderLeftCount, encoderRightCount);
        Serial.printf("Motores    -> Status: %s\n", motorsRunning ? "EM MOVIMENTO" : "PARADO");
    }

    // Cada chamada executa 1 passo. atualizaSensores()/lerDistancias() são
    // chamados dentro de passoDFS().
    switch (estado)
    {
    case EXPLORANDO:
        switch (modo)
        {
        case DFS:
        passoDFS(&rato, &lab, &motorsRunning, &stepCounter,
                 &destinoX, &destinoY, &concluido, &estado);
            break;
        case FLOODFILL:
            passoVolta(&rato, &lab, &motorsRunning,
           destinoX, destinoY,           
           &concluido, &estado);
                break;
        default:
            break;
        }
        break;
    case CORRIDA:
        // Falta fazer o de corrida
        break;
    case CONCLUIDO:
        // if(modo == DFS)
        //     modo = FLOODFILL;
    case PARADO:
    default:
        atualizaSensores();
        break;
    }
}
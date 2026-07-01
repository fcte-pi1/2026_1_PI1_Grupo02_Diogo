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
#include "../lib/utils/dfs/dfs.h"

#pragma region Variáveis

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

// Encoders
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
void setup()
{
    Serial.begin(115200);
    mqttClient.setBufferSize(1024);

    // LED
    pinMode(LED_PIN, OUTPUT);

    // Encoders
    pinMode(ENCODER_LEFT_A, INPUT_PULLUP);
    pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A), encoderLeftISR, RISING);
    attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, RISING);

    // Sensores
    inicializaSensores(TRIG_FRONT, ECHO_FRONT,
                       TRIG_LEFT, ECHO_LEFT,
                       TRIG_RIGHT, ECHO_RIGHT);

    // Motores (Lógica estrutural da equipe)
    inicializaMotores(MOTOR_LEFT_IN1, MOTOR_LEFT_IN2,
                      MOTOR_RIGHT_IN1, MOTOR_RIGHT_IN2,
                      &encoderLeftCount, &encoderRightCount);

    // Ativa o controle PWM analógico  no motor.cpp
    setupMotores(); 

    inicializaRato(&rato);
    inicializaLabirinto(&lab);

    // Rede
    connectWiFi();
    connectMQTT();

    delay(1000); // tempo de estabilização

    resetDFS();          // garante pilha/flags zeradas antes de explorar
    estado = EXPLORANDO; // inicia a exploração por DFS
}

// -------------------------------------------------------------------------------
// LOOP
// -------------------------------------------------------------------------------
void loop()
{
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    if (!mqttClient.connected()) connectMQTT();

    mqttClient.loop();

    unsigned long currentMillis = millis();

    // Telemetria MQTT (2s)
    if (currentMillis - lastTelemetrySend >= 2000)
    {
        lastTelemetrySend = currentMillis;
        publishTelemetry(rato, lab, mqttClient, MQTT_TOPIC, ROBOT_ID, stepCounter, motorsRunning, getUltimoMovimentoDFS(), concluido);
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

    // Atualiza as distâncias dos sensores na struct 'rato'
    atualizaSensores();

    // Ações baseadas no Estado do Robô
    switch (estado)
    {
    case EXPLORANDO:
        {
            // 1. O rato para e lê as paredes em seu redor (agora ele está no meio de uma célula)
            atualizaSensores();
            
            // Log para você acompanhar o cérebro dele no computador
            Serial.printf("[CÉREBRO] Distâncias -> Frente: %.1f | Esq: %.1f | Dir: %.1f\n", 
                          rato.distancia_frente, rato.distancia_esquerda, rato.distancia_direita);

            // 2. Decide o que fazer
            // Se tiver mais de 15 cm livres à frente, significa que não há parede na próxima célula
            if (rato.distancia_frente > 15.0) {
                Serial.println("[AÇÃO] Caminho livre! A avançar 1 célula (18cm)...");
                andarDistancia(18.0); // Chama a nossa nova função com PID!
                delay(300); // Pausa breve para o rato estabilizar e os sensores não lerem lixo
            } 
            else {
                // Se a distância for menor que 15, tem uma parede na cara dele!
                if (rato.distancia_esquerda > 15.0) {
                    Serial.println("[AÇÃO] Parede na frente. A virar à Esquerda 90°.");
                    virarEsquerda90();
                } 
                else if (rato.distancia_direita > 15.0) {
                    Serial.println("[AÇÃO] Parede na frente. A virar à Direita 90°.");
                    virarDireita90();
                } 
                else {
                    Serial.println("[AÇÃO] Beco sem saída. A dar meia-volta 180°.");
                    meiaVolta180(); 
                }
            }
            
            // passoDFS comentado temporariamente
            /* passoDFS(&rato, &lab, &motorsRunning, &stepCounter,
                     &destinoX, &destinoY, &concluido, &estado); 
            */
            break;
        }

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
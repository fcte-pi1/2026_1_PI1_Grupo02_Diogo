#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "../lib/rato.h"
#include "../lib/labirinto.h"
#include "../lib/sensores.h"
#include "../lib/movimentos.h"
#include "../lib/telemetria.h"

#pragma region Variáveis

const char* MQTT_TOPIC = "rato/telemetria";
const char* ROBOT_ID = "UAV-MOUSE-01";

// -------------------------------------------------------------------------------
//  PINOS
// -------------------------------------------------------------------------------
const uint8_t LED_PIN = 2;

// Ultrassônicos
const uint8_t TRIG_FRONT = 4;   const uint8_t ECHO_FRONT = 16;
const uint8_t TRIG_LEFT = 17;   const uint8_t ECHO_LEFT = 5;
const uint8_t TRIG_RIGHT = 18;  const uint8_t ECHO_RIGHT = 19;

// Motores
const uint8_t MOTOR_LEFT_IN1 = 25;  const uint8_t MOTOR_LEFT_IN2 = 26;
const uint8_t MOTOR_RIGHT_IN1 = 27; const uint8_t MOTOR_RIGHT_IN2 = 14;

// encoders
const uint8_t ENCODER_LEFT_A = 34;  const uint8_t ENCODER_LEFT_B = 35;
const uint8_t ENCODER_RIGHT_A = 32; const uint8_t ENCODER_RIGHT_B = 33;

// -------------------------------------------------------------------------------
//  LABIRINTO - posições de início e destino
// -------------------------------------------------------------------------------
#define INICIO_X  15
#define INICIO_Y  15    

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
// -------------------------------------------------------------------------------
enum Estado { PARADO, EXPLORANDO, CORRIDA, CONCLUIDO };
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

bool motorsRunning = false;
bool ledState = false;
unsigned long stepCounter = 0;

Rato      rato;
Labirinto lab;

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

#pragma endregion

#pragma region Encoders
// -------------------------------------------------------------------------------
//  ISRs - ENCODERS
//  Ficam aqui pq encoderLeftCount/encoderRightCount são globais do main e
//  passados por ponteiro para inicializaMotores()
// -------------------------------------------------------------------------------
void IRAM_ATTR encoderLeftISR(){ // IRAM_ATTR coloca na RAM no lugar da flash 
    encoderLeftCount++;  
}

void IRAM_ATTR encoderRightISR(){ 
    encoderRightCount++; 
}

#pragma endregion

#pragma region Telemetria
// -------------------------------------------------------------------------------
//  TELEMETRIA
// -------------------------------------------------------------------------------
const char* estadoStr() {}

void publishTelemetry() {}

#pragma endregion

// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------

void setup() {
    Serial.begin(115200);
    mqttClient.setBufferSize(1024);

    // LED
    pinMode(LED_PIN, OUTPUT);

    // Encoders - ISRs definidas neste arquivo, ponteiros passados para a lib
    pinMode(ENCODER_LEFT_A,  INPUT_PULLUP);
    pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A),  encoderLeftISR,  RISING);
    attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, RISING);

    // Sensores (pinos + ISRs no ECHO configurados internamente)
    inicializaSensores(TRIG_FRONT, ECHO_FRONT,
                       TRIG_LEFT,  ECHO_LEFT,
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


    delay(1000);    // só um tempo pra começar dps
}

// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------

void loop() {

    if (WiFi.status() != WL_CONNECTED) 
        connectWiFi();
    if (!mqttClient.connected())        
        connectMQTT();
    
    mqttClient.loop();

    unsigned long currentMillis = millis();

    // Telemetria MQTT (2s) 
    if (currentMillis - lastTelemetrySend >= 2000) {
        lastTelemetrySend = currentMillis;
        publishTelemetry();
    }

    // Serial (2s)
    if (currentMillis - lastSerialLog >= 2000) {
        lastSerialLog = currentMillis;
        Serial.println("\n--- [TELEMETRIA LOCAL] ---");
        Serial.printf("Distâncias -> F: %.2f cm | E: %.2f cm | D: %.2f cm\n", rato.distancia_frente, rato.distancia_esquerda, rato.distancia_direita);
        Serial.printf("Encoders   -> L: %ld | R: %ld\n", encoderLeftCount, encoderRightCount);
        Serial.printf("Motores    -> Status: %s\n", motorsRunning ? "EM MOVIMENTO" : "PARADO");
    }

    atualizaSensores();

    // Cada chamada executa 1 passo
    // switch (estado) {
    //     case EXPLORANDO: if(modo == DFS) passoDFS(); else passoFF(); break;
    //     case CORRIDA:  passoOtimizado(); break;
    //     case CONCLUIDO / parado:  ()     break;
    // }
}

const char* estadoStr() {
    switch (estado) {
        case PARADO: return "PARADO";
        case EXPLORANDO: return "EXPLORANDO";
        case CORRIDA:  return "CORRIDA";
        case CONCLUIDO:  return "CONCLUIDO";
        default:         return "?";
    }
}

void publishTelemetry() {
    if (WiFi.status() != WL_CONNECTED || !mqttClient.connected()) 
        return;

    StaticJsonDocument<768> doc;

    doc["robotId"] = ROBOT_ID;
    doc["step"] = stepCounter++;
    doc["tempoMs"] = millis();
    doc["modo"] = "DFS";
    doc["estado"] = motorsRunning ? "EXPLORANDO" : "PARADO";
    
    JsonObject posicao = doc.createNestedObject("posicao");
    posicao["x"] = rato.x;
    posicao["y"] = rato.y;
    
    const char* dirStr = rato.direcao == 'N' ? "norte" :
                         rato.direcao == 'S' ? "sul"   :
                         rato.direcao == 'L' ? "leste" : "oeste";
    doc["direcao"] = dirStr;
    
    
    doc["ultimomovimento"] = motorsRunning ? "frente" : "parado";
    
    
    JsonObject paredes = doc.createNestedObject("paredes");
    paredes["norte"] = lab.celula[rato.x][rato.y].norte;
    paredes["sul"]   = lab.celula[rato.x][rato.y].sul;
    paredes["leste"] = lab.celula[rato.x][rato.y].leste;
    paredes["oeste"] = lab.celula[rato.x][rato.y].oeste;
    
    JsonObject motores = doc.createNestedObject("motores");
    motores["pwmEsquerdo"] = rato.pwm_motor_esquerdo;
    motores["pwmDireito"]  = rato.pwm_motor_direito;
    
    JsonObject sensores = doc.createNestedObject("sensores");
    sensores["esquerdaCm"] = rato.distancia_esquerda;
    sensores["frenteCm"]   = rato.distancia_frente;
    sensores["direitaCm"]  = rato.distancia_direita;
    
    
    JsonObject energia = doc.createNestedObject("energia");
    energia["tensaoV"]   = 0.0;
    energia["correnteMa"] = 0.0;
    
    doc["conclusao"]        = (estado == CONCLUIDO);
    
    char buffer[512];
    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_TOPIC, buffer);
}
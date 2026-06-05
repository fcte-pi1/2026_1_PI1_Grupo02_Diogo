#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Importação das bibliotecas modulares da equipa
#include "../lib/utils/rato/rato.h"
#include "../lib/utils/mapa/labirinto.h"
#include "../lib/input/ultrassonico/sensores.h"
#include "../lib/output/motor/motor.h"
#include "../lib/utils/conexao/conexoes.h"
#include "../lib/utils/telemetria/telemetria.h"

#pragma region Variáveis

const char *MQTT_TOPIC = "rato/telemetria";
const char *ROBOT_ID = "UAV-MOUSE-01";

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

// Encoders
const uint8_t ENCODER_LEFT_A = 34;  const uint8_t ENCODER_LEFT_B = 35;
const uint8_t ENCODER_RIGHT_A = 32; const uint8_t ENCODER_RIGHT_B = 33;

// -------------------------------------------------------------------------------
//  LABIRINTO - posições de início e destino
// -------------------------------------------------------------------------------
#define INICIO_X 15
#define INICIO_Y 15

int destinoX = -1;
int destinoY = -1;

// -------------------------------------------------------------------------------
//  ESTADOS (A Máquina de Decisões)
// -------------------------------------------------------------------------------
enum Estado {
    PARADO,
    EXPLORANDO,
    CORRIDA,
    CONCLUIDO
};
Estado estado = EXPLORANDO; // O rato já começa no estado de exploração

// -------------------------------------------------------------------------------
//  GLOBAIS E TIMERS ASSÍNCRONOS
// -------------------------------------------------------------------------------
volatile long encoderLeftCount = 0;
volatile long encoderRightCount = 0;

unsigned long lastTelemetrySend = 0;
unsigned long lastSerialLog = 0;
unsigned long lastLedBlink = 0; // O seu timer do LED

bool motorsRunning = false;
bool ledState = false;
unsigned long stepCounter = 0;

Rato rato;
Labirinto lab;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

#pragma endregion

#pragma region Encoders
void IRAM_ATTR encoderLeftISR() { encoderLeftCount++; }
void IRAM_ATTR encoderRightISR() { encoderRightCount++; }
#pragma endregion

// -------------------------------------------------------------------------------
// SETUP
// -------------------------------------------------------------------------------
void setup() {
    Serial.begin(115200);
    mqttClient.setBufferSize(1024);

    pinMode(LED_PIN, OUTPUT);

    // Encoders
    pinMode(ENCODER_LEFT_A, INPUT_PULLUP);
    pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A), encoderLeftISR, RISING);
    attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, RISING);

    // Sensores e Motores (Usando as bibliotecas da equipa)
    inicializaSensores(TRIG_FRONT, ECHO_FRONT, TRIG_LEFT, ECHO_LEFT, TRIG_RIGHT, ECHO_RIGHT);
    inicializaMotores(MOTOR_LEFT_IN1, MOTOR_LEFT_IN2, MOTOR_RIGHT_IN1, MOTOR_RIGHT_IN2, &encoderLeftCount, &encoderRightCount);
    
    inicializaRato(&rato);
    inicializaLabirinto(&lab);

    // Rede
    connectWiFi();
    connectMQTT();

    delay(1000); 
}

// -------------------------------------------------------------------------------
// LOOP PRINCIPAL
// -------------------------------------------------------------------------------
void loop() {
    // 1. Manter a rede ativa
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    if (!mqttClient.connected()) connectMQTT();
    mqttClient.loop();

    unsigned long currentMillis = millis();

    // 2. Piscar o LED (A sua lógica visual para saber que não travou)
    if (currentMillis - lastLedBlink >= 250) {
        lastLedBlink = currentMillis;
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState);
    }

    // 3. Atualizar os Sensores (Salva as distâncias na struct 'rato')
    atualizaSensores();

    // 4. MÁQUINA DE ESTADOS (A Junção do seu Cérebro com a estrutura do GitHub)
    switch (estado) {
        case PARADO:
            // Aguardando comando
            break;

        case EXPLORANDO: {
            // ---> A SUA LÓGICA DE DESVIO DE PAREDES AQUI <---
            static unsigned long lastDecision = 0;
            if (currentMillis - lastDecision >= 100) {
                lastDecision = currentMillis;

                // Lê as distâncias de dentro da struct que a equipa criou
                if (rato.distancia_frente < 12.0) {
                    stopMotors();
                    delay(200);

                    if (rato.distancia_esquerda > 15.0) {
                        virarEsquerda90();
                    } else if (rato.distancia_direita > 15.0) {
                        virarDireita90();
                        
                    } else {
                        meiaVolta180();
                    }
                } else {
                    moveForward();
                }
            }
            break;
        }

        case CORRIDA:
            // Futura lógica de corrida otimizada
            break;

        case CONCLUIDO:
            stopMotors();
            break;
    }

    // 5. Envio de Telemetria (A cada 2 segundos)
    if (currentMillis - lastTelemetrySend >= 2000) {
        lastTelemetrySend = currentMillis;
        publishTelemetry(rato, lab, mqttClient, MQTT_TOPIC, ROBOT_ID, stepCounter, motorsRunning, estado == CONCLUIDO);
    }

    // 6. Monitor Serial Local (A cada 2 segundos)
    if (currentMillis - lastSerialLog >= 2000) {
        lastSerialLog = currentMillis;
        Serial.println("\n--- [TELEMETRIA LOCAL] ---");
        Serial.printf("Distâncias -> F: %.2f cm | E: %.2f cm | D: %.2f cm\n", rato.distancia_frente, rato.distancia_esquerda, rato.distancia_direita);
        Serial.printf("Encoders   -> L: %ld | R: %ld\n", encoderLeftCount, encoderRightCount);
        Serial.printf("Estado     -> %d\n", estado);
    }
}
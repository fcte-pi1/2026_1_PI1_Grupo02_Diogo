#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h> 

// ======================================================
//                CONFIGURAÇÕES GLOBAIS
// ======================================================
const char* WIFI_SSID = "SUA_REDE_WIFI"; // troque para o wifi que está conectado ao seu computador e a esp32
const char* WIFI_PASSWORD = "SUA_SENHA_WIFI"; // passe sua senha

const char* MQTT_BROKER = "192.168.x.x"; // ip do docker para conectar-se com mqtt (sua rede wifi)
const int MQTT_PORT = 1883;
const char* MQTT_TELEMETRY_TOPIC = "rato/telemetria";
const char* ROBOT_ID = "UAV-MOUSE-01";

// Pinagem
const int LED_PIN = 2;
const int TRIG_FRONT = 4;   const int ECHO_FRONT = 16;
const int TRIG_LEFT = 17;   const int ECHO_LEFT = 5;
const int TRIG_RIGHT = 18;  const int ECHO_RIGHT = 19;

// Motores
const int MOTOR_LEFT_IN1 = 25;  const int MOTOR_LEFT_IN2 = 26;
const int MOTOR_RIGHT_IN1 = 27; const int MOTOR_RIGHT_IN2 = 14;

// encoders
const int ENCODER_LEFT_A = 34;  const int ENCODER_LEFT_B = 35;
const int ENCODER_RIGHT_A = 32; const int ENCODER_RIGHT_B = 33;

// Variáveis Voláteis para Interrupções
volatile long encoderLeftCount = 0;
volatile long encoderRightCount = 0;

// Gerenciamento de Timers Assíncronos (Não-bloqueantes)
unsigned long lastTelemetrySend = 0;
unsigned long lastMotorToggle = 0;
unsigned long lastLedBlink = 0;
unsigned long lastSerialLog = 0;

bool motorsRunning = false;
bool ledState = false;
unsigned long stepCounter = 0;

WiFiClient wifiClient;
PubSubClient client(wifiClient);

// ======================================================
//                INTERRUPÇÕES (ISRs)
// ======================================================
void IRAM_ATTR encoderLeftISR() {
    // Se precisar de sentido (frente/trás), leia o pino B aqui
    encoderLeftCount++;
}

void IRAM_ATTR encoderRightISR() {
    encoderRightCount++;
}

// ======================================================
//                ROTINAS DE CONEXÃO
// ======================================================
void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;
    
    Serial.print("Conectando ao WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    // Bloqueio aceitável apenas no setup inicial
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.print("\nWiFi Conectado! IP: ");
    Serial.println(WiFi.localIP());
}

void connectMQTT() {
    client.setServer(MQTT_BROKER, MQTT_PORT);
    
    // Tentativa de conexão não-bloqueante se chamada dentro do loop
    if (!client.connected()) {
        Serial.print("Tentando conexão MQTT...");
        if (client.connect("ESP32Client")) {
            Serial.println("Conectado com sucesso!");
        } else {
            Serial.print("Falha, rc=");
            Serial.println(client.state());
        }
    }
}

// ======================================================
//                SENSORES E ATUADORES
// ======================================================
float readUltrasonic(int trigPin, int echoPin) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    // Timeout reduzido para 12000us (~200cm max) para evitar travar o loop
    long duration = pulseIn(echoPin, HIGH, 12000); 
    if (duration == 0) return 400.0f; // Se der timeout, considera caminho totalmente livre

    return (duration * 0.0343f) / 2.0f;
}

void stopMotors() {
    digitalWrite(MOTOR_LEFT_IN1, LOW);  digitalWrite(MOTOR_LEFT_IN2, LOW);
    digitalWrite(MOTOR_RIGHT_IN1, LOW); digitalWrite(MOTOR_RIGHT_IN2, LOW);
    motorsRunning = false;
}

void moveForward() {
    digitalWrite(MOTOR_LEFT_IN1, HIGH); digitalWrite(MOTOR_LEFT_IN2, LOW);
    digitalWrite(MOTOR_RIGHT_IN1, HIGH); digitalWrite(MOTOR_RIGHT_IN2, LOW);
    motorsRunning = true;
}

// ======================================================
//                ENVIO DE TELEMETRIA REAL
// ======================================================
void publishTelemetry(float front, float left, float right) {
    if (WiFi.status() != WL_CONNECTED || !client.connected()) return;

    StaticJsonDocument<768> doc;

    doc["robotId"] = ROBOT_ID;
    doc["step"] = stepCounter++;
    doc["tempoMs"] = millis();
    doc["modo"] = "DFS";
    doc["estado"] = motorsRunning ? "EXPLORANDO" : "PARADO";

    JsonObject posicao = doc.createNestedObject("posicao");
    posicao["x"] = 0; 
    posicao["y"] = 0;

    doc["direcao"] = "norte";
    doc["ultimomovimento"] = motorsRunning ? "frente" : "parado"; // Caixa baixa para bater com o DTO

    JsonObject paredes = doc.createNestedObject("paredes");
    paredes["norte"] = (front < 12.0f);
    paredes["sul"] = false;
    paredes["leste"] = (right < 12.0f);
    paredes["oeste"] = (left < 12.0f);

    JsonObject motores = doc.createNestedObject("motores");
    motores["pwmEsquerdo"] = motorsRunning ? 120 : 0; 
    motores["pwmDireito"] = motorsRunning ? 118 : 0;

    JsonObject sensores = doc.createNestedObject("sensores");
    sensores["esquerdaCm"] = round(left * 100) / 100;
    sensores["frenteCm"] = round(front * 100) / 100;
    sensores["direitaCm"] = round(right * 100) / 100;

    JsonObject energia = doc.createNestedObject("energia");
    energia["tensaoV"] = 0.0;     
    energia["correnteMa"] = 0.0; 

    doc["conclusao"] = false;

    char buffer[512];
    serializeJson(doc, buffer);
    
    client.publish(MQTT_TELEMETRY_TOPIC, buffer);
}

// ======================================================
//                SETUP SETUP
// ======================================================
void setup() {
    Serial.begin(115200);
    client.setBufferSize(1024);

    pinMode(LED_PIN, OUTPUT);
    pinMode(TRIG_FRONT, OUTPUT); pinMode(ECHO_FRONT, INPUT);
    pinMode(TRIG_LEFT, OUTPUT);  pinMode(ECHO_LEFT, INPUT);
    pinMode(TRIG_RIGHT, OUTPUT); pinMode(ECHO_RIGHT, INPUT);

    pinMode(MOTOR_LEFT_IN1, OUTPUT);  pinMode(MOTOR_LEFT_IN2, OUTPUT);
    pinMode(MOTOR_RIGHT_IN1, OUTPUT); pinMode(MOTOR_RIGHT_IN2, OUTPUT);

    pinMode(ENCODER_LEFT_A, INPUT_PULLUP);
    pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);

    attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A), encoderLeftISR, RISING);
    attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, RISING);

    connectWiFi();
    connectMQTT();
    stopMotors();
}

// ======================================================
//                LOOP LOOP (ASSÍNCRONO)
// ======================================================
void loop() {
    // Garante infraestrutura de rede ativa sem travar o processamento lógico
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    if (!client.connected()) connectMQTT();
    client.loop();

    unsigned long currentMillis = millis();

    // TIMER 1: Piscar LED sem delay (Inverte o estado a cada 250ms)
    if (currentMillis - lastLedBlink >= 250) {
        lastLedBlink = currentMillis;
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState);
    }

    // TIMER 2: Lógica de alternância dos motores (Cada 5 segundos)
    if (currentMillis - lastMotorToggle >= 5000) {
        lastMotorToggle = currentMillis;
        if (motorsRunning) {
            stopMotors();
        } else {
            moveForward();
        }
    }

    // Leituras constantes dos sensores para tomada de decisão em tempo real
    float frontDistance = readUltrasonic(TRIG_FRONT, ECHO_FRONT);
    float leftDistance = readUltrasonic(TRIG_LEFT, ECHO_LEFT);
    float rightDistance = readUltrasonic(TRIG_RIGHT, ECHO_RIGHT);

    // TIMER 3: Envio de Telemetria via MQTT (A cada 2 segundos)
    if (currentMillis - lastTelemetrySend >= 2000) {
        lastTelemetrySend = currentMillis;
        publishTelemetry(frontDistance, leftDistance, rightDistance);
    }

    // TIMER 4: Exibição no Monitor Serial (A cada 1 segundo)
    if (currentMillis - lastSerialLog >= 1000) {
        lastSerialLog = currentMillis;
        Serial.println("\n--- [TELEMETRIA LOCAL] ---");
        Serial.printf("Distâncias -> F: %.2f cm | E: %.2f cm | D: %.2f cm\n", frontDistance, leftDistance, rightDistance);
        Serial.printf("Encoders   -> L: %ld | R: %ld\n", encoderLeftCount, encoderRightCount);
        Serial.printf("Motores    -> Status: %s\n", motorsRunning ? "EM MOVIMENTO" : "PARADO");
    }
}
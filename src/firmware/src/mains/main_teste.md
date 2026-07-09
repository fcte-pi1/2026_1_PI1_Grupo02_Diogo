/*
    Esse código testa os motores, conexão wifi / mqtt e sensores
*/

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <VL6180X.h>
#include <Adafruit_INA219.h>
#include <ArduinoOTA.h>

// ============================================================
//  REDE — ajuste conforme seu ambiente
// ============================================================
const char* WIFI_SSID     = "ALLREDE-CASA28";
const char* WIFI_PASSWORD = "tata060428";
const char* MQTT_BROKER   = "192.168.1.11";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "rato/telemetria";
const char* ROBOT_ID      = "UAV-MOUSE-01";

// ============================================================
//  PINAGEM
// ============================================================
const uint8_t LED_PIN = 2;

// VL6180X frontal — Wire1 dedicado
#define FRENTE_SDA 21
#define FRENTE_SCL 19

// INA219 — Wire dedicado (NÃO compartilha com o sensor)
const uint8_t INA219_SDA = 19;
const uint8_t INA219_SCL = 2;

// Motores (Ponte H — LEDC/PWM)
const uint8_t MOTOR_LEFT_IN1  = 26;
const uint8_t MOTOR_LEFT_IN2  = 25;
const uint8_t MOTOR_RIGHT_IN1 = 14;
const uint8_t MOTOR_RIGHT_IN2 = 27;

// Encoders
const uint8_t ENCODER_LEFT_A  = 32;
const uint8_t ENCODER_LEFT_B  = 33;
const uint8_t ENCODER_RIGHT_A = 34;
const uint8_t ENCODER_RIGHT_B = 35;

// ============================================================
//  LEDC — canais PWM dos motores
// ============================================================
const int PWM_FREQ = 5000;
const int PWM_RES  = 8;
const int CH_L_IN1 = 0;
const int CH_L_IN2 = 1;
const int CH_R_IN1 = 2;
const int CH_R_IN2 = 3;

const int VEL_TESTE = 140;

// ============================================================
//  OBJETOS GLOBAIS
// ============================================================
VL6180X        vlFrente;
Adafruit_INA219 ina219;

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// ============================================================
//  VARIÁVEIS DE ESTADO
// ============================================================
volatile long encoderLeftCount  = 0;
volatile long encoderRightCount = 0;

bool  motorsRunning    = false;
bool  ledState         = false;
unsigned long stepCounter       = 0;
unsigned long lastTelemetrySend = 0;
unsigned long lastSerialLog     = 0;
unsigned long lastLedBlink      = 0;
unsigned long lastMotorToggle   = 0;

float distFrente = 400.0f;
float tensaoV    = 0.0f;
float correnteMa = 0.0f;

// ============================================================
//  ISRs — ENCODERS
// ============================================================
void IRAM_ATTR encoderLeftISR()  { encoderLeftCount++;  }
void IRAM_ATTR encoderRightISR() { encoderRightCount++; }

// ============================================================
//  VL6180X — inicialização
// ============================================================
void inicializaSensores()
{
    Wire1.begin(FRENTE_SDA, FRENTE_SCL);
    Wire1.setClock(100000);

    vlFrente.setBus(&Wire1);
    vlFrente.setTimeout(500);

    if (vlFrente.init()) {
        vlFrente.configureDefault();
        Serial.println("[SENSOR] VL6180X (frente) OK");
    } else {
        Serial.println("[SENSOR] ERRO: VL6180X nao detectado (SDA=21 SCL=19)");
    }
}

void lerSensores()
{
    uint8_t mmF = vlFrente.readRangeSingle();
    distFrente = (vlFrente.timeoutOccurred() || mmF == 255)
                 ? 400.0f : mmF / 10.0f;
}

// ============================================================
//  MOTORES — LEDC/PWM
// ============================================================
void setupMotores()
{
    ledcSetup(CH_L_IN1, PWM_FREQ, PWM_RES); ledcAttachPin(MOTOR_LEFT_IN1,  CH_L_IN1);
    ledcSetup(CH_L_IN2, PWM_FREQ, PWM_RES); ledcAttachPin(MOTOR_LEFT_IN2,  CH_L_IN2);
    ledcSetup(CH_R_IN1, PWM_FREQ, PWM_RES); ledcAttachPin(MOTOR_RIGHT_IN1, CH_R_IN1);
    ledcSetup(CH_R_IN2, PWM_FREQ, PWM_RES); ledcAttachPin(MOTOR_RIGHT_IN2, CH_R_IN2);
}

void acionarMotores(int velEsq, int velDir)
{
    if      (velEsq > 0) { ledcWrite(CH_L_IN1, velEsq);        ledcWrite(CH_L_IN2, 0);           }
    else if (velEsq < 0) { ledcWrite(CH_L_IN1, 0);             ledcWrite(CH_L_IN2, abs(velEsq)); }
    else                 { ledcWrite(CH_L_IN1, 0);              ledcWrite(CH_L_IN2, 0);           }

    if      (velDir > 0) { ledcWrite(CH_R_IN1, velDir);        ledcWrite(CH_R_IN2, 0);           }
    else if (velDir < 0) { ledcWrite(CH_R_IN1, 0);             ledcWrite(CH_R_IN2, abs(velDir)); }
    else                 { ledcWrite(CH_R_IN1, 0);              ledcWrite(CH_R_IN2, 0);           }

    motorsRunning = (velEsq != 0 || velDir != 0);
}

void stopMotors()  { acionarMotores(0, 0); }

void moveForward()
{
    acionarMotores(VEL_TESTE, VEL_TESTE);
    Serial.println("[MOTOR] Frente");
}

void turnLeft()
{
    acionarMotores(-VEL_TESTE, VEL_TESTE);
    Serial.println("[MOTOR] Esquerda");
}

void turnRight()
{
    acionarMotores(VEL_TESTE, -VEL_TESTE);
    Serial.println("[MOTOR] Direita");
}

// ============================================================
//  REDE — WiFi + MQTT
// ============================================================
void connectWiFi()
{
    if (WiFi.status() == WL_CONNECTED) return;
    Serial.print("WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.printf(" OK (%s)\n", WiFi.localIP().toString().c_str());
}

void connectMQTT()
{
    if (mqttClient.connected()) return;
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    char id[32];
    snprintf(id, sizeof(id), "ESP32-%06llX", (unsigned long long)(ESP.getEfuseMac() & 0xFFFFFF));
    Serial.printf("MQTT (%s)...", id);
    if (mqttClient.connect(id)) Serial.println("OK");
    else                        Serial.printf(" falha rc=%d\n", mqttClient.state());
}

// ============================================================
//  OTA
// ============================================================
void initOTA()
{
    ArduinoOTA.setHostname("micromouse");
    ArduinoOTA.onStart([]()  { Serial.println("[OTA] Iniciando..."); });
    ArduinoOTA.onEnd([]()    { Serial.println("\n[OTA] OK"); });
    ArduinoOTA.onProgress([](unsigned int p, unsigned int t) {
        Serial.printf("[OTA] %u%%\r", (p * 100) / t);
    });
    ArduinoOTA.onError([](ota_error_t e) {
        Serial.printf("[OTA] Erro[%u]\n", e);
    });
    ArduinoOTA.begin();
    Serial.printf("[OTA] Pronto — micromouse.local | %s\n",
                  WiFi.localIP().toString().c_str());
}

// ============================================================
//  TELEMETRIA MQTT
// ============================================================
void publishTelemetry()
{
    if (!mqttClient.connected()) return;

    StaticJsonDocument<1024> doc;
    char buffer[768];

    doc["robotId"]  = ROBOT_ID;
    doc["step"]     = stepCounter++;
    doc["tempoMs"]  = millis();
    doc["modo"]     = "TESTE";
    doc["estado"]   = motorsRunning ? "MOVENDO" : "PARADO";
    doc["direcao"]  = "norte";
    doc["ultimoMovimento"] = motorsRunning ? "frente" : "parado";
    doc["conclusao"] = false;

    JsonObject posicao = doc.createNestedObject("posicao");
    posicao["x"] = 0; posicao["y"] = 0;

    JsonObject paredes = doc.createNestedObject("paredes");
    paredes["norte"] = (distFrente < 12.0f);
    paredes["sul"]   = false;
    paredes["leste"] = false;
    paredes["oeste"] = false;

    JsonObject motores = doc.createNestedObject("motores");
    motores["pwmEsquerdo"] = motorsRunning ? VEL_TESTE : 0;
    motores["pwmDireito"]  = motorsRunning ? VEL_TESTE : 0;

    JsonObject sensores = doc.createNestedObject("sensores");
    sensores["frenteCm"] = distFrente;

    JsonObject energia = doc.createNestedObject("energia");
    energia["tensaoV"]    = tensaoV;
    energia["correnteMa"] = correnteMa;

    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_TOPIC, buffer);
}

// ============================================================
//  SETUP
// ============================================================
void setup()
{
    Serial.begin(115200);
    mqttClient.setBufferSize(1024);

    pinMode(LED_PIN, OUTPUT);

    pinMode(ENCODER_LEFT_A,  INPUT_PULLUP);
    pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A),  encoderLeftISR,  RISING);
    attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, RISING);

    setupMotores();
    stopMotors();

    inicializaSensores();

    Wire.begin(INA219_SDA, INA219_SCL);
    if (!ina219.begin()) Serial.println("[INA219] ERRO");
    else                 Serial.println("[INA219] OK");

    connectWiFi();
    connectMQTT();
    initOTA();

    Serial.println("\n=== BANCADA DE TESTE PRONTA ===");
    Serial.println("Ciclo: frente(5s) -> esquerda(5s) -> direita(5s) -> parado(5s)");
    delay(3000);
}

// ============================================================
//  LOOP
// ============================================================
void loop()
{
    ArduinoOTA.handle();

    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    if (!mqttClient.connected())       connectMQTT();
    mqttClient.loop();

    unsigned long now = millis();

    if (now - lastLedBlink >= 250) {
        lastLedBlink = now;
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState);
    }

    lerSensores();
    tensaoV    = ina219.getBusVoltage_V();
    correnteMa = ina219.getCurrent_mA();

    if (now - lastMotorToggle >= 5000) {
        lastMotorToggle = now;
        static int fase = 0;
        switch (fase % 4) {
            case 0: moveForward(); break;
            case 1: turnLeft();    break;
            case 2: turnRight();   break;
            case 3: stopMotors();  Serial.println("[MOTOR] Parado"); break;
        }
        fase++;
    }

    if (now - lastTelemetrySend >= 2000) {
        lastTelemetrySend = now;
        publishTelemetry();
    }

    if (now - lastSerialLog >= 1000) {
        lastSerialLog = now;
        Serial.println("\n--- [TELEMETRIA LOCAL] ---");
        Serial.printf("Frente: %.1f cm\n", distFrente);
        Serial.printf("Encoders L: %ld  R: %ld\n", encoderLeftCount, encoderRightCount);
        Serial.printf("Motores: %s\n", motorsRunning ? "EM MOVIMENTO" : "PARADO");
        Serial.printf("Energia: %.2f V  %.2f mA\n", tensaoV, correnteMa);
    }
}

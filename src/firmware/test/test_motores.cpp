#ifdef ARDUINO

#include <Arduino.h>

// Pinos dos Sensores
const int TRIG_FRONT = 4;   const int ECHO_FRONT = 16;
const int TRIG_LEFT = 17;   const int ECHO_LEFT = 5;
const int TRIG_RIGHT = 18;  const int ECHO_RIGHT = 19;

// Pinos dos Motores
const int MOTOR_LEFT_IN1 = 25;  const int MOTOR_LEFT_IN2 = 26;
const int MOTOR_RIGHT_IN1 = 27; const int MOTOR_RIGHT_IN2 = 14;

// Configurações PWM
const int FREQUENCIA_PWM = 5000; 
const int RESOLUCAO_PWM = 8;     
const int CANAL_ESQ_IN1 = 0; const int CANAL_ESQ_IN2 = 1;
const int CANAL_DIR_IN1 = 2; const int CANAL_DIR_IN2 = 3;

// ==========================================
// FUNÇÕES DE BASE
// ==========================================
float readUltrasonic(int trigPin, int echoPin) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    long duration = pulseIn(echoPin, HIGH, 12000); 
    if (duration == 0) return 400.0f; 
    return (duration * 0.0343f) / 2.0f;
}

void acionarMotores(int velEsquerda, int velDireita) {
    if (velEsquerda > 0) {
        ledcWrite(CANAL_ESQ_IN1, velEsquerda); ledcWrite(CANAL_ESQ_IN2, 0);           
    } else if (velEsquerda < 0) {
        ledcWrite(CANAL_ESQ_IN1, 0); ledcWrite(CANAL_ESQ_IN2, abs(velEsquerda)); 
    } else {
        ledcWrite(CANAL_ESQ_IN1, 0); ledcWrite(CANAL_ESQ_IN2, 0);
    }

    if (velDireita > 0) {
        ledcWrite(CANAL_DIR_IN1, velDireita); ledcWrite(CANAL_DIR_IN2, 0);
    } else if (velDireita < 0) {
        ledcWrite(CANAL_DIR_IN1, 0); ledcWrite(CANAL_DIR_IN2, abs(velDireita));
    } else {
        ledcWrite(CANAL_DIR_IN1, 0); ledcWrite(CANAL_DIR_IN2, 0);
    }
}

void stopMotors() { acionarMotores(0, 0); }
void moveForward() { acionarMotores(140, 140); }

void virarDireita90() {
    acionarMotores(150, -150);
    delay(600);
    stopMotors();
    delay(200); 
}

void virarEsquerda90() {
    acionarMotores(-150, 150);
    delay(600);
    stopMotors();
    delay(200);
}

void meiaVolta180() {
    acionarMotores(150, -150);
    delay(1200);
    stopMotors();
    delay(200);
}

// ==========================================
// SETUP E LOOP DE TESTE ISOLADO
// ==========================================
void setup() {
    Serial.begin(115200);
    Serial.println("--- INICIANDO TESTE ISOLADO DO ROBÔ ---");

    pinMode(TRIG_FRONT, OUTPUT); pinMode(ECHO_FRONT, INPUT);
    pinMode(TRIG_LEFT, OUTPUT);  pinMode(ECHO_LEFT, INPUT);
    pinMode(TRIG_RIGHT, OUTPUT); pinMode(ECHO_RIGHT, INPUT);

    ledcSetup(CANAL_ESQ_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_LEFT_IN1, CANAL_ESQ_IN1);
    ledcSetup(CANAL_ESQ_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_LEFT_IN2, CANAL_ESQ_IN2);
    ledcSetup(CANAL_DIR_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_RIGHT_IN1, CANAL_DIR_IN1);
    ledcSetup(CANAL_DIR_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_RIGHT_IN2, CANAL_DIR_IN2);
    
    stopMotors();
}

void loop() {
    float frontDistance = readUltrasonic(TRIG_FRONT, ECHO_FRONT);
    float leftDistance = readUltrasonic(TRIG_LEFT, ECHO_LEFT);
    float rightDistance = readUltrasonic(TRIG_RIGHT, ECHO_RIGHT);

    static unsigned long lastDecision = 0;
    unsigned long currentMillis = millis();
    
    if (currentMillis - lastDecision >= 100) {
        lastDecision = currentMillis;

        if (frontDistance < 12.0) { 
            stopMotors();
            delay(200); 
            
            if (leftDistance > 15.0) {
                Serial.println("Parede na frente! Virando à Esquerda.");
                virarEsquerda90();
            } else if (rightDistance > 15.0) {
                Serial.println("Parede na frente! Virando à Direita.");
                virarDireita90();
            } else {
                Serial.println("Beco sem saída! Meia-volta.");
                meiaVolta180(); 
            }
        } else {
            moveForward();
    }
}

#endif
}
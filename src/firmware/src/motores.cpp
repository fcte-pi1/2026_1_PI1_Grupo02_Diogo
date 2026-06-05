#include "../lib/motores.h"
#include "../lib/pinout.h"


// Configurações PWM
const int FREQUENCIA_PWM = 5000; 
const int RESOLUCAO_PWM = 8;     
const int CANAL_ESQ_IN1 = 0; const int CANAL_ESQ_IN2 = 1;
const int CANAL_DIR_IN1 = 2; const int CANAL_DIR_IN2 = 3;


const int TEMPO_CURVA_90 = 600;  
const int VELOCIDADE_GIRO = 150; 

int velocidadeEsquerdaAtual = 0;
int velocidadeDireitaAtual = 0;
bool motorsRunning = false;

void setupMotores() {
    ledcSetup(CANAL_ESQ_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_LEFT_IN1, CANAL_ESQ_IN1);
    ledcSetup(CANAL_ESQ_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_LEFT_IN2, CANAL_ESQ_IN2);
    ledcSetup(CANAL_DIR_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_RIGHT_IN1, CANAL_DIR_IN1);
    ledcSetup(CANAL_DIR_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(MOTOR_RIGHT_IN2, CANAL_DIR_IN2);
    stopMotors();
}

void acionarMotores(int velEsquerda, int velDireita) {
    velocidadeEsquerdaAtual = velEsquerda;
    velocidadeDireitaAtual = velDireita;

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
    motorsRunning = (velEsquerda != 0 || velDireita != 0);
}

void stopMotors() { acionarMotores(0, 0); }
void moveForward() { acionarMotores(140, 140); }

void virarDireita90() {
    Serial.println("[MANOBRA] Virando 90° para a Direita...");
    acionarMotores(VELOCIDADE_GIRO, -VELOCIDADE_GIRO);
    delay(TEMPO_CURVA_90);
    stopMotors();
    delay(200); 
}

void virarEsquerda90() {
    Serial.println("[MANOBRA] Virando 90° para a Esquerda...");
    acionarMotores(-VELOCIDADE_GIRO, VELOCIDADE_GIRO);
    delay(TEMPO_CURVA_90);
    stopMotors();
    delay(200);
}

void meiaVolta180() {
    Serial.println("[MANOBRA] Dando meia volta (180°)...");
    acionarMotores(VELOCIDADE_GIRO, -VELOCIDADE_GIRO);
    delay(TEMPO_CURVA_90 * 2); 
    stopMotors();
    delay(200);
}
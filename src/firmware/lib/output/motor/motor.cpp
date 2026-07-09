#include "./motor.h"
#include <math.h>

// -- Pinos e encoders (registrados em inicializaMotores) ----------------------
static uint8_t _in1L, _in2L;
static uint8_t _in1R, _in2R;
static volatile long *_encEsq;
static volatile long *_encDir;

// -------------------------------------------------------------------------------
//  Inicializa motores
// -------------------------------------------------------------------------------
void inicializaMotores(uint8_t in1L, uint8_t in2L,
                       uint8_t in1R, uint8_t in2R,
                       volatile long *encEsq, volatile long *encDir)
{
    _in1L = in1L;
    _in2L = in2L;
    _in1R = in1R;
    _in2R = in2R;
    _encEsq = encEsq;
    _encDir = encDir;

    pinMode(_in1L, OUTPUT);
    pinMode(_in2L, OUTPUT);
    pinMode(_in1R, OUTPUT);
    pinMode(_in2R, OUTPUT);

    // motors parados no começo
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, LOW);
}


// -------------------------------------------------------------------------------
// CONFIGURAÇÕES PWM, ODOMETRIA E CONTROLE PID 
// -------------------------------------------------------------------------------

// Configurações PWM da ESP32
const int FREQUENCIA_PWM = 5000; 
const int RESOLUCAO_PWM = 8;     
const int CANAL_ESQ_IN1 = 0; const int CANAL_ESQ_IN2 = 1;
const int CANAL_DIR_IN1 = 2; const int CANAL_DIR_IN2 = 3;

// Velocidade de cruzeiro reduzida (ajuste ao gosto)
int VELOCIDADE_BASE_PWM = 120;

const int PWM_MINIMO_MOVIMENTO = 90;

// Começa com velocidade alta para sair do atrito e dps reduz para velocidade_base
const int KICK_PWM = 200;
const unsigned long KICK_DURACAO_MS = 120;

// Acelera a roda dps de travar
const unsigned long TIMEOUT_STALL_MS = 200;

// Constantes de Manobra
const int VELOCIDADE_GIRO = 200; 

int velocidadeEsquerdaAtual = 0;
int velocidadeDireitaAtual = 0;
bool motorsRunning = false;

float velocidadeEsqCmS = 0.0;
float velocidadeDirCmS = 0.0;
float distanciaPercorridaCm = 0.0;

long ultimosPulsosEsq = 0;
long ultimosPulsosDir = 0;
unsigned long ultimoTempoOdometria = 0;

// -------------------------------------------------------------------------------
// CONSTANTES DO PID 
// -------------------------------------------------------------------------------
float Kp = 1.2;  // Corrige o erro atual (força da correção de desvio)
float Kd = 0.5;  // Evita que o robô balance (freio da correção)
float Ki = 0.0;  // Corrige erros acumulados (geralmente começa em 0)

long erroAnteriorPID = 0;
long integralPID = 0;

long erroBasePID = 0;

// -------------------------------------------------------------------------------
// Funções de motor (auxiliar)
// -------------------------------------------------------------------------------
static void _fowardMotors()
{
    ledcWrite(CANAL_ESQ_IN1, 255); ledcWrite(CANAL_ESQ_IN2, 0);
    ledcWrite(CANAL_DIR_IN1, 255); ledcWrite(CANAL_DIR_IN2, 0);
}

static void _rotateLeftMotors()
{
    ledcWrite(CANAL_ESQ_IN1, 0);   ledcWrite(CANAL_ESQ_IN2, VELOCIDADE_GIRO);
    ledcWrite(CANAL_DIR_IN1, VELOCIDADE_GIRO); ledcWrite(CANAL_DIR_IN2, 0);
}

static void _rotateRightMotors()
{
    ledcWrite(CANAL_ESQ_IN1, VELOCIDADE_GIRO); ledcWrite(CANAL_ESQ_IN2, 0);
    ledcWrite(CANAL_DIR_IN1, 0);   ledcWrite(CANAL_DIR_IN2, VELOCIDADE_GIRO);
}

static void _freio()
{
    ledcWrite(CANAL_ESQ_IN1, 255); ledcWrite(CANAL_ESQ_IN2, 255);
    ledcWrite(CANAL_DIR_IN1, 255); ledcWrite(CANAL_DIR_IN2, 255);
}

static void _freioEsquerdo()
{
    ledcWrite(CANAL_ESQ_IN1, 255); ledcWrite(CANAL_ESQ_IN2, 255);
}
static void _freioDireito()
{
    ledcWrite(CANAL_DIR_IN1, 255); ledcWrite(CANAL_DIR_IN2, 255);
}

static void _esperarEncoder(long pulsos)
{
    long baseEsq = *_encEsq;
    long baseDir = *_encDir;
    bool esqParado = false, dirParado = false;

    while (!esqParado || !dirParado)
    {
        if (!esqParado && (*_encEsq - baseEsq) >= pulsos) {
            _freioEsquerdo();
            esqParado = true;
        }
        if (!dirParado && (*_encDir - baseDir) >= pulsos) {
            _freioDireito();
            dirParado = true;
        }
        yield();
    }
}

// -------------------------------------------------------------------------------
//  GEOMETRIA - constantes derivadas (não estão corretas: 13,8 ~ 18cm por exemplo)
//
//  CM_POR_PULSO      : quanto a roda anda (em cm) a cada pulso de encoder
//  PULSOS_POR_CELULA : pulsos para percorrer 1 célula do labirinto (18 cm)
//  PULSOS_GIRO_90    : pulsos para girar 90° em torno do próprio eixo
//  PULSOS_GIRO_180   : pulsos para girar 180° em torno do próprio eixo
//
//  O giro no próprio eixo faz cada roda percorrer um arco de raio igual à
//  metade da distância entre rodas (DISTANCIA_ENTRE_RODAS_CM / 2).
// -------------------------------------------------------------------------------
const float CM_POR_PULSO = (DIAMETRO_RODA_CM * PI) / PULSOS_POR_VOLTA_RODA;

long calculaPulsosDistancia(float distanciaCm)
{
    return lround(distanciaCm / CM_POR_PULSO);
}

long calculaPulsosAngulo(float graus)
{
    float arcoCm = (fabs(graus) * PI / 180.0f) * (DISTANCIA_ENTRE_RODAS_CM / 2.0f);
    return lround(arcoCm / CM_POR_PULSO);
}

const long PULSOS_POR_CELULA = calculaPulsosDistancia(TAMANHO_CELULA_CM);
const long PULSOS_GIRO_90_ESQ    = calculaPulsosAngulo(74.8f);              // 74.8 vai ser ~ 90° 
const long PULSOS_GIRO_90_DIR    = calculaPulsosAngulo(76.6f);              // 76.6 vai ser ~ 90°

const long PULSOS_GIRO_180   = calculaPulsosAngulo(2 * 76.6f);                      //  2x direita

// -------------------------------------------------------------------------------
//  ATUALIZAÇÃO DE POSIÇÃO E DIREÇÃO
// -------------------------------------------------------------------------------
static const char _dirs[] = {'N', 'L', 'S', 'O'};

static int _indiceDirecao(char d)
{
    for (int i = 0; i < 4; i++)
        if (_dirs[i] == d)
            return i;
    return 0;
}

static void _atualizaDirecao(Rato *rato, int delta)
{
    rato->direcao = _dirs[(_indiceDirecao(rato->direcao) + delta + 4) % 4];
}

static void _atualizaPosicao(Rato *rato)
{
    switch (rato->direcao)
    {
    case 'N':
        rato->y++;
        break;
    case 'S':
        rato->y--;
        break;
    case 'L':
        rato->x++;
        break;
    case 'O':
        rato->x--;
        break;
    }
}

// -------------------------------------------------------------------------------
//  MOVIMENTOS "DE GRADE" (usados pelo DFS/FloodFill) - assinatura inalterada
// -------------------------------------------------------------------------------
void Andar(Rato *rato)
{
    andarDistancia(13.8); // 13.8 está andando ~ 18cm
}

void VirarEsquerda(Rato *rato)
{
    _rotateLeftMotors();
    _esperarEncoder(PULSOS_GIRO_90_ESQ);
    _atualizaDirecao(rato, -1); // N→O→S→L→N (anti-horário)
    // delay(200);
}

void VirarDireita(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_90_DIR);
    _atualizaDirecao(rato, +1); // N→L→S→O→N (horário)
    // delay(200);
}

void Virar180(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_180);
    _atualizaDirecao(rato, +2); // N↔S | L↔O
    // delay(200);
}

// -------------------------------------------------------------------------------
// FUNÇÕES PWM BASE
// -------------------------------------------------------------------------------
void setupMotores() {
    ledcSetup(CANAL_ESQ_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in1L, CANAL_ESQ_IN1);
    ledcSetup(CANAL_ESQ_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in2L, CANAL_ESQ_IN2);
    ledcSetup(CANAL_DIR_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in1R, CANAL_DIR_IN1);
    ledcSetup(CANAL_DIR_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in2R, CANAL_DIR_IN2);
    stopMotors();
}

void acionarMotores(int velEsquerda, int velDireita) {
    velocidadeEsquerdaAtual = velEsquerda;
    velocidadeDireitaAtual = velDireita;

    // Motor Esquerdo
    if (velEsquerda > 0) {
        ledcWrite(CANAL_ESQ_IN1, velEsquerda); ledcWrite(CANAL_ESQ_IN2, 0);           
    } else if (velEsquerda < 0) {
        ledcWrite(CANAL_ESQ_IN1, 0); ledcWrite(CANAL_ESQ_IN2, abs(velEsquerda)); 
    } else {
        ledcWrite(CANAL_ESQ_IN1, 0); ledcWrite(CANAL_ESQ_IN2, 0);
    }

    // Motor Direito
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
void moveForward() { acionarMotores(200, 200); }


// -------------------------------------------------------------------------------
// CÁLCULO DE VELOCIDADE E ALINHAMENTO PID EM TEMPO REAL
// -------------------------------------------------------------------------------
void atualizarOdometriaEPID() {
    unsigned long tempoAtual = millis();
    unsigned long deltaTempo = tempoAtual - ultimoTempoOdometria;

    if (deltaTempo >= 50) {
        long pulsosAtuaisEsq = *_encEsq;
        long pulsosAtuaisDir = *_encDir;

        long deltaPulsosEsq = pulsosAtuaisEsq - ultimosPulsosEsq;
        long deltaPulsosDir = pulsosAtuaisDir - ultimosPulsosDir;

        velocidadeEsqCmS = (deltaPulsosEsq * CM_POR_PULSO) / (deltaTempo / 1000.0);
        velocidadeDirCmS = (deltaPulsosDir * CM_POR_PULSO) / (deltaTempo / 1000.0);

        ultimosPulsosEsq = pulsosAtuaisEsq;
        ultimosPulsosDir = pulsosAtuaisDir;
        ultimoTempoOdometria = tempoAtual;

        if (velocidadeEsquerdaAtual > 0 && velocidadeDireitaAtual > 0) {
            long erro = (pulsosAtuaisEsq - pulsosAtuaisDir) - erroBasePID;

            integralPID += erro;
            long derivativa = erro - erroAnteriorPID;
            erroAnteriorPID = erro;

            int ajustePWM = (Kp * erro) + (Ki * integralPID) + (Kd * derivativa);

            int limiteCorrecao = 255 - VELOCIDADE_BASE_PWM;
            ajustePWM = constrain(ajustePWM, -limiteCorrecao, limiteCorrecao);

            int basePWM = VELOCIDADE_BASE_PWM;
            int novoPwmEsq = basePWM - ajustePWM;
            int novoPwmDir = basePWM + ajustePWM;

            novoPwmEsq = constrain(novoPwmEsq, PWM_MINIMO_MOVIMENTO, 255);
            novoPwmDir = constrain(novoPwmDir, PWM_MINIMO_MOVIMENTO, 255);

            ledcWrite(CANAL_ESQ_IN1, novoPwmEsq);
            ledcWrite(CANAL_DIR_IN1, novoPwmDir);
        }
    }
}

// -------------------------------------------------------------------------------
// FUNÇÃO INTELIGENTE: ANDAR DISTÂNCIA COM PID
// -------------------------------------------------------------------------------
void andarDistancia(float distanciaCm) {
    long pulsosAlvo = distanciaCm / CM_POR_PULSO;

    long baseEsq = *_encEsq;
    long baseDir = *_encDir;

    erroBasePID = baseEsq - baseDir;
    erroAnteriorPID = 0;
    integralPID = 0;

    // Impulso inicial
    acionarMotores(KICK_PWM, KICK_PWM);
    unsigned long tKick = millis();
    while (millis() - tKick < KICK_DURACAO_MS) {
        yield();
    }

    // Velocidade base
    moveForward();
    ultimoTempoOdometria = millis();
    ultimosPulsosEsq = *_encEsq;
    ultimosPulsosDir = *_encDir;

    unsigned long tProgressoEsq = millis();
    unsigned long tProgressoDir = millis();
    long ultimoEsq = *_encEsq;
    long ultimoDir = *_encDir;

    bool esqChegou = false, dirChegou = false;

    while (!esqChegou || !dirChegou) {
        long atualEsq = *_encEsq;
        long atualDir = *_encDir;

        // Freia a roda qnd chega no pulso esperado 
        if (!esqChegou && (atualEsq - baseEsq) >= pulsosAlvo) {
            _freioEsquerdo();
            esqChegou = true;
        }
        if (!dirChegou && (atualDir - baseDir) >= pulsosAlvo) {
            _freioDireito();
            dirChegou = true;
        }

        
        if (!esqChegou && !dirChegou) {
            atualizarOdometriaEPID();
        }

        if (!esqChegou) {
            if (atualEsq != ultimoEsq) { ultimoEsq = atualEsq; tProgressoEsq = millis(); }
            if (millis() - tProgressoEsq > TIMEOUT_STALL_MS) {
                ledcWrite(CANAL_ESQ_IN1, 255);
            }
        }
        if (!dirChegou) {
            if (atualDir != ultimoDir) { ultimoDir = atualDir; tProgressoDir = millis(); }
            if (millis() - tProgressoDir > TIMEOUT_STALL_MS) {
                ledcWrite(CANAL_DIR_IN1, 255);
            }
        }

        yield();
    }

    _freio();
    // delay(200);
}
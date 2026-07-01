#include "./motor.h"



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

    // motors parados no cmc
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, LOW);
}

// -------------------------------------------------------------------------------
// Funções de motor (auxiliar)
// -------------------------------------------------------------------------------
static void _stopMotors()
{
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, LOW);
}

static void _fowardMotors()
{
    digitalWrite(_in1L, HIGH);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, HIGH);
    digitalWrite(_in2R, LOW);
}

// Curva a esquerda
static void _rotateLeftMotors()
{
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, HIGH);
    digitalWrite(_in1R, HIGH);
    digitalWrite(_in2R, LOW);
}

// Curva direita
static void _rotateRightMotors()
{
    digitalWrite(_in1L, HIGH);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, HIGH);
}

static void _esperarEncoder(long pulsos)
{ // Pra saber quando ele andou o suficiente(1 celula, 90° ou 180°)
    long baseEsq = *_encEsq;
    long baseDir = *_encDir;

    while ((*_encEsq - baseEsq) < pulsos || (*_encDir - baseDir) < pulsos)
    {
        yield();
    }
    _stopMotors();
}

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
//  MOVIMENTOS PÚBLICOS
// -------------------------------------------------------------------------------
void Andar(Rato *rato)
{
    _fowardMotors();
    _esperarEncoder(PULSOS_POR_CELULA);
    _atualizaPosicao(rato);

    // Salva contagem total nos campos do micromouse
    rato->encoder_esquerdo = *_encEsq;
    rato->encoder_direito = *_encDir;
}

void VirarEsquerda(Rato *rato)
{
    _rotateLeftMotors();
    _esperarEncoder(PULSOS_GIRO_90);
    _atualizaDirecao(rato, -1); // N→O→S→L→N (anti-horário)
}

void VirarDireita(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_90);
    _atualizaDirecao(rato, +1); // N→L→S→O→N (horário)
}

void Virar180(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_90 * 2);
    _atualizaDirecao(rato, +2); // N↔S | L↔O
}




// Configurações PWM da ESP32
const int FREQUENCIA_PWM = 5000; 
const int RESOLUCAO_PWM = 8;     
const int CANAL_ESQ_IN1 = 0; const int CANAL_ESQ_IN2 = 1;
const int CANAL_DIR_IN1 = 2; const int CANAL_DIR_IN2 = 3;

// local de alteracao com dados do robo fisico
const int TEMPO_CURVA_90 = 600;  
const int VELOCIDADE_GIRO = 150; 

int velocidadeEsquerdaAtual = 0;
int velocidadeDireitaAtual = 0;
bool motorsRunning = false;

void setupMotores() {
    // Liga os canais PWM aos pinos que a equipa já registou lá em cima
    ledcSetup(CANAL_ESQ_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in1L, CANAL_ESQ_IN1);
    ledcSetup(CANAL_ESQ_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in2L, CANAL_ESQ_IN2);
    ledcSetup(CANAL_DIR_IN1, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in1R, CANAL_DIR_IN1);
    ledcSetup(CANAL_DIR_IN2, FREQUENCIA_PWM, RESOLUCAO_PWM); ledcAttachPin(_in2R, CANAL_DIR_IN2);
    stopMotors();
}

void acionarMotores(int velEsquerda, int velDireita) {
    velocidadeEsquerdaAtual = velEsquerda;
    velocidadeDireitaAtual = velDireita;

    // Lógica do Motor Esquerdo
    if (velEsquerda > 0) {
        ledcWrite(CANAL_ESQ_IN1, velEsquerda); ledcWrite(CANAL_ESQ_IN2, 0);           
    } else if (velEsquerda < 0) {
        ledcWrite(CANAL_ESQ_IN1, 0); ledcWrite(CANAL_ESQ_IN2, abs(velEsquerda)); 
    } else {
        ledcWrite(CANAL_ESQ_IN1, 0); ledcWrite(CANAL_ESQ_IN2, 0);
    }

    // Lógica do Motor Direito
    if (velDireita > 0) {
        ledcWrite(CANAL_DIR_IN1, velDireita); ledcWrite(CANAL_DIR_IN2, 0);
    } else if (velDireita < 0) {
        ledcWrite(CANAL_DIR_IN1, 0); ledcWrite(CANAL_DIR_IN2, abs(velDireita));
    } else {
        ledcWrite(CANAL_DIR_IN1, 0); ledcWrite(CANAL_DIR_IN2, 0);
    }
    
    // Atualiza a flag para a telemetria saber que o rato está em movimento
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
    delay(TEMPO_CURVA_90 * 2); // O dobro do tempo para inverter totalmente
    stopMotors();
    delay(200);
}#include "./motor.h"

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

    // motors parados no cmc
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, LOW);
}

// -------------------------------------------------------------------------------
// Funções de motor (auxiliar)
// -------------------------------------------------------------------------------
static void _stopMotors()
{
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, LOW);
}

static void _fowardMotors()
{
    digitalWrite(_in1L, HIGH);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, HIGH);
    digitalWrite(_in2R, LOW);
}

// Curva a esquerda
static void _rotateLeftMotors()
{
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, HIGH);
    digitalWrite(_in1R, HIGH);
    digitalWrite(_in2R, LOW);
}

// Curva direita
static void _rotateRightMotors()
{
    digitalWrite(_in1L, HIGH);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, HIGH);
}

static void _esperarEncoder(long pulsos)
{ // Pra saber quando ele andou o suficiente(1 celula, 90° ou 180°)
    long baseEsq = *_encEsq;
    long baseDir = *_encDir;

    while ((*_encEsq - baseEsq) < pulsos || (*_encDir - baseDir) < pulsos)
    {
        yield();
    }
    _stopMotors();
}

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
//  MOVIMENTOS PÚBLICOS (Antigos)
// -------------------------------------------------------------------------------
void Andar(Rato *rato)
{
    _fowardMotors();
    _esperarEncoder(PULSOS_POR_CELULA);
    _atualizaPosicao(rato);

    // Salva contagem total nos campos do micromouse
    rato->encoder_esquerdo = *_encEsq;
    rato->encoder_direito = *_encDir;
}

void VirarEsquerda(Rato *rato)
{
    _rotateLeftMotors();
    _esperarEncoder(PULSOS_GIRO_90);
    _atualizaDirecao(rato, -1); // N→O→S→L→N (anti-horário)
}

void VirarDireita(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_90);
    _atualizaDirecao(rato, +1); // N→L→S→O→N (horário)
}

void Virar180(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_90 * 2);
    _atualizaDirecao(rato, +2); // N↔S | L↔O
}


// -------------------------------------------------------------------------------
// CONFIGURAÇÕES PWM, ODOMETRIA E CONTROLO PID 
// -------------------------------------------------------------------------------

// Configurações PWM da ESP32
const int FREQUENCIA_PWM = 5000; 
const int RESOLUCAO_PWM = 8;     
const int CANAL_ESQ_IN1 = 0; const int CANAL_ESQ_IN2 = 1;
const int CANAL_DIR_IN1 = 2; const int CANAL_DIR_IN2 = 3;

// Constantes de Manobra
const int TEMPO_CURVA_90 = 600;  
const int VELOCIDADE_GIRO = 150; 

int velocidadeEsquerdaAtual = 0;
int velocidadeDireitaAtual = 0;
bool motorsRunning = false;

// -------------------------------------------------------------------------------
// FÍSICA DO ROBÔ E CONSTANTES DE ODOMETRIA
// -------------------------------------------------------------------------------
const float DIAMETRO_RODA_CM = 4.4;
const float PULSOS_POR_VOLTA = 146.0;
const float CM_POR_PULSO = (DIAMETRO_RODA_CM * PI) / PULSOS_POR_VOLTA;

// Variáveis para cálculo de velocidade
float velocidadeEsqCmS = 0.0;
float velocidadeDirCmS = 0.0;
float distanciaPercorridaCm = 0.0;

long ultimosPulsosEsq = 0;
long ultimosPulsosDir = 0;
unsigned long ultimoTempoOdometria = 0;

// -------------------------------------------------------------------------------
// CONSTANTES DO PID (Calibrar nos testes)
// -------------------------------------------------------------------------------
float Kp = 1.2;  // Corrige o erro atual (força da correção de desvio)
float Kd = 0.5;  // Evita que o robô balance (freio da correção)
float Ki = 0.0;  // Corrige erros acumulados (geralmente começa em 0)

long erroAnteriorPID = 0;
long integralPID = 0;

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
void moveForward() { acionarMotores(140, 140); }

void virarDireita90() {
    acionarMotores(VELOCIDADE_GIRO, -VELOCIDADE_GIRO);
    delay(TEMPO_CURVA_90);
    stopMotors();
    delay(200); 
}

void virarEsquerda90() {
    acionarMotores(-VELOCIDADE_GIRO, VELOCIDADE_GIRO);
    delay(TEMPO_CURVA_90);
    stopMotors();
    delay(200);
}

void meiaVolta180() {
    acionarMotores(VELOCIDADE_GIRO, -VELOCIDADE_GIRO);
    delay(TEMPO_CURVA_90 * 2); 
    stopMotors();
    delay(200);
}


// -------------------------------------------------------------------------------
// CÁLCULO DE VELOCIDADE E ALINHAMENTO PID EM TEMPO REAL
// -------------------------------------------------------------------------------
void atualizarOdometriaEPID() {
    unsigned long tempoAtual = millis();
    unsigned long deltaTempo = tempoAtual - ultimoTempoOdometria;

    // Calcula a cada 50ms para ter uma leitura limpa dos pulsos
    if (deltaTempo >= 50) {
        
        long pulsosAtuaisEsq = *_encEsq; 
        long pulsosAtuaisDir = *_encDir;

        long deltaPulsosEsq = pulsosAtuaisEsq - ultimosPulsosEsq;
        long deltaPulsosDir = pulsosAtuaisDir - ultimosPulsosDir;

        // Calcula a velocidade (v = distância / tempo) em cm/s
        velocidadeEsqCmS = (deltaPulsosEsq * CM_POR_PULSO) / (deltaTempo / 1000.0);
        velocidadeDirCmS = (deltaPulsosDir * CM_POR_PULSO) / (deltaTempo / 1000.0);

        ultimosPulsosEsq = pulsosAtuaisEsq;
        ultimosPulsosDir = pulsosAtuaisDir;
        ultimoTempoOdometria = tempoAtual;

        // Só aplica PID se o robô estiver mandado a ir a direito
        if (velocidadeEsquerdaAtual > 0 && velocidadeDireitaAtual > 0) {
            
            // O erro é a diferença de pulsos totais desde que começou a andar
            long erro = pulsosAtuaisEsq - pulsosAtuaisDir; 
            
            integralPID += erro;
            long derivativa = erro - erroAnteriorPID;
            erroAnteriorPID = erro;

            // Fórmula do PID
            int ajustePWM = (Kp * erro) + (Ki * integralPID) + (Kd * derivativa);

            int basePWM = 140; // O nosso PWM base de aceleração

            // Aplica a correção: Se o esquerdo corre mais, o ajustePWM é positivo, logo diminui o Esq e aumenta o Dir
            int novoPwmEsq = basePWM - ajustePWM;
            int novoPwmDir = basePWM + ajustePWM;

            // Trava os valores para não ultrapassar a energia máxima (0 a 255)
            novoPwmEsq = constrain(novoPwmEsq, 0, 255);
            novoPwmDir = constrain(novoPwmDir, 0, 255);

            // Envia a energia corrigida direto para a Ponte H
            ledcWrite(CANAL_ESQ_IN1, novoPwmEsq); 
            ledcWrite(CANAL_DIR_IN1, novoPwmDir);
        }
    }
}

// -------------------------------------------------------------------------------
// FUNÇÃO INTELIGENTE: ANDAR DISTÂNCIA COM PID
// -------------------------------------------------------------------------------
void andarDistancia(float distanciaCm) {
    // Transforma os centímetros que queremos andar em pulsos de encoder
    long pulsosAlvo = distanciaCm / CM_POR_PULSO;
    
    long baseEsq = *_encEsq;
    long baseDir = *_encDir;

    // Reseta o PID antes de cada viagem para não trazer lixo da viagem anterior
    erroAnteriorPID = 0;
    integralPID = 0;

    moveForward(); // Dá o arranque inicial a direito (PWM 140,140)

    // Fica a rodar neste loop (enquanto corrige a direção) até atingir o número de pulsos desejado
    while ((*_encEsq - baseEsq) < pulsosAlvo || (*_encDir - baseDir) < pulsosAlvo) {
        atualizarOdometriaEPID(); // Aciona o PID para manter as rodas alinhadas
        yield(); // Impede o Watchdog Timer da ESP32 de reiniciar o robô por loop preso
    }

    stopMotors(); // Trava a direito quando bate a meta
}
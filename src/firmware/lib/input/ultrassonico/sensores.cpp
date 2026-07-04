#include "./sensores.h"
#include "sensores.h"
#include <Adafruit_INA219.h>

// -- Pinos (preenchidos em inicializaSensores e inicializaIna) --------------------------------
static uint8_t _trigF, _echoF;
static uint8_t _trigE, _echoE;
static uint8_t _trigD, _echoD;

static uint8_t _inaSda, _inaScl;

// -- Estado de cada sensor ----------------------------------------------------
// Volatile: escritas na ISR, leituras no loop principal
volatile unsigned long _inicioF = 0, _inicioE = 0, _inicioD = 0;
volatile bool _medindoF = false, _medindoE = false, _medindoD = false;
volatile float _distF = DISTANCIA_LIVRE_CM;
volatile float _distE = DISTANCIA_LIVRE_CM;
volatile float _distD = DISTANCIA_LIVRE_CM;

// -- ISRs (rodam na RISING e FALLING do pino ECHO) ----------------------------
// RISING  → grava o instante de início do pulso
// FALLING → calcula duração e converte para cm
//   distância (cm) = duração (microsegundos) × velocidade_do_som / 2
//                  = duração × 0.0343 / 2
//                  = duração × 0.01715

void IRAM_ATTR _isrFrente()
{
    if (digitalRead(_echoF))
    {
        _inicioF = micros();
        _medindoF = true;
    }
    else if (_medindoF)
    {
        unsigned long dur = micros() - _inicioF;
        _distF = (dur > 0 && dur < SENSOR_TIMEOUT_US)
                     ? dur * 0.01715f
                     : DISTANCIA_LIVRE_CM;
        _medindoF = false;
    }
}

void IRAM_ATTR _isrEsquerda()
{
    if (digitalRead(_echoE))
    {
        _inicioE = micros();
        _medindoE = true;
    }
    else if (_medindoE)
    {
        unsigned long dur = micros() - _inicioE;
        _distE = (dur > 0 && dur < SENSOR_TIMEOUT_US)
                     ? dur * 0.01715f
                     : DISTANCIA_LIVRE_CM;
        _medindoE = false;
    }
}

void IRAM_ATTR _isrDireita()
{
    if (digitalRead(_echoD))
    {
        _inicioD = micros();
        _medindoD = true;
    }
    else if (_medindoD)
    {
        unsigned long dur = micros() - _inicioD;
        _distD = (dur > 0 && dur < SENSOR_TIMEOUT_US)
                     ? dur * 0.01715f
                     : DISTANCIA_LIVRE_CM;
        _medindoD = false;
    }
}

// -- Pulso de trigger -------------------
static void _dispararTrigger(uint8_t trigPin)
{
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
}

// -- Inicialização -------------------------------------------------------------
void inicializaSensores(uint8_t trigFrente, uint8_t echoFrente,
                        uint8_t trigEsquerda, uint8_t echoEsquerda,
                        uint8_t trigDireita, uint8_t echoDireita)
{
    _trigF = trigFrente;
    _echoF = echoFrente;
    _trigE = trigEsquerda;
    _echoE = echoEsquerda;
    _trigD = trigDireita;
    _echoD = echoDireita;

    pinMode(_trigF, OUTPUT);
    digitalWrite(_trigF, LOW);
    pinMode(_trigE, OUTPUT);
    digitalWrite(_trigE, LOW);
    pinMode(_trigD, OUTPUT);
    digitalWrite(_trigD, LOW);

    pinMode(_echoF, INPUT);
    pinMode(_echoE, INPUT);
    pinMode(_echoD, INPUT);

    // CHANGE dispara na borda de subida (RISING) e descida (FALLING)
    attachInterrupt(digitalPinToInterrupt(_echoF), _isrFrente, CHANGE);
    attachInterrupt(digitalPinToInterrupt(_echoE), _isrEsquerda, CHANGE);
    attachInterrupt(digitalPinToInterrupt(_echoD), _isrDireita, CHANGE);
}

// -- Loop não-bloqueante -------------------------------------------------------
// Dispara um sensor a cada INTERVALO_TRIGGER_MS em rodízio:
//   t=0ms  → frente     t=20ms → esquerda     t=40ms → direita
//   t=60ms → frente ...
// Cada sensor é atualizado a ~16 Hz (alterar no teste).
void atualizaSensores()
{
    static unsigned long ultimoTrigger = 0;
    static uint8_t vez = 0; // 0 = frente | 1 = esquerda | 2 = direita

    unsigned long agora = millis();
    if (agora - ultimoTrigger < INTERVALO_TRIGGER_MS)
        return;
    ultimoTrigger = agora;

    switch (vez)
    {
    case 0:
        _dispararTrigger(_trigF);
        break;
    case 1:
        _dispararTrigger(_trigE);
        break;
    case 2:
        _dispararTrigger(_trigD);
        break;
    }
    vez = (vez + 1) % 3;
}

// -- Leituras ------------------------------------------------------------------
void lerDistancias(Rato *rato)
{
    // desativa interrupções para evitar leitura parcial
    noInterrupts();
    rato->distancia_frente = _distF;
    rato->distancia_esquerda = _distE;
    rato->distancia_direita = _distD;
    interrupts();
}

float getDistanciaFrente() { return _distF; }
float getDistanciaEsquerda() { return _distE; }
float getDistanciaDireita() { return _distD; }

bool temParedeFrente() { return _distF < DISTANCIA_PAREDE_CM; }
bool temParedeEsquerda() { return _distE < DISTANCIA_PAREDE_CM; }
bool temParedeDireita() { return _distD < DISTANCIA_PAREDE_CM; }

void inicializaIna(uint8_t ina_scl, uint8_t ina_sda, Adafruit_INA219 *ina219)
{
    _inaSda = ina_sda;
    _inaScl = ina_scl;

    Wire.begin(_inaSda, _inaScl);

    if (!ina219->begin())
    {
        Serial.println("Erro ao iniciar INA219");
    }
    else
    {
        Serial.println("INA219 iniciado");
    }
}

void lerDadosEnergeticos(Rato *rato, Adafruit_INA219 *ina219)
{
    float busVoltage = ina219->getBusVoltage_V();
    float current_mA = ina219->getCurrent_mA();

    rato->corrente = current_mA;
    rato->tensao = busVoltage;
}

#include "./sensores_ir.h"
#include <Wire.h>
#include <VL53L0X.h>
#include <VL6180X.h>

#define I2C_SDA 21
#define I2C_SCL 22
#define INTERVALO_LEITURA_MS 50

static uint8_t _xshutF, _xshutE, _xshutD;
static VL53L0X _vlEsquerdo;
static VL53L0X _vlDireito;
static VL6180X _vlFrente;

static float _distF = DISTANCIA_LIVRE_CM;
static float _distE = DISTANCIA_LIVRE_CM;
static float _distD = DISTANCIA_LIVRE_CM;

void inicializaSensores(uint8_t xshutFrente, uint8_t xshutEsquerda, uint8_t xshutDireita)
{
    _xshutF = xshutFrente;
    _xshutE = xshutEsquerda;
    _xshutD = xshutDireita;

    pinMode(_xshutF, OUTPUT);
    pinMode(_xshutE, OUTPUT);
    pinMode(_xshutD, OUTPUT);

    digitalWrite(_xshutE, LOW);
    digitalWrite(_xshutD, LOW);
    digitalWrite(_xshutF, LOW);
    delay(10);

    Wire.begin(I2C_SDA, I2C_SCL);

    digitalWrite(_xshutE, HIGH);
    delay(10);
    if (!_vlEsquerdo.init())
    {
        Serial.println("[ERRO] VL53L0X esquerdo nao detectado");
    }
    _vlEsquerdo.setAddress(ENDERECO_VL53L0X_ESQ);

    digitalWrite(_xshutD, HIGH);
    delay(10);
    if (!_vlDireito.init())
    {
        Serial.println("[ERRO] VL53L0X direito nao detectado");
    }
    _vlDireito.setAddress(ENDERECO_VL53L0X_DIR);

    digitalWrite(_xshutF, HIGH);
    delay(10);
    _vlFrente.init();
    _vlFrente.setAddress(ENDERECO_VL6180X_FRENTE);

    Serial.println("[SENSORES_IR] VL53L0X esq=0x2A dir=0x31 VL6180X frente=0x30");
}

void atualizaSensores()
{
    static unsigned long ultimaLeitura = 0;
    unsigned long agora = millis();
    if (agora - ultimaLeitura < INTERVALO_LEITURA_MS)
        return;
    ultimaLeitura = agora;

    uint8_t mmF = _vlFrente.readRangeSingle();
    _distF = _vlFrente.timeoutOccurred() ? DISTANCIA_LIVRE_CM : mmF / 10.0f;

    uint16_t mmE = _vlEsquerdo.readRangeSingleMillimeters();
    _distE = _vlEsquerdo.timeoutOccurred() ? DISTANCIA_LIVRE_CM : mmE / 10.0f;

    uint16_t mmD = _vlDireito.readRangeSingleMillimeters();
    _distD = _vlDireito.timeoutOccurred() ? DISTANCIA_LIVRE_CM : mmD / 10.0f;
}

void lerDistancias(Rato *rato)
{
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

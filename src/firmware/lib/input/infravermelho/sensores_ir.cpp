#include "./sensores_ir.h"
#include <Wire.h>
#include <VL53L0X.h>
#include <VL6180X.h>

// Pinos SDA/SCL individuais de cada sensor infravermelho
#define FRENTE_SDA  21
#define FRENTE_SCL  3
#define ESQUERDA_SDA  4
#define ESQUERDA_SCL  16
#define DIREITA_SDA  18
#define DIREITA_SCL  17

#define INTERVALO_LEITURA_MS 50

static VL53L0X _vlEsquerdo;
static VL53L0X _vlDireito;
static VL6180X _vlFrente;

static float _distF = DISTANCIA_LIVRE_CM;
static float _distE = DISTANCIA_LIVRE_CM;
static float _distD = DISTANCIA_LIVRE_CM;

void inicializaSensores()
{
    // --- Sensor frontal: VL6180X ---
    Wire1.begin(FRENTE_SDA, FRENTE_SCL);
    _vlFrente.setBus(&Wire1);
    _vlFrente.init();

    // --- Sensor esquerda: VL53L0X ---
    Wire1.begin(ESQUERDA_SDA, ESQUERDA_SCL);
    _vlEsquerdo.setBus(&Wire1);
    if (!_vlEsquerdo.init())
    {
        Serial.println("[ERRO] VL53L0X esquerdo nao detectado");
    }

    // --- Sensor direita: VL53L0X ---
    Wire1.begin(DIREITA_SDA, DIREITA_SCL);
    _vlDireito.setBus(&Wire1);
    if (!_vlDireito.init())
    {
        Serial.println("[ERRO] VL53L0X direito nao detectado");
    }

    Serial.println("[SENSORES_IR] Frente=VL6180X(21,3) Esq=VL53L0X(4,16) Dir=VL53L0X(18,17)");
}

void atualizaSensores()
{
    static unsigned long ultimaLeitura = 0;
    unsigned long agora = millis();
    if (agora - ultimaLeitura < INTERVALO_LEITURA_MS)
        return;
    ultimaLeitura = agora;

    // Alterna Wire1 para o sensor frontal (sozinho no barramento, addr 0x29)
    Wire1.begin(FRENTE_SDA, FRENTE_SCL);
    uint8_t mmF = _vlFrente.readRangeSingle();
    _distF = _vlFrente.timeoutOccurred() ? DISTANCIA_LIVRE_CM : mmF / 10.0f;

    // Alterna Wire1 para o sensor esquerdo (sozinho no barramento, addr 0x29)
    Wire1.begin(ESQUERDA_SDA, ESQUERDA_SCL);
    uint16_t mmE = _vlEsquerdo.readRangeSingleMillimeters();
    _distE = _vlEsquerdo.timeoutOccurred() ? DISTANCIA_LIVRE_CM : mmE / 10.0f;

    // Alterna Wire1 para o sensor direito (sozinho no barramento, addr 0x29)
    Wire1.begin(DIREITA_SDA, DIREITA_SCL);
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

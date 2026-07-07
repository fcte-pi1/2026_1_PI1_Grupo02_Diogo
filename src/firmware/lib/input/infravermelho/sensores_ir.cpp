#include "./sensores_ir.h"
#include <Wire.h>
#include <VL53L0X.h>
#include <VL6180X.h>

// Barramento do sensor frontal (VL6180X) + INA219
#define FRENTE_SDA  4
#define FRENTE_SCL  16

// Barramento compartilhado dos sensores laterais (VL53L0X)
#define LATERAIS_SDA  17
#define LATERAIS_SCL  5

// Endereços I2C remapeados para os VL53L0X (compartilham o mesmo barramento)
#define ENDERECO_VL53L0X_ESQ  0x2A
#define ENDERECO_VL53L0X_DIR  0x31

#define INTERVALO_LEITURA_MS 50

static uint8_t _xshutE, _xshutD;
static VL53L0X _vlEsquerdo;
static VL53L0X _vlDireito;
static VL6180X _vlFrente;

static float _distF = DISTANCIA_LIVRE_CM;
static float _distE = DISTANCIA_LIVRE_CM;
static float _distD = DISTANCIA_LIVRE_CM;

void inicializaSensores(uint8_t xshutEsquerda, uint8_t xshutDireita)
{
    _xshutE = xshutEsquerda;
    _xshutD = xshutDireita;

    // --- Inicializa barramentos I2C ---
    Wire.begin(FRENTE_SDA, FRENTE_SCL);       // I2C0: sensor frontal + INA219
    Wire1.begin(LATERAIS_SDA, LATERAIS_SCL);  // I2C1: sensores laterais (VL53L0X)

    // --- Sensor frontal: VL6180X (sozinho no Wire, addr 0x29) ---
    _vlFrente.setBus(&Wire);
    _vlFrente.init();

    // --- Sensores laterais: VL53L0X compartilham Wire1 via XSHUT ---
    pinMode(_xshutE, OUTPUT);
    pinMode(_xshutD, OUTPUT);
    digitalWrite(_xshutE, LOW);
    digitalWrite(_xshutD, LOW);
    delay(10);

    // Ativa esquerda primeiro, remapeia para 0x2A
    digitalWrite(_xshutE, HIGH);
    delay(10);
    _vlEsquerdo.setBus(&Wire1);
    if (!_vlEsquerdo.init())
    {
        Serial.println("[ERRO] VL53L0X esquerdo nao detectado");
    }
    _vlEsquerdo.setAddress(ENDERECO_VL53L0X_ESQ);

    // Ativa direita (addr 0x29) — não conflita porque esquerda já está em 0x2A
    digitalWrite(_xshutD, HIGH);
    delay(10);
    _vlDireito.setBus(&Wire1);
    if (!_vlDireito.init())
    {
        Serial.println("[ERRO] VL53L0X direito nao detectado");
    }
    _vlDireito.setAddress(ENDERECO_VL53L0X_DIR);

    Serial.println("[SENSORES_IR] Frente(0x29) Wire(4,16) | Esq(0x2A)+Dir(0x31) Wire1(17,5)");
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

#include "./sensores_ir.h"
#include <Wire.h>
#include <VL53L0X.h>
#include <VL6180X.h>

// Pinos SDA/SCL individuais de cada sensor infravermelho
// Cada sensor está num par físico dedicado → Wire1 é reconfigurado entre leituras
#define FRENTE_SDA   21
#define FRENTE_SCL    3
#define ESQUERDA_SDA  4
#define ESQUERDA_SCL 16
#define DIREITA_SDA  18
#define DIREITA_SCL  17

#define INTERVALO_LEITURA_MS 50

static VL53L0X _vlEsquerdo;
static VL53L0X _vlDireito;
static VL6180X _vlFrente;

static float _distF = DISTANCIA_LIVRE_CM;
static float _distE = DISTANCIA_LIVRE_CM;
static float _distD = DISTANCIA_LIVRE_CM;

static int8_t _wireAtivaSDA = -1;
static bool _frente_ok   = false;
static bool _esquerda_ok = false;
static bool _direita_ok  = false;

// Imprime endereços I2C que respondem no barramento atual
static void _scanI2C(const char* label)
{
    Serial.printf("[I2C SCAN] %s: ", label);
    bool found = false;
    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire1.beginTransmission(addr);
        if (Wire1.endTransmission() == 0) {
            Serial.printf("0x%02X ", addr);
            found = true;
        }
    }
    if (!found) Serial.print("NENHUM");
    Serial.println();
}

static void _selecionarBus(int sda, int scl)
{
    if (_wireAtivaSDA == sda) return;
    Wire1.setPins(sda, scl);
    delay(1);
    _wireAtivaSDA = sda;
}

void inicializaSensores()
{
    // Inicializa Wire1 uma única vez (necessário antes de qualquer setPins())
    Wire1.begin(FRENTE_SDA, FRENTE_SCL);
    Wire1.setClock(100000);
    _wireAtivaSDA = FRENTE_SDA;
    delay(50); // estabilização inicial de pull-ups e GPIOs

    // --- Sensor frontal: VL6180X (pinos 21 / 3) ---
    _scanI2C("FRENTE SDA=21 SCL=3");
    _vlFrente.setBus(&Wire1);
    _vlFrente.init();
    _vlFrente.configureDefault();
    _vlFrente.setTimeout(500);
    _frente_ok = true;
    Serial.println("[SENSORES_IR] VL6180X (frente) iniciado");

    // --- Sensor esquerda: VL53L0X (pinos 4 / 16) ---
    _selecionarBus(ESQUERDA_SDA, ESQUERDA_SCL);
    _scanI2C("ESQUERDA SDA=4 SCL=16");
    _vlEsquerdo.setBus(&Wire1);
    _vlEsquerdo.setTimeout(500);
    // Tenta até 3 vezes — barramento pode precisar de mais tempo após remapeamento
    for (int t = 0; t < 3 && !_esquerda_ok; t++) {
        if (t > 0) { delay(100); Serial.printf("[RETRY] VL53L0X esquerdo tentativa %d\n", t+1); }
        if (_vlEsquerdo.init()) {
            _esquerda_ok = true;
            Serial.println("[SENSORES_IR] VL53L0X (esquerda) iniciado");
        }
    }
    if (!_esquerda_ok) Serial.println("[ERRO] VL53L0X esquerdo nao detectado (SDA=4 SCL=16)");

    // --- Sensor direita: VL53L0X (pinos 18 / 17) ---
    _selecionarBus(DIREITA_SDA, DIREITA_SCL);
    _scanI2C("DIREITA SDA=18 SCL=17");
    _vlDireito.setBus(&Wire1);
    _vlDireito.setTimeout(500);
    if (!_vlDireito.init()) {
        Serial.println("[ERRO] VL53L0X direito nao detectado");
    } else {
        _direita_ok = true;
        Serial.println("[SENSORES_IR] VL53L0X (direita) iniciado");
    }

    Serial.println("[SENSORES_IR] Inicializacao concluida");
}

void atualizaSensores()
{
    static unsigned long ultimaLeitura = 0;
    unsigned long agora = millis();
    if (agora - ultimaLeitura < INTERVALO_LEITURA_MS)
        return;
    ultimaLeitura = agora;

    if (_frente_ok) {
        _selecionarBus(FRENTE_SDA, FRENTE_SCL);
        uint8_t mmF = _vlFrente.readRangeSingle();
        _distF = (_vlFrente.timeoutOccurred() || mmF == 255) ? DISTANCIA_LIVRE_CM : mmF / 10.0f;
    }

    if (_esquerda_ok) {
        _selecionarBus(ESQUERDA_SDA, ESQUERDA_SCL);
        uint16_t mmE = _vlEsquerdo.readRangeSingleMillimeters();
        bool toE = _vlEsquerdo.timeoutOccurred();
        // 8190+ = sentinel 0x1FFF do VL53L0X (sem alvo no alcance)
        _distE = (toE || mmE >= 8190) ? DISTANCIA_LIVRE_CM : mmE / 10.0f;
        Serial.printf("[DBG] Esq raw=%u to=%d dist=%.1f\n", mmE, toE, _distE);
    }

    if (_direita_ok) {
        _selecionarBus(DIREITA_SDA, DIREITA_SCL);
        uint16_t mmD = _vlDireito.readRangeSingleMillimeters();
        bool toD = _vlDireito.timeoutOccurred();
        // 8190+ = sentinel 0x1FFF do VL53L0X (sem alvo no alcance)
        _distD = (toD || mmD >= 8190) ? DISTANCIA_LIVRE_CM : mmD / 10.0f;
        Serial.printf("[DBG] Dir raw=%u to=%d dist=%.1f\n", mmD, toD, _distD);
    }
}

void lerDistancias(Rato *rato)
{
    noInterrupts();
    rato->distancia_frente   = _distF;
    rato->distancia_esquerda = _distE;
    rato->distancia_direita  = _distD;
    interrupts();
}

float getDistanciaFrente()   { return _distF; }
float getDistanciaEsquerda() { return _distE; }
float getDistanciaDireita()  { return _distD; }

bool temParedeFrente()    { return _distF < DISTANCIA_PAREDE_CM; }
bool temParedeEsquerda()  { return _distE < DISTANCIA_PAREDE_CM; }
bool temParedeDireita()   { return _distD < DISTANCIA_PAREDE_CM; }

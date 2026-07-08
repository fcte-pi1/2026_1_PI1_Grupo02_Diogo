#include "./sensores_ir.h"
#include <Wire.h>
#include <VL6180X.h>
#include <VL53L0X.h>

// ============================================================
//  INSTÂNCIAS DOS SENSORES (escopo de arquivo)
// ============================================================
static VL6180X _vlFrente;    // sensor frontal
static VL53L0X _vlEsquerda;  // sensor lateral esquerdo
static VL53L0X _vlDireita;   // sensor lateral direito

// ============================================================
//  CACHE DE LEITURAS (cm)
// ============================================================
static float _distF = DISTANCIA_LIVRE_CM;
static float _distE = DISTANCIA_LIVRE_CM;
static float _distD = DISTANCIA_LIVRE_CM;

// ============================================================
//  FLAGS DE SAÚDE — permitem degradação graceful se um sensor falhar
// ============================================================
static bool _frente_ok = false;
static bool _esq_ok    = false;
static bool _dir_ok    = false;

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
void inicializaSensores()
{
    // --- 1. Desliga todos os sensores ---
    // VL6180X via SHDN (GPIO 23), VL53L0X via XSHUT (GPIO 4 e 5).
    // Todos usam 0x29 como endereço padrão — só um pode estar ativo por vez.
    pinMode(VL6180X_SHDN_PIN, OUTPUT);
    pinMode(XSHUT_ESQ_PIN, OUTPUT);
    pinMode(XSHUT_DIR_PIN, OUTPUT);

    digitalWrite(VL6180X_SHDN_PIN, LOW);   // VL6180X offline — desocupa 0x29
    digitalWrite(XSHUT_ESQ_PIN, LOW);       // VL53L0X esq offline
    digitalWrite(XSHUT_DIR_PIN, LOW);       // VL53L0X dir offline
    delay(10);

    // --- 2. Sobe o barramento Wire1 ---
    Wire1.begin(SENSOR_SDA, SENSOR_SCL);
    Wire1.setClock(400000);

    // --- 3. Liga e reendereça VL53L0X esquerda (0x29 → 0x30) ---
    // VL6180X está com SHDN=LOW, então 0x29 está livre.
    digitalWrite(XSHUT_ESQ_PIN, HIGH);
    delay(10);

    _vlEsquerda.setBus(&Wire1);
    _vlEsquerda.setTimeout(500);
    if (_vlEsquerda.init()) {
        _vlEsquerda.setAddress(ADDR_ESQ);
        _vlEsquerda.startContinuous(50);
        _esq_ok = true;
        Serial.println("[SENSORES] VL53L0X esquerda OK @0x30 (Wire1)");
    } else {
        Serial.println("[ERRO]     VL53L0X esquerda nao detectado");
    }

    // --- 4. Liga e reendereça VL53L0X direita (0x29 → 0x31) ---
    // Esquerda já está em 0x30, VL6180X offline — 0x29 livre.
    digitalWrite(XSHUT_DIR_PIN, HIGH);
    delay(10);

    _vlDireita.setBus(&Wire1);
    _vlDireita.setTimeout(500);
    if (_vlDireita.init()) {
        _vlDireita.setAddress(ADDR_DIR);
        _vlDireita.startContinuous(50);
        _dir_ok = true;
        Serial.println("[SENSORES] VL53L0X direita  OK @0x31 (Wire1)");
    } else {
        Serial.println("[ERRO]     VL53L0X direita nao detectado");
    }

    // --- 5. Liga VL6180X (frente) — único em 0x29, sem colisão ---
    // delay de 50 ms: SHDN não é power-on, o sensor precisa de tempo para
    // estabilizar o oscilador interno antes de responder no I2C.
    digitalWrite(VL6180X_SHDN_PIN, HIGH);
    delay(50);

    _vlFrente.setBus(&Wire1);
    _vlFrente.setTimeout(500);
    _vlFrente.init();
    _vlFrente.configureDefault();

    Wire1.beginTransmission(ADDR_FRENTE);
    _frente_ok = (Wire1.endTransmission() == 0);
    Serial.println(_frente_ok
        ? "[SENSORES] VL6180X frente OK  @0x29 (Wire1 SDA=21 SCL=22)"
        : "[ERRO]     VL6180X frente nao detectado");
}

// ============================================================
//  ATUALIZAÇÃO DAS LEITURAS
// ============================================================
void atualizaSensores()
{
    // -- Frente: VL6180X (single-shot, resultado em mm inteiro) --
    // O VL6180X tem alcance máximo confiável de ~10 cm dentro de células de 18 cm;
    // valor 255 é reservado pelo driver para indicar overflow/erro.
    if (_frente_ok) {
        uint8_t mmF = _vlFrente.readRangeSingle();
        _distF = (_vlFrente.timeoutOccurred() || mmF == 255)
                 ? DISTANCIA_LIVRE_CM
                 : (mmF + VL6180X_OFFSET_MM) / 10.0f;
    }

    // -- Laterais: VL53L0X (modo contínuo, resultado em mm uint16) --
    // Valores > 8000 mm indicam ausência de alvo (fora do alcance).
    if (_esq_ok) {
        uint16_t mmE = _vlEsquerda.readRangeContinuousMillimeters();
        _distE = (_vlEsquerda.timeoutOccurred() || mmE > 8000)
                 ? DISTANCIA_LIVRE_CM
                 : mmE / 10.0f;
    }

    if (_dir_ok) {
        uint16_t mmD = _vlDireita.readRangeContinuousMillimeters();
        _distD = (_vlDireita.timeoutOccurred() || mmD > 8000)
                 ? DISTANCIA_LIVRE_CM
                 : mmD / 10.0f;
    }
}

// ============================================================
//  LEITURA PARA O STRUCT RATO
// ============================================================
void lerDistancias(Rato *rato)
{
    // noInterrupts protege a cópia atômica dos floats (4 bytes cada),
    // que podem ser corrompidos se uma ISR de encoder interromper no meio.
    noInterrupts();
    rato->distancia_frente   = _distF;
    rato->distancia_esquerda = _esq_ok ? _distE : 0.0f;
    rato->distancia_direita  = _dir_ok ? _distD : 0.0f;
    interrupts();
}

// ============================================================
//  ACESSORES
// ============================================================
float getDistanciaFrente()   { return _distF; }
float getDistanciaEsquerda() { return _distE; }
float getDistanciaDireita()  { return _distD; }

bool temParedeFrente()   { return _distF < DISTANCIA_PAREDE_CM; }
bool temParedeEsquerda() { return _distE < DISTANCIA_PAREDE_CM; }
bool temParedeDireita()  { return _distD < DISTANCIA_PAREDE_CM; }

// ============================================================
//  MAPEAMENTO DE PAREDES — sem rotação física
// ============================================================
void mapearParedes(Rato *rato, Labirinto *lab)
{
    // Com 3 sensores simultâneos, o mapeamento é instantâneo:
    //   - sensor frontal  → parede na DIREÇÃO ATUAL do robô
    //   - sensor esquerdo → parede 90° anti-horário da direção atual
    //   - sensor direito  → parede 90° horário da direção atual
    //
    // Nenhuma rotação física é necessária. Esta função é chamada
    // UMA VEZ por célula, antes de o DFS decidir o próximo passo.

    atualizaSensores();

    // Resolve as direções absolutas a partir da orientação do robô
    static const char dirs[] = {'N', 'L', 'S', 'O'};
    auto idxDir = [](char d) -> int {
        for (int i = 0; i < 4; i++)
            if (dirs[i] == d) return i;
        return 0;
    };

    int   idx         = idxDir(rato->direcao);
    char  dirFrente   = rato->direcao;
    char  dirDireita  = dirs[(idx + 1) % 4];
    char  dirEsquerda = dirs[(idx + 3) % 4];

    if (temParedeFrente())
        registrarParede(lab, rato->x, rato->y, dirFrente);

    if (temParedeDireita())
        registrarParede(lab, rato->x, rato->y, dirDireita);

    if (temParedeEsquerda())
        registrarParede(lab, rato->x, rato->y, dirEsquerda);
}

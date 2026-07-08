#include "./sensores_ir.h"
#include <Wire.h>
#include <VL6180X.h>
#include "../../output/motor/motor.h"

#define FRENTE_SDA 21
#define FRENTE_SCL 19

static VL6180X _vlFrente;
static float _distF = DISTANCIA_LIVRE_CM;
static bool _frente_ok = false;

void inicializaSensores()
{
    Wire1.begin(FRENTE_SDA, FRENTE_SCL);
    Wire1.setClock(100000);

    _vlFrente.setBus(&Wire1);
    _vlFrente.setTimeout(500);

    _vlFrente.init();
    _vlFrente.configureDefault();

    // Verifica presença no barramento via ACK do endereço I2C
    Wire1.beginTransmission(_vlFrente.getAddress());
    if (Wire1.endTransmission() == 0) {
        _frente_ok = true;
        Serial.println("[SENSORES] VL6180X (frente) OK");
    } else {
        Serial.println("[ERRO] VL6180X nao detectado (SDA=21 SCL=19)");
    }
}

void atualizaSensores()
{
    if (!_frente_ok) return;

    uint8_t mmF = _vlFrente.readRangeSingle();
    _distF = (_vlFrente.timeoutOccurred() || mmF == 255)
             ? DISTANCIA_LIVRE_CM
             : mmF / 10.0f;
}

void lerDistancias(Rato *rato)
{
    noInterrupts();
    rato->distancia_frente   = _distF;
    rato->distancia_esquerda = 0.0f;
    rato->distancia_direita  = 0.0f;
    interrupts();
}

float getDistanciaFrente() { return _distF; }

bool temParedeFrente() { return _distF < DISTANCIA_PAREDE_CM; }

void mapearParedes(Rato *rato, Labirinto *lab)
{
    if (!_frente_ok) {
        Serial.println("[AVISO] VL6180X indisponivel — sem mapeamento de paredes");
        return;
    }

    static const char dirs[] = {'N', 'L', 'S', 'O'};

    auto idxDir = [](char d) -> int {
        for (int i = 0; i < 4; i++)
            if (dirs[i] == d) return i;
        return 0;
    };

    auto girar90 = [&]() {
        virarDireita90();
        rato->direcao = dirs[(idxDir(rato->direcao) + 1) % 4];
    };

    // 1) Parede da frente (direção atual)
    atualizaSensores();
    if (temParedeFrente())
        registrarParede(lab, rato->x, rato->y, rato->direcao);

    // 2) Girar 90° direita → parede direita (original)
    girar90();
    atualizaSensores();
    if (temParedeFrente())
        registrarParede(lab, rato->x, rato->y, rato->direcao);

    // 3) Girar 180° (2×90°) → parede esquerda (original)
    girar90();
    girar90();
    atualizaSensores();
    if (temParedeFrente())
        registrarParede(lab, rato->x, rato->y, rato->direcao);

    // 4) Girar 90° → volta à orientação original
    girar90();

    // Leitura fresca da frente para telemetria
    atualizaSensores();
}

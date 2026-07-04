#pragma once
#include <Arduino.h>

#include "../rato/rato.h"
#include "../mapa/labirinto.h"
#include "../output/motor/motor.h"
#include "../input/ultrassonico/sensores.h"

enum EstadoFF
{
    PARADO,
    EXPLORANDO,
    CORRIDA,
    CONCLUIDO
};

struct PosicaoFloodFill {
    int x;
    int y;
};

void executaFloodFill(Labirinto *lab, const PosicaoFloodFill destinos[], int quantidadeDestinos);
char escolheProximoMovimento(Labirinto *lab, int x, int y, char direcaoAtual);

void passoVolta(Rato *rato, Labirinto *lab, bool *motorsRunning,
                int origemX, int origemY,
                bool *conclusao, EstadoFF *estado);

const char *getUltimoMovimentoVolta();
void resetVolta();

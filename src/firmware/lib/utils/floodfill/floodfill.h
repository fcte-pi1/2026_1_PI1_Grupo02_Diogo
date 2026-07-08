#pragma once
#include <Arduino.h>

#include "../rato/rato.h"
#include "../mapa/labirinto.h"
#include "../../output/motor/motor.h"
#include "../../input/infravermelho/sensores_ir.h"
#include "../dfs/dfs.h" // pra usar o ENUN de Estado

struct PosicaoFloodFill
{
    int x;
    int y;
};

void executaFloodFill(Labirinto *lab, const PosicaoFloodFill destinos[], int quantidadeDestinos);
char escolheProximoMovimento(Labirinto *lab, int x, int y, char direcaoAtual);

// Passo genérico de navegação via floodfill: anda 1 célula em direção a
// (destinoX, destinoY) usando o mapa atual. Reaproveitado tanto na Volta
// (centro -> início) quanto na Corrida (início -> centro) — só muda o alvo.
void passoFloodFill(Rato *rato, Labirinto *lab, bool *motorsRunning,
                    int destinoX, int destinoY,
                    bool *conclusao, Estado *estado);

// retorna uma string do ultimo movimento realizado (para telemetria)
const char *getUltimoMovimentoFloodFill();

// Zera o estado interno do floodfill (re-calcula BFS com novo alvo).
// Deve ser chamada sempre que o alvo mudar (entre a Volta e Corrida).
void resetFloodFill();
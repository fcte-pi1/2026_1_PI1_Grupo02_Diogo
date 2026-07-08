#pragma once
#include <Arduino.h>
#include "../rato/rato.h"
#include "../mapa/labirinto.h"

// -------------------------------------------------------------------------------
//  ESTADOS DO ROBÔ
//
//  PARADO --> EXPLORANDO --> CORRIDA --> CONCLUIDO
//
//  EXPLORANDO : DFS (desconhecido = sem parede)
//               robô vai de INICIO descobrindo o labirinto até achar o centro 2x2
//  CORRIDA    : usa o caminho ótimo (FloodFill) — implementado depois
//
//  Definido aqui (e não no main.cpp) para que passoDFS() possa receber Estado*.
// -------------------------------------------------------------------------------
enum Estado
{
    PARADO,
    EXPLORANDO,
    CORRIDA,
    CONCLUIDO,
    ERRO   // fail-safe: conexão MQTT perdida ou sensor em falha
};

// Posição usada na pilha de backtrack (memória estática, sem heap)
typedef struct PosicaoDFS
{
    int x;
    int y;
} PosicaoDFS;

// -------------------------------------------------------------------------------
//  PASSO DE DFS
//
//  Executa EXATAMENTE 1 passo por chamada (compatível com loop() não-bloqueante).
//  Cada passo: lê sensores, registra paredes, marca célula, decide e move 1 célula
//  (ou faz backtrack). Não usa recursão nem heap — pilha estática explícita.
//
//  Prioridade de movimento: frente -> direita -> esquerda -> backtrack
// -------------------------------------------------------------------------------
void passoDFS(Rato *rato, Labirinto *lab, bool *motorsRunning,
              unsigned long *stepCounter, int *destinoX, int *destinoY,
              bool *conclusao, Estado *estado);

// Zera o estado interno do DFS (pilha de backtrack e flag de inicialização).
// Deve ser chamada antes de (re)iniciar a exploração — ex.: no setup().
void resetDFS();

// Descrição textual do último movimento executado pelo DFS, para a telemetria.
// Valores: "frente" | "curva_a_direita" | "curva_a_esquerda" | "meia_volta" | "parado"
const char *getUltimoMovimentoDFS();

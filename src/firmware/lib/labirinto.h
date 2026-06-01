#pragma once
#include <Arduino.h>

#define LAB_TAM 31
#define DIST_INFINITA 32767 // Distancia maxima é 31*31 

typedef struct Celula {
    short distancia;               // valor do flood fill (max 960 para 31×31)
    bool norte, sul, leste, oeste; // paredes conhecidas
    bool explorado;                // robô já visitou
    bool visitado;                 // visitou para o DFS 
} Celula;

typedef struct Labirinto {
    Celula celula[LAB_TAM][LAB_TAM];
} Labirinto;

void inicializaLabirinto(Labirinto *lab);

// -- marcar paredes --------------------------------------------------
void registrarParede(Labirinto *lab, int x, int y, char direcao);

#ifndef MOTORES_H
#define MOTORES_H

#include <Arduino.h>

// Variáveis globais dos motores expostas para a telemetria
extern int velocidadeEsquerdaAtual;
extern int velocidadeDireitaAtual;
extern bool motorsRunning;

// Funções de controle
void setupMotores();
void acionarMotores(int velEsquerda, int velDireita);
void stopMotors();
void moveForward();
void virarDireita90();
void virarEsquerda90();
void meiaVolta180();

#endif
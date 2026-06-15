#pragma once

#include <Arduino.h>
#include "../../utils/rato/rato.h"

// --------------------------------------------------------
// Encoders
// --------------------------------------------------------
// -- Calibração (tem que alterar) -----------------------------------
#define PULSOS_POR_CELULA 200 // pulsos de encoder para avançar uma célula
#define PULSOS_GIRO_90 95     // pulsos de encoder para girar 90°

void inicializaMotores(uint8_t in1L, uint8_t in2L,
                       uint8_t in1R, uint8_t in2R,
                       volatile long *encEsq, volatile long *encDir);

void Andar(Rato *rato);
void VirarEsquerda(Rato *rato);
void VirarDireita(Rato *rato);
void Virar180(Rato *rato);


// --------------------------------------------------------
// PWM Direto
// --------------------------------------------------------

// Variáveis globais dos motores (para a telemetria saber o estado)
extern int velocidadeEsquerdaAtual;
extern int velocidadeDireitaAtual;
extern bool motorsRunning;

// Funções de controlo
void setupMotores();
void acionarMotores(int velEsquerda, int velDireita);
void stopMotors();
void moveForward();
void virarDireita90();
void virarEsquerda90();
void meiaVolta180();
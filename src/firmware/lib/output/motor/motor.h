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
// PWM Direto e Controlo Reativo
// --------------------------------------------------------
// Variáveis globais dos motores (para a telemetria saber o estado)
extern int velocidadeEsquerdaAtual;
extern int velocidadeDireitaAtual;
extern bool motorsRunning;

// Funções de controlo base
void setupMotores();
void acionarMotores(int velEsquerda, int velDireita);
void stopMotors();
void moveForward();
void virarDireita90();
void virarEsquerda90();
void meiaVolta180();


// --------------------------------------------------------
// NOVO: Odometria em cm/s e Alinhamento PID
// --------------------------------------------------------
// Variáveis públicas para envio na telemetria local/MQTT
extern float velocidadeEsqCmS;
extern float velocidadeDirCmS;
extern float distanciaPercorridaCm;

/**
 * @brief Calcula a velocidade atual de cada roda em cm/s e aplica a correção
 * do PID analógico para manter o robô em linha reta.
 * Deve ser invocada ciclicamente (ex: a cada iteração de loops de movimento).
 */
void atualizarOdometriaEPID();

/**
 * @brief Move o robô em linha reta por uma distância exata em centímetros,
 * corrigindo o rumo via PID ativo em tempo real com base nos encoders.
 * @param distanciaCm Distância linear desejada (Ex: 18.0 para uma célula).
 */
void andarDistancia(float distanciaCm);
#pragma once

#include <Arduino.h>
#include "../../utils/rato/rato.h"

// --------------------------------------------------------
// Geometria do robô (base para todos os cálculos de pulso)
// --------------------------------------------------------
#define DIAMETRO_RODA_CM 4.4f           // (44 mm)
#define PULSOS_POR_VOLTA_RODA 146.0f    // pulsos de encoder por volta completa da roda
#define TAMANHO_CELULA_CM 18.0f         // tamanho de 1 célula do labirinto
#define COMPRIMENTO_ROBO_CM 13.5f       // comprimento do carrinho
#define DISTANCIA_ENTRE_RODAS_CM 9.5f  // distância minima entre as rodas - usada no cálculo de giro

extern const float CM_POR_PULSO;
extern const long PULSOS_POR_CELULA;
extern const long PULSOS_GIRO_90;
extern const long PULSOS_GIRO_180;
extern int VELOCIDADE_BASE_PWM;
// --------------------------------------------------------
// Encoders
// --------------------------------------------------------
void inicializaMotores(uint8_t in1L, uint8_t in2L,
                       uint8_t in1R, uint8_t in2R,
                       volatile long *encEsq, volatile long *encDir);

// Converte distância (cm) / ângulo (graus)  em pulsos de encoder (parece ter um erro, entãoe estou passando medidas diferentes para 18cm e 90°)
long calculaPulsosDistancia(float distanciaCm);
long calculaPulsosAngulo(float graus);

// -- Movimentos "de grade" (os mesmos usados pelo DFS/FloodFill) ---------------
//    1 célula (18 cm) / giro de 90° / giro de 180°. Assinatura inalterada.
void Andar(Rato *rato);
void VirarEsquerda(Rato *rato);
void VirarDireita(Rato *rato);
void Virar180(Rato *rato);

// -- Movimentos livres (uso em testes/calibração de bancada) -------------------
//    distância ou ângulo quaisquer, não presos ao grid do labirinto.
void AndarCm(Rato *rato, float distanciaCm);
void GirarGraus(Rato *rato, float graus); // graus > 0 => direita (horário) | graus < 0 => esquerda (anti-horário)


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
// Odometria em cm/s e Alinhamento PID
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
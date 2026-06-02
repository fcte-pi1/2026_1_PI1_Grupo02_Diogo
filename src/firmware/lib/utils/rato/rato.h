#pragma once
#include <Arduino.h>

typedef struct Rato
{
    int x, y;     // Posição no labirinto
    char direcao; // 'N', 'S', 'L', 'O'

    // Leituras dos sensores (cm)
    float distancia_frente;
    float distancia_esquerda;
    float distancia_direita;

    // Controle dos motores
    int pwm_motor_esquerdo;
    int pwm_motor_direito;

    // Contagem dos encoders
    long encoder_esquerdo;
    long encoder_direito;
} Rato;

void inicializaRato(Rato *rato);
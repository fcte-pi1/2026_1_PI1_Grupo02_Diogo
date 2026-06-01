#include "../lib/rato.h"

void inicializaRato(Rato *rato) {
    rato->x = 15;   // começa no meio da matriz 31x31
    rato->y = 15;   
    rato->direcao = 'N';

    rato->distancia_frente   = 0.0f;
    rato->distancia_esquerda = 0.0f;
    rato->distancia_direita  = 0.0f;

    rato->pwm_motor_esquerdo = 0;
    rato->pwm_motor_direito  = 0;

    rato->encoder_esquerdo = 0;
    rato->encoder_direito  = 0;
}
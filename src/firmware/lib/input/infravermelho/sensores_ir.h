#pragma once
#include <Arduino.h>
#include "../../utils/rato/rato.h"

#define DISTANCIA_LIVRE_CM 400.0f
#define DISTANCIA_PAREDE_CM 12.0f

#define ENDERECO_VL53L0X_ESQ   0x2A
#define ENDERECO_VL53L0X_DIR   0x31
#define ENDERECO_VL6180X_FRENTE 0x30

void inicializaSensores(uint8_t xshutFrente, uint8_t xshutEsquerda, uint8_t xshutDireita);

void atualizaSensores();

void lerDistancias(Rato *rato);

float getDistanciaFrente();
float getDistanciaEsquerda();
float getDistanciaDireita();

bool temParedeFrente();
bool temParedeEsquerda();
bool temParedeDireita();

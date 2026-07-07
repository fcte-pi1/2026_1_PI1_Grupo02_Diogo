#pragma once
#include <Arduino.h>
#include "../../utils/rato/rato.h"

#define DISTANCIA_LIVRE_CM 400.0f
#define DISTANCIA_PAREDE_CM 12.0f

void inicializaSensores();

void atualizaSensores();

void lerDistancias(Rato *rato);

float getDistanciaFrente();
float getDistanciaEsquerda();
float getDistanciaDireita();

bool temParedeFrente();
bool temParedeEsquerda();
bool temParedeDireita();

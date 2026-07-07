#pragma once
#include <Arduino.h>
#include "../../utils/rato/rato.h"

// Valor retornado quando o sensor não detecta nada no alcance
#define DISTANCIA_LIVRE_CM  400.0f
// Threshold de parede: distância abaixo desta = parede detectada
#define DISTANCIA_PAREDE_CM  12.0f

// Offset de montagem dos VL53L0X (em mm).
// Calibração: sensor lê ~50mm quando distância física real é ~10mm
// → offset = 50 - 10 = 40mm. Ajuste fino aqui se necessário.
#define VL53L0X_OFFSET_MM 40

void inicializaSensores();

void atualizaSensores();

void lerDistancias(Rato *rato);

float getDistanciaFrente();
float getDistanciaEsquerda();
float getDistanciaDireita();

bool temParedeFrente();
bool temParedeEsquerda();
bool temParedeDireita();

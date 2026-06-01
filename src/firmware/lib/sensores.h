#pragma once
#include <Arduino.h>
#include "rato.h"

// -- Constantes ---------------------------------------------------------------
#define DISTANCIA_LIVRE_CM    400.0f  // quando não ve nada
#define DISTANCIA_PAREDE_CM    12.0f  // < 12 = parede 
#define SENSOR_TIMEOUT_US     12000   // 12 ms ~ 200 cm máximo (alterar)
#define INTERVALO_TRIGGER_MS     20   // ms entre triggers (3 sensores × 20ms = 60ms/ciclo) (alterar)

// -- Inicialização ------------------------------------------------------------
// Configura pinos e ISRs
void inicializaSensores(uint8_t trigFrente,   uint8_t echoFrente,
                        uint8_t trigEsquerda, uint8_t echoEsquerda,
                        uint8_t trigDireita,  uint8_t echoDireita);



// Dispara um sensor a cada INTERVALO_TRIGGER_MS ms
void atualizaSensores();

// -- Leituras -----------------------------------------------------------------
// passa para a struct rato
void lerDistancias(Rato *rato);

float getDistanciaFrente();
float getDistanciaEsquerda();
float getDistanciaDireita();

// Retorna true se a distância for menor que DISTANCIA_PAREDE_CM (12cm)
bool temParedeFrente();
bool temParedeEsquerda();
bool temParedeDireita();
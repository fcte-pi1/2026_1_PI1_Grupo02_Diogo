#pragma once
#include <Arduino.h>
#include "../../utils/rato/rato.h"
#include "../../utils/mapa/labirinto.h"

// ============================================================
//  PINOS XSHUT — habilitação individual dos VL53L0X
//  (OUTPUT digital: LOW = sensor desligado, HIGH = sensor ativo)
// ============================================================
#define XSHUT_ESQ_PIN  4
#define XSHUT_DIR_PIN  5

// ============================================================
//  PINO SHDN — shutdown do VL6180X (SENSOR FRONTAL)
//  Necessário para evitar colisão de endereço I2C com os
//  VL53L0X (ambos default 0x29). LOW = sensor desligado.
// ============================================================
#define VL6180X_SHDN_PIN  23

// ============================================================
//  BUS I2C DOS SENSORES ToF
//  Wire1: SDA = GPIO 21 | SCL = GPIO 22
//  (Wire / I2C0 é exclusivo do INA219 em SDA=18, SCL=17)
// ============================================================
#define SENSOR_SDA 21
#define SENSOR_SCL 22

// ============================================================
//  ENDEREÇOS I2C APÓS REENDEREÇAMENTO
// ============================================================
#define ADDR_FRENTE   0x29   // VL6180X  — endereço de fábrica (não muda)
#define ADDR_ESQ      0x30   // VL53L0X esquerda — atribuído em runtime
#define ADDR_DIR      0x31   // VL53L0X direita  — atribuído em runtime

// ============================================================
//  THRESHOLDS DE DETECÇÃO
// ============================================================
#define DISTANCIA_PAREDE_CM   11.7f   // abaixo disto = há parede
#define DISTANCIA_LIVRE_CM   400.0f   // valor sentinela quando o sensor falha

// ============================================================
//  CORREÇÃO DE OFFSET DO VL6180X (calibração empírica)
//  O sensor lê sistematicamente ~23 mm a menos que a distância
//  real. Este valor é somado à leitura bruta em mm.
//  Calibrado em 2026-07-08 com alvo a 50–200 mm.
// ============================================================
#define VL6180X_OFFSET_MM   23

// ============================================================
//  API PÚBLICA
// ============================================================

/** Inicializa Wire1, reendereça os VL53L0X e configura os três sensores. */
void inicializaSensores();

/** Dispara uma leitura nos três sensores e atualiza os valores internos. */
void atualizaSensores();

/** Copia as distâncias internas para o struct Rato (com seção crítica). */
void lerDistancias(Rato *rato);

// Leituras brutas (cm)
float getDistanciaFrente();
float getDistanciaEsquerda();
float getDistanciaDireita();

// Detecção booleana de parede
bool temParedeFrente();
bool temParedeEsquerda();
bool temParedeDireita();

/**
 * Lê os 3 sensores e registra as paredes da célula atual no mapa.
 * Com 3 sensores simultâneos NÃO são necessárias rotações físicas.
 */
void mapearParedes(Rato *rato, Labirinto *lab);

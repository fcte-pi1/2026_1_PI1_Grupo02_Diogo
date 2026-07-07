#pragma once
#include <Arduino.h>
#include <Adafruit_INA219.h>
#include "../../utils/rato/rato.h"

void inicializaIna(Adafruit_INA219 *ina219);

void lerDadosEnergeticos(Rato *rato, Adafruit_INA219 *ina219);

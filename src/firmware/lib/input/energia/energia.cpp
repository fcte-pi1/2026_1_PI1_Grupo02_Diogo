#include "./energia.h"
#include <Wire.h>

void inicializaIna(Adafruit_INA219 *ina219)
{
    Wire.begin(15, 2);
    if (!ina219->begin())
    {
        Serial.println("Erro ao iniciar INA219");
    }
    else
    {
        Serial.println("INA219 iniciado");
    }
}

void lerDadosEnergeticos(Rato *rato, Adafruit_INA219 *ina219)
{
    rato->tensao = ina219->getBusVoltage_V();
    rato->corrente = ina219->getCurrent_mA();
}

#include "./energia.h"
#include <Wire.h>

void inicializaIna(Adafruit_INA219 *ina219)
{
    // INA219 está fisicamente em SDA=18, SCL=17.
    // GPIO 17 substituiu o GPIO 2 (strapping pin / LED) para evitar
    // conflito de boot e interferência no LED embutido.
    // Wire (I2C0) é exclusivo do INA219.
    Wire.begin(18, 17);
    if (!ina219->begin())
    {
        Serial.println("[INA219] ERRO ao iniciar (SDA=18 SCL=17)");
    }
    else
    {
        Serial.println("[INA219] iniciado");
    }
}

void lerDadosEnergeticos(Rato *rato, Adafruit_INA219 *ina219)
{
    float tensao   = ina219->getBusVoltage_V();
    float corrente = ina219->getCurrent_mA();
    // NaN/Inf → ArduinoJSON serializa como null, que o Zod rejeita com erro de validação.
    // Substituir por 0.0 mantém o payload válido quando o INA219 não está com carga.
    rato->tensao   = (isnan(tensao)   || isinf(tensao))   ? 0.0f : tensao;
    rato->corrente = (isnan(corrente) || isinf(corrente)) ? 0.0f : corrente;
}

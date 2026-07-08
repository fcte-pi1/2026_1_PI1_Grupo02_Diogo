#include <Arduino.h>
#include <Wire.h>
#include <VL6180X.h>

#define I2C_SDA 21
#define I2C_SCL 19
#define DISTANCIA_LIVRE_CM 400.0f

static VL6180X sensor;
static bool sensor_ok = false;

static void aguardarEnter()
{
    Serial.println("\nPressione ENTER para continuar...");
    while (Serial.read() == -1) delay(10);
    while (Serial.read() != -1) delay(10);
}

static bool lerSensor(uint8_t &mm)
{
    if (!sensor_ok) return false;
    mm = sensor.readRangeSingle();
    return !sensor.timeoutOccurred() && mm != 255;
}

static void fase1_leituraContinua()
{
    Serial.println("\n========================================");
    Serial.println("  FASE 1 — LEITURA CONTINUA");
    Serial.println("========================================");
    Serial.println("Movimente obstaculos na frente do sensor.");
    Serial.println("Observe os valores ao variar a distancia.");
    Serial.println("(pressione ENTER a qualquer momento para sair)\n");

    unsigned long inicio = millis();
    while (millis() - inicio < 120000) { // max 2 min
        if (Serial.available()) break;

        uint8_t mm;
        if (lerSensor(mm)) {
            float cm = mm / 10.0f;
            bool parede = cm < 12.0f;
            Serial.printf("  raw=%3u mm  dist=%5.1f cm  %s\n",
                          mm, cm, parede ? "PAREDE" : "livre");
        } else {
            Serial.println("  raw=255 mm  dist=40.0 cm  timeout/sem alvo");
        }
        delay(100);
    }
}

static void fase2_calibracao()
{
    const int distancias_mm[] = { 50, 80, 100, 120, 150, 200, 250, 300 };
    const int num = sizeof(distancias_mm) / sizeof(distancias_mm[0]);
    const int amostras = 20;

    struct Resultado {
        int real_mm;
        float media, min, max, desvio;
    } resultados[num];

    Serial.println("\n========================================");
    Serial.println("  FASE 2 — CALIBRACAO EM DISTANCIAS CONHECIDAS");
    Serial.println("========================================");
    Serial.println("Posicione o sensor a EXATAMENTE cada distancia");
    Serial.println("de uma parede branca plana (use uma regua).\n");

    for (int i = 0; i < num; i++) {
        int alvo = distancias_mm[i];
        Serial.printf("\n--- Distancia: %d mm ---\n", alvo);
        Serial.printf("Posicione o sensor a %d mm da parede e pressione ENTER\n", alvo);
        aguardarEnter();
        delay(500);

        uint16_t soma = 0;
        uint16_t leituras[amostras];
        uint16_t vmin = 0xFFFF, vmax = 0;
        int valida = 0;

        for (int j = 0; j < amostras; j++) {
            uint8_t mm;
            if (lerSensor(mm)) {
                leituras[valida] = mm;
                soma += mm;
                if (mm < vmin) vmin = mm;
                if (mm > vmax) vmax = mm;
                valida++;
            }
            delay(50);
        }

        if (valida < 3) {
            Serial.printf("  !! Poucas leituras validas (%d). Sensor pode estar fora de alcance.\n", valida);
            resultados[i].real_mm = alvo;
            resultados[i].media = 0;
            resultados[i].min = 0;
            resultados[i].max = 0;
            resultados[i].desvio = 0;
            continue;
        }

        float media = (float)soma / valida;
        float var = 0;
        for (int j = 0; j < valida; j++) {
            float d = leituras[j] - media;
            var += d * d;
        }
        float desvio = sqrt(var / valida);

        resultados[i].real_mm = alvo;
        resultados[i].media = media;
        resultados[i].min = vmin;
        resultados[i].max = vmax;
        resultados[i].desvio = desvio;

        Serial.printf("  Validas: %d/%d\n", valida, amostras);
        Serial.printf("  Media: %.1f mm | Min: %u mm | Max: %u mm\n", media, vmin, vmax);
        Serial.printf("  Desvio: %.2f mm | CV: %.1f%%\n", desvio, (desvio / media) * 100);
    }

    Serial.println("\n\n========================================");
    Serial.println("  TABELA DE CALIBRACAO");
    Serial.println("========================================");
    Serial.println("  Real   |  Media  |  Min  |  Max  | Desvio |  CV%  | Erro");
    Serial.println("  -------+---------+-------+-------+--------+-------+------");

    float somaOffset = 0;
    int offsetCount = 0;
    int alcanceMaximo = distancias_mm[num - 1];

    for (int i = 0; i < num; i++) {
        auto &r = resultados[i];
        if (r.media < 1) {
            Serial.printf("  %4d   |  ----   |  ---  |  ---  |  ---   |  ---  |  ---\n", r.real_mm);
            continue;
        }
        float erro = r.media - r.real_mm;
        float cv = (r.desvio / r.media) * 100;
        Serial.printf("  %4d   | %6.1f  | %4.0f  | %4.0f  | %5.2f  | %4.1f%% | %+5.1f\n",
                      r.real_mm, r.media, r.min, r.max, r.desvio, cv, erro);

        if (cv < 10.0f) {
            somaOffset += erro;
            offsetCount++;
            alcanceMaximo = r.real_mm;
        }
    }

    float offsetMedio = (offsetCount > 0) ? somaOffset / offsetCount : 0;
    float paredeCm = (12.0f + offsetMedio / 10.0f + 2.0f);

    Serial.println("\n\n========================================");
    Serial.println("  FASE 3 — RECOMENDACAO");
    Serial.println("========================================");
    Serial.printf("  Offset medio:              %+.1f mm\n", offsetMedio);
    Serial.printf("  Alcance maximo confiavel:   %d mm\n", alcanceMaximo);
    Serial.printf("  DISTANCIA_PAREDE_CM sugerido: %.1f\n", paredeCm);
    Serial.printf("    (parede real a 12 cm + offset %.1f cm + margem 2.0 cm)\n", offsetMedio / 10.0f);
    Serial.println();
    Serial.println("  Para aplicar, edite DISTANCIA_PAREDE_CM em sensores_ir.h:");
    Serial.printf("  #define DISTANCIA_PAREDE_CM  %.1ff\n", paredeCm);
    Serial.println();
    Serial.println("  Se o offset medio for > 5 mm, considere adicionar um");
    Serial.println("  #define VL6180X_OFFSET_MM X e subtrair em atualizaSensores().");
}

void setup()
{
    Serial.begin(115200);
    delay(2000);

    Serial.println("\n\n========================================");
    Serial.println("  CALIBRACAO VL6180X — MICROMOUSE");
    Serial.println("========================================\n");

    Wire1.begin(I2C_SDA, I2C_SCL);
    Wire1.setClock(100000);

    sensor.setBus(&Wire1);
    sensor.setTimeout(500);

    sensor.init();
    sensor.configureDefault();

    Wire1.beginTransmission(sensor.getAddress());
    sensor_ok = (Wire1.endTransmission() == 0);

    if (!sensor_ok) {
        Serial.println("[ERRO] VL6180X nao detectado!");
        Serial.println("Verifique: SDA=21, SCL=19, VCC=3.3V, GND=GND");
        while (1) delay(1000);
    }

    uint8_t id = sensor.readReg(0x000);
    Serial.printf("Model ID: 0x%02X %s\n", id, id == 0xB4 ? "(VL6180X) OK" : "(inesperado)");

    Serial.printf("Endereco I2C: 0x%02X\n", sensor.getAddress());
    Serial.printf("Firmware: %s\n", "Pololu VL6180X @ 1.2.x");

    fase1_leituraContinua();
    aguardarEnter();
    fase2_calibracao();

    Serial.println("\n=== CALIBRACAO CONCLUIDA ===");
    Serial.println("Copie os valores de DISTANCIA_PAREDE_CM e offset para o firmware.");
}

void loop()
{
    delay(1000);
}

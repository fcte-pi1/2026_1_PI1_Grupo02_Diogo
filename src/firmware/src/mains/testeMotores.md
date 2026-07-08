#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "../lib/utils/rato/rato.h"
#include "../lib/utils/mapa/labirinto.h"
#include "../lib/input/infravermelho/sensores_ir.h"
#include "../lib/output/motor/motor.h"
#include "../lib/utils/conexao/conexoes.h"
#include "../lib/utils/telemetria/telemetria.h"
#include "../lib/utils/floodfill/floodfill.h"
#include "../lib/utils/dfs/dfs.h"
#include "../lib/input/energia/energia.h"

// =================================================================================
//  MAIN DE TESTE - SEQUÊNCIA HARDCODE DE MOVIMENTOS
//
//  Objetivo: validar Andar() / VirarDireita() / VirarEsquerda() isoladamente,
//  sem DFS, floodfill, sensores ou MQTT no meio.


// -- Pinos (iguais ao main.cpp do projeto) ---------------------------------------
const uint8_t MOTOR_LEFT_IN1  = 26;
const uint8_t MOTOR_LEFT_IN2  = 25;
const uint8_t MOTOR_RIGHT_IN1 = 14;
const uint8_t MOTOR_RIGHT_IN2 = 27;

const uint8_t ENCODER_LEFT_A  = 32;
const uint8_t ENCODER_RIGHT_A = 34;

volatile long encoderLeftCount  = 0;
volatile long encoderRightCount = 0;

void IRAM_ATTR encoderLeftISR()  { encoderLeftCount++; }
void IRAM_ATTR encoderRightISR() { encoderRightCount++; }

// -- Sequência hardcode (43 comandos) --------------------------------------------
const char SEQUENCIA[] = {
    'f', 'e',
    'f', 'd',
    'f', 'f',

    'd', 'd',
    
    'f', 'f',
    'e', 'f',
    'd', 'f',

    'd', 'd'

    // 'd','d','d','d',
    // 'e','e','e','e',
    //     'd','d','d','d',
    //     'e','e','e','e',



    // 'f', 'f', 'f', 'f', 'f', 'f', 'f'
};
const int TOTAL_PASSOS = sizeof(SEQUENCIA) / sizeof(SEQUENCIA[0]);

Rato rato;

const unsigned long PAUSA_ENTRE_PASSOS_MS = 100;

void executaPasso(char comando)
{
    switch (comando)
    {
    case 'f':
    Serial.println("-> Andar (frente)");
    andarDistancia(13.8);          // com 13.8 está andando aproximadamente 18cm
    if (rato.direcao == 'N') rato.y++;
    else if (rato.direcao == 'S') rato.y--;
    else if (rato.direcao == 'L') rato.x++;
    else if (rato.direcao == 'O') rato.x--;
    break;
case 'd':
    Serial.println("-> Girar 90 direita");
    VirarDireita(&rato);
    if (rato.direcao=='N') rato.direcao='L';
    else if (rato.direcao=='L') rato.direcao='S';
    else if (rato.direcao=='S') rato.direcao='O';
    else if (rato.direcao=='O') rato.direcao='N';
    break;
case 'e':
    Serial.println("-> Girar 90 esquerda");
    VirarEsquerda(&rato);
    if (rato.direcao=='N') rato.direcao='O';
    else if (rato.direcao=='O') rato.direcao='S';
    else if (rato.direcao=='S') rato.direcao='L';
    else if (rato.direcao=='L') rato.direcao='N';
    break;
    default:
        Serial.println("-> Comando desconhecido, ignorado");
        break;
    }
    Serial.printf("   pos=(%d,%d) dir=%c | encL=%ld encR=%ld\n",
                  rato.x, rato.y, rato.direcao, encoderLeftCount, encoderRightCount);
}

void setup()
{
    
    Serial.begin(115200);
    delay(1000);

    pinMode(ENCODER_LEFT_A, INPUT_PULLUP);
    pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A), encoderLeftISR, RISING);
    attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, RISING);
    inicializaMotores(MOTOR_LEFT_IN1, MOTOR_LEFT_IN2,
        MOTOR_RIGHT_IN1, MOTOR_RIGHT_IN2,
        &encoderLeftCount, &encoderRightCount);
        setupMotores();
        stopMotors();
    inicializaRato(&rato);

    delay(5000);
}

void loop()
{

    Serial.println("=== INICIANDO TESTE DE MOTORES ===");
    Serial.printf("Total de passos: %d\n", TOTAL_PASSOS);
    delay(5000);

    for (int i = 0; i < TOTAL_PASSOS; i++)
    {
        if(i == 0){
            encoderLeftCount = 0;
            encoderRightCount = 0;
        }

        // if( i == 8)
        //     delay(5000);
 
        Serial.printf("[Passo %d/%d] comando='%c'\n", i + 1, TOTAL_PASSOS, SEQUENCIA[i]);
        executaPasso(SEQUENCIA[i]);
        delay(PAUSA_ENTRE_PASSOS_MS);
    }

    stopMotors();
    Serial.println("=== TESTE CONCLUIDO ===");

}
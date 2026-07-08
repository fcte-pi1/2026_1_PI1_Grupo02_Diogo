#ifndef PINOUT_H
#define PINOUT_H

// ==========================================
// MAPA DE PINOS DO HARDWARE
// ==========================================
const int LED_PIN = 2;

// Sensores Ultrassônicos
const int TRIG_FRONT = 4;   const int ECHO_FRONT = 16;
const int TRIG_LEFT = 17;   const int ECHO_LEFT = 5;
const int TRIG_RIGHT = 18;  const int ECHO_RIGHT = 19;

// Motores (Ponte H)
const int MOTOR_LEFT_IN1 = 26;  const int MOTOR_LEFT_IN2 = 25;
const int MOTOR_RIGHT_IN1 = 14; const int MOTOR_RIGHT_IN2 = 27;

// Encoders
const int ENCODER_LEFT_A = 33;  const int ENCODER_LEFT_B = 32;
const int ENCODER_RIGHT_A = 34; const int ENCODER_RIGHT_B = 35;

#endif
#include "../lib/movimentos.h"

// -- Pinos e encoders (registrados em inicializaMotors) -----------------------
static uint8_t _in1L, _in2L;
static uint8_t _in1R, _in2R;
static volatile long *_encEsq;
static volatile long *_encDir;

// -------------------------------------------------------------------------------
//  Inicializa motors
// -------------------------------------------------------------------------------

void inicializaMotors(uint8_t in1L, uint8_t in2L,
                      uint8_t in1R, uint8_t in2R,
                      volatile long *encEsq, volatile long *encDir)
{
    _in1L = in1L;
    _in2L = in2L;
    _in1R = in1R;
    _in2R = in2R;
    _encEsq = encEsq;
    _encDir = encDir;

    pinMode(_in1L, OUTPUT);
    pinMode(_in2L, OUTPUT);
    pinMode(_in1R, OUTPUT);
    pinMode(_in2R, OUTPUT);

    // motors parados no cmc
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, LOW);
}

// -------------------------------------------------------------------------------
// Funções de motor (auxiliar)
// -------------------------------------------------------------------------------

static void _stopMotors()
{
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, LOW);
}

static void _fowardMotors()
{
    digitalWrite(_in1L, HIGH);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, HIGH);
    digitalWrite(_in2R, LOW);
}

// Curva a esquerda
static void _rotateLeftMotors()
{
    digitalWrite(_in1L, LOW);
    digitalWrite(_in2L, HIGH);
    digitalWrite(_in1R, HIGH);
    digitalWrite(_in2R, LOW);
}

// Curva direita
static void _rotateRightMotors()
{
    digitalWrite(_in1L, HIGH);
    digitalWrite(_in2L, LOW);
    digitalWrite(_in1R, LOW);
    digitalWrite(_in2R, HIGH);
}

static void _esperarEncoder(long pulsos)
{ // Pra saber quando ele andou o suficiente(1 celula, 90° ou 180°)
    long baseEsq = *_encEsq;
    long baseDir = *_encDir;

    while ((*_encEsq - baseEsq) < pulsos || (*_encDir - baseDir) < pulsos)
    {
        yield();
    }
    _stopMotors();
}

// -------------------------------------------------------------------------------
//  ATUALIZAÇÃO DE POSIÇÃO E DIREÇÃO
//
//  Sistema de coordenadas:
//      Norte → y+1 | Sul → y-1 | Leste → x+1 | Oeste → x-1
//
//  Ordem horária para o índice de direção:
//      dirs[0]='N'  dirs[1]='L'  dirs[2]='S'  dirs[3]='O'
//      Girar direita (+1) | Girar esquerda (+3) | Meia volta (+2)
// -------------------------------------------------------------------------------

static const char _dirs[] = {'N', 'L', 'S', 'O'};

static int _indiceDirecao(char d)
{
    for (int i = 0; i < 4; i++)
        if (_dirs[i] == d)
            return i;
    return 0;
}

static void _atualizaDirecao(Rato *rato, int delta)
{
    rato->direcao = _dirs[(_indiceDirecao(rato->direcao) + delta + 4) % 4];
}

static void _atualizaPosicao(Rato *rato)
{
    switch (rato->direcao)
    {
    case 'N':
        rato->y++;
        break;
    case 'S':
        rato->y--;
        break;
    case 'L':
        rato->x++;
        break;
    case 'O':
        rato->x--;
        break;
    }
}

// -------------------------------------------------------------------------------
//  MOVIMENTOS PÚBLICOS
// -------------------------------------------------------------------------------

void Andar(Rato *rato)
{
    _fowardMotors();
    _esperarEncoder(PULSOS_POR_CELULA);
    _atualizaPosicao(rato);

    // Salva contagem total nos campos do micromouse
    rato->encoder_esquerdo = *_encEsq;
    rato->encoder_direito = *_encDir;
}

void VirarEsquerda(Rato *rato)
{
    _rotateLeftMotors();
    _esperarEncoder(PULSOS_GIRO_90);
    _atualizaDirecao(rato, -1); // N→O→S→L→N (anti-horário)
}

void VirarDireita(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_90);
    _atualizaDirecao(rato, +1); // N→L→S→O→N (horário)
}

void Virar180(Rato *rato)
{
    _rotateRightMotors();
    _esperarEncoder(PULSOS_GIRO_90 * 2);
    _atualizaDirecao(rato, +2); // N↔S | L↔O
}
#include "correcao_parede.h"
#include <math.h>

static const float LIMIAR_PAREDE_CM = 3.0f;
static const float DIFERENCA_MINIMA_CM = 1.5f;
static const int AJUSTE_PAREDE_PWM = 12;
static const int AJUSTE_CURVA_PWM = 6;

void aplicarCorrecaoParede(float distEsq, float distDir, int &pwmEsq, int &pwmDir, bool emCurva)
{
    float limiteAtivo = LIMIAR_PAREDE_CM;
    int ajuste = AJUSTE_PAREDE_PWM;

    if (emCurva)
    {
        limiteAtivo = LIMIAR_PAREDE_CM + 2.0f;
        ajuste = AJUSTE_CURVA_PWM;
    }

    if (distEsq > limiteAtivo && distDir > limiteAtivo)
        return;

    float diferenca = distEsq - distDir;
    if (fabs(diferenca) < DIFERENCA_MINIMA_CM)
        return;

    if (diferenca < 0.0f)
    {
        pwmEsq -= ajuste;
        pwmDir += ajuste;
    }
    else
    {
        pwmEsq += ajuste;
        pwmDir -= ajuste;
    }
}

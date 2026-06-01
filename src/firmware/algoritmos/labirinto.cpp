#include "../lib/labirinto.h"

// -------------------------------------------------------------------------------
//  INICIALIZAÇÃO
// -------------------------------------------------------------------------------

void inicializaLabirinto(Labirinto *lab)
{
    for (int x = 0; x < LAB_TAM; x++)
    {
        for (int y = 0; y < LAB_TAM; y++)
        {
            lab->celula[x][y].distancia = DIST_INFINITA;
            lab->celula[x][y].norte = false;
            lab->celula[x][y].sul = false;
            lab->celula[x][y].leste = false;
            lab->celula[x][y].oeste = false;
            lab->celula[x][y].explorado = false;
            lab->celula[x][y].visitado = false;
        }
    }

    // Bordas = paredes
    for (int i = 0; i < LAB_TAM; i++)
    {
        lab->celula[i][0].sul = true;
        lab->celula[i][LAB_TAM - 1].norte = true;
        lab->celula[0][i].oeste = true;
        lab->celula[LAB_TAM - 1][i].leste = true;
    }
}

// // -------------------------------------------------------------------------------
// //  marcar parede encontrada (a parte de "visitado" e "explorado" tem que ser feita dentro do algoritmo de movimento)
// // -------------------------------------------------------------------------------

void registrarParede(Labirinto *lab, int x, int y, char direcao)
{
    switch (direcao)
    {
    case 'N':
        lab->celula[x][y].norte = true;
        if (y + 1 < LAB_TAM)
            lab->celula[x][y + 1].sul = true;
        break;
    case 'S':
        lab->celula[x][y].sul = true;
        if (y - 1 >= 0)
            lab->celula[x][y - 1].norte = true;
        break;
    case 'L':
        lab->celula[x][y].leste = true;
        if (x + 1 < LAB_TAM)
            lab->celula[x + 1][y].oeste = true;
        break;
    case 'O':
        lab->celula[x][y].oeste = true;
        if (x - 1 >= 0)
            lab->celula[x - 1][y].leste = true;
        break;
    }
}
#include "../lib/mapa.h"
#include <fstream>
#include <stdio.h>

using namespace std;

void CarregaMapa(char mapa[16][16], const char *mapa16x16)
{

    ifstream arquivo(mapa16x16);

    if (!arquivo.is_open())
    {
        printf("ERRO");
        return;
    }

    for (int i = 0; i < 16; i++)
    {
        for (int j = 0; j < 16; j++)
        {
            arquivo >> mapa[i][j];
        }
    }
    arquivo.close();
}

void IniciaMapa(char mapa[16][16])
{

    for (int i = 0; i < 16; i++)
    {
        for (int j = 0; j < 16; j++)
        {
            mapa[i][j] = '.';
        }
    }
}

void PrintaMapa(char mapa[16][16])
{

    for (int i = 0; i < 16; i++)
    {
        for (int j = 0; j < 16; j++)
        {
            printf(" %c", mapa[i][j]);
        }
        printf("\n");
    }
}

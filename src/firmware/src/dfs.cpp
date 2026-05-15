#include <stdio.h>
#include <cstdio>
#include <fstream>
#include <iostream>

using namespace std;

typedef struct Rato{
    int x;
    int y;
    char direcao;
}Rato;

struct Celula{
    int visitada;
    int parede_sul;
    int parede_norte;
    int parede_leste;
    int parede_oeste;
};

void CarregaMapa(char mapa[16][16], const char *mapa16x16){

    ifstream arquivo(mapa16x16);

    if(!arquivo.is_open()){
        printf("ERRO");
        return;
    }

    for(int i = 0; i < 16; i++){
        for(int j = 0; j < 16; j++){
            arquivo >> mapa[i][j];
        }
    }
    arquivo.close();
}

void IniciaMapa(char mapa[16][16]){

    for(int i = 0; i < 16; i++){
        for(int j = 0; j < 16; j++){
            mapa[i][j] = '.';
        }
    }
}

void PrintaMapa(char mapa[16][16]){

    for(int i = 0; i < 16; i++){
        for(int j = 0; j < 16; j++){
            printf(" %c", mapa[i][j]);
        }
        printf("\n");
    }
}

void AdicionaCarrinho(char mapa[16][16], Rato *rato){

    mapa[rato->x][rato->y] = 'R';

}

int VerificaObjetivo(char mapa[16][16], Rato *rato){

    if(mapa[rato->x+1][rato->y] == '+' && mapa[rato->x][rato->y + 1] == '+' && mapa[rato->x][rato->y - 1] == '+'){
        printf("achou!!!!");
        return 1;
        
    }
    return 0;

}

void AndaRato(char mapa[16][16], Rato *rato){

while(VerificaObjetivo(mapa, rato) == 0){
    if(mapa[rato->x + 1][rato->y] == '.' && mapa[rato->x + 1][rato->y] != 'v'){
        mapa[rato->x][rato->y] = 'v';
        rato->x++;
        rato->y;
        mapa[rato->x][rato->y] = 'R';
        PrintaMapa(mapa);
        printf("\n\n");
        
    }
    else if(mapa[rato->x][rato->y+1] == '.' && mapa[rato->x][rato->y+1] != 'v'){
        mapa[rato->x][rato->y] = 'v';
        rato->x;
        rato->y++;
        mapa[rato->x][rato->y] = 'R';
        PrintaMapa(mapa);
        printf("\n\n");
    }

}
}

int main(){

    Rato micromouse;
    char mapa[16][16];

    micromouse.x = 0;
    micromouse.y = 0;

    IniciaMapa(mapa);

    CarregaMapa(mapa, "mapa16x16.txt");

    AdicionaCarrinho(mapa, &micromouse);

    AndaRato(mapa, &micromouse);

    return 0;
}
#include "../lib/rato.h"
#include "../lib/mapa.h"
#include <stdio.h>

void AdicionaCarrinho(char mapa[16][16], Rato *rato){
    mapa[rato->x][rato->y] = 'R';
}

char& LocalizacaoRato(char mapa[16][16], Rato *rato){

    return mapa[rato->x][rato->y];

}

char Baixo(char mapa[16][16], Rato *rato){

    if(rato->y + 1> 15) return '#';
    return mapa[rato->x][rato->y + 1];

}

char Direita(char mapa[16][16], Rato *rato){

    if(rato->x+1 > 15) return '#';
    return mapa[rato->x + 1][rato->y];

}

char Cima(char mapa[16][16], Rato *rato){

    if(rato->y-1 < 0) return '#';
    return mapa[rato->x][rato->y - 1];
}

char Esquerda(char mapa[16][16], Rato *rato){

    if(rato->x -1 < 0) return '#';
    return mapa[rato->x - 1][rato->y];
}

void AndaDireita(char mapa[16][16], Rato *rato){

        LocalizacaoRato(mapa,rato) = 'v';
        rato->x++;
        // rato->y+0;
        LocalizacaoRato(mapa,rato) = 'R';
        PrintaMapa(mapa);
        printf("\n\n");

}

void AndaBaixo(char mapa[16][16], Rato *rato){

        LocalizacaoRato(mapa,rato) = 'v';
        // rato->x+0;
        rato->y++;
        LocalizacaoRato(mapa,rato) = 'R';
        PrintaMapa(mapa);
        printf("\n\n");
}

void AndaEsquerda(char mapa[16][16], Rato *rato){


        LocalizacaoRato(mapa,rato) = 'v';
        rato->x--;
        // rato->y-0;
        LocalizacaoRato(mapa,rato) = 'R';
        PrintaMapa(mapa);
        printf("\n\n");
    

}

void AndaCima(char mapa[16][16], Rato *rato){    
        LocalizacaoRato(mapa,rato) = 'v';
        // rato->x-0;
        rato->y--;
        LocalizacaoRato(mapa,rato) = 'R';
        PrintaMapa(mapa);
        printf("\n\n");
}

int VerificaObjetivo(char mapa[16][16], Rato *rato){

    if(Baixo(mapa, rato) == '+' && Direita(mapa,rato) == '+' && Cima(mapa,rato) == '+'){
        printf("achou!!!!");
        return 1;
        
    }
    return 0;

}

void AndaRato(char mapa[16][16], Rato *rato){

while(VerificaObjetivo(mapa, rato) == 0){
    if(Direita(mapa,rato) == '.' && Direita(mapa,rato) != 'v'){
        AndaDireita(mapa,rato);
}
    else if(Baixo(mapa,rato) == '.' && Baixo(mapa,rato) != 'v'){
        AndaBaixo(mapa,rato);
}
    else if(Esquerda(mapa,rato) == '.' && Esquerda(mapa,rato) != 'v'){
        AndaEsquerda(mapa,rato);
}
    else if(Cima(mapa,rato) == '.' && Cima(mapa,rato) != 'v'){
        AndaCima(mapa,rato);
}
    else{
        printf("beco sem saida");
        break;
        }
    }
}
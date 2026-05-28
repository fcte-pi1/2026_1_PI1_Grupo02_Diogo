#ifndef RATO_H
#define RATO_H

typedef struct Rato {
    int x;
    int y;
    char direcao;
} Rato;

void AdicionaCarrinho(char mapa[16][16], Rato *rato);

char& LocalizacaoRato(char mapa[16][16], Rato *rato);

char Baixo(char mapa[16][16], Rato *rato);
char Direita(char mapa[16][16], Rato *rato);
char Cima(char mapa[16][16], Rato *rato);
char Esquerda(char mapa[16][16], Rato *rato);

void AndaDireita(char mapa[16][16], Rato *rato);
void AndaBaixo(char mapa[16][16], Rato *rato);
void AndaEsquerda(char mapa[16][16], Rato *rato);
void AndaCima(char mapa[16][16], Rato *rato);

int VerificaObjetivo(char mapa[16][16], Rato *rato);
void AndaRato(char mapa[16][16], Rato *rato);

#endif
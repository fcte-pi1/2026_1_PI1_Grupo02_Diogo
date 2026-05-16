#include "../include/mapa.h"
#include "../include/rato.h"


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
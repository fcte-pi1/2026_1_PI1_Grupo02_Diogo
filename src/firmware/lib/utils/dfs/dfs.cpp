#include "./dfs.h"
#include "../../output/motor/motor.h"
#include "../../input/ultrassonico/sensores.h"

// -------------------------------------------------------------------------------
//  ESTADO INTERNO DO DFS (escopo de arquivo para permitir reset via resetDFS())
//
//  Pilha do trilho percorrido. Invariante: _pilha[_topo] == célula atual do robô.
// -------------------------------------------------------------------------------
static PosicaoDFS _pilha[LAB_TAM * LAB_TAM];
static int _topo = -1;
static bool _inicializado = false;

void resetDFS()
{
    _topo = -1;
    _inicializado = false;
}

// -------------------------------------------------------------------------------
//  DIREÇÕES
//
//  Ordem horária (mesma de motor.cpp):  N(0) -> L(1) -> S(2) -> O(3)
//  Coordenadas: Norte -> y+1 | Sul -> y-1 | Leste -> x+1 | Oeste -> x-1
// -------------------------------------------------------------------------------
static const char _dirs[] = {'N', 'L', 'S', 'O'};

static int _indiceDir(char d)
{
    for (int i = 0; i < 4; i++)
        if (_dirs[i] == d)
            return i;
    return 0;
}

// Direção absoluta da célula vizinha relativa à orientação atual do robô
//   relativa = 0 -> frente | 1 -> direita | 3 -> esquerda
static char _dirRelativa(char direcaoAtual, int relativa)
{
    return _dirs[(_indiceDir(direcaoAtual) + relativa + 4) % 4];
}

// Vizinho na direção absoluta informada
static void _vizinho(int x, int y, char dir, int *nx, int *ny)
{
    *nx = x;
    *ny = y;
    switch (dir)
    {
    case 'N':
        (*ny)++;
        break;
    case 'S':
        (*ny)--;
        break;
    case 'L':
        (*nx)++;
        break;
    case 'O':
        (*nx)--;
        break;
    }
}

// Há parede registrada na célula (x,y) na direção informada?
static bool _temParede(Labirinto *lab, int x, int y, char dir)
{
    switch (dir)
    {
    case 'N':
        return lab->celula[x][y].norte;
    case 'S':
        return lab->celula[x][y].sul;
    case 'L':
        return lab->celula[x][y].leste;
    case 'O':
        return lab->celula[x][y].oeste;
    }
    return true;
}

// Direção absoluta para ir de (x,y) até a célula adjacente (tx,ty)
static char _direcaoEntre(int x, int y, int tx, int ty)
{
    if (tx == x + 1)
        return 'L';
    if (tx == x - 1)
        return 'O';
    if (ty == y + 1)
        return 'N';
    return 'S'; // ty == y - 1
}

// -------------------------------------------------------------------------------
//  ÚLTIMO MOVIMENTO (para telemetria)
// -------------------------------------------------------------------------------
static const char *_ultimoMovimento = "parado";

const char *getUltimoMovimentoDFS()
{
    return _ultimoMovimento;
}

// Gira o robô para encarar a direção absoluta 'alvo' e devolve o descritor do giro.
// O deslocamento em si (Andar) é feito por quem chama.
static const char *_virarPara(Rato *rato, char alvo)
{
    int diff = (_indiceDir(alvo) - _indiceDir(rato->direcao) + 4) % 4;
    switch (diff)
    {
    case 1:
        VirarDireita(rato);
        return "curva_a_direita";
    case 2:
        Virar180(rato);
        return "meia_volta";
    case 3:
        VirarEsquerda(rato);
        return "curva_a_esquerda";
    default: // 0 — já está na direção certa
        return "frente";
    }
}

// -------------------------------------------------------------------------------
//  DETECÇÃO DO CENTRO 2x2
//
//  O objetivo é um bloco 2x2 de células totalmente aberto entre si (sem paredes
//  internas). Verificamos os 4 blocos 2x2 que contêm a célula atual. Exigimos que
//  as 4 células do bloco já tenham sido EXPLORADAS — caso contrário a detecção
//  dispararia logo no início, já que o labirinto inicia sem paredes internas.
// -------------------------------------------------------------------------------
static bool _verificaCentro(Labirinto *lab, int x, int y, int *destinoX, int *destinoY)
{
    // cantos inferior-esquerdos (bx,by) dos blocos 2x2 que incluem (x,y)
    const int cantos[4][2] = {{x, y}, {x - 1, y}, {x, y - 1}, {x - 1, y - 1}};

    for (int i = 0; i < 4; i++)
    {
        int bx = cantos[i][0];
        int by = cantos[i][1];

        if (bx < 0 || by < 0 || bx >= LAB_TAM - 1 || by >= LAB_TAM - 1)
            continue;

        // as 4 células do bloco precisam ter sido visitadas/exploradas
        if (!lab->celula[bx][by].explorado ||
            !lab->celula[bx + 1][by].explorado ||
            !lab->celula[bx][by + 1].explorado ||
            !lab->celula[bx + 1][by + 1].explorado)
            continue;

        // paredes internas do bloco 2x2 ausentes:
        //   leste de (bx,by)   e leste de (bx,by+1)  -> divisória vertical aberta
        //   norte de (bx,by)   e norte de (bx+1,by)  -> divisória horizontal aberta
        bool aberto =
            !lab->celula[bx][by].leste &&
            !lab->celula[bx][by + 1].leste &&
            !lab->celula[bx][by].norte &&
            !lab->celula[bx + 1][by].norte;

        if (aberto)
        {
            *destinoX = bx;
            *destinoY = by;
            return true;
        }
    }
    return false;
}

// -------------------------------------------------------------------------------
//  PASSO DE DFS (iterativo, pilha explícita estática)
// -------------------------------------------------------------------------------
void passoDFS(Rato *rato, Labirinto *lab, bool *motorsRunning,
              unsigned long *stepCounter, int *destinoX, int *destinoY,
              bool *conclusao, Estado *estado)
{
    if (!_inicializado)
    {
        _topo = 0;
        _pilha[0].x = rato->x;
        _pilha[0].y = rato->y;
        _inicializado = true;
    }

    // 1) Sensores
    atualizaSensores();
    lerDistancias(rato);

    // 2) Registrar paredes vistas na célula atual (converte relativo -> absoluto)
    char dirFrente = _dirRelativa(rato->direcao, 0);
    char dirDireita = _dirRelativa(rato->direcao, 1);
    char dirEsquerda = _dirRelativa(rato->direcao, 3);

    if (temParedeFrente())
        registrarParede(lab, rato->x, rato->y, dirFrente);
    if (temParedeDireita())
        registrarParede(lab, rato->x, rato->y, dirDireita);
    if (temParedeEsquerda())
        registrarParede(lab, rato->x, rato->y, dirEsquerda);

    // 3) Marcar célula atual
    lab->celula[rato->x][rato->y].explorado = true;
    lab->celula[rato->x][rato->y].visitado = true;

    // 4) Contabilizar o passo
    (*stepCounter)++;

    // 5) Chegou no centro 2x2?
    if (_verificaCentro(lab, rato->x, rato->y, destinoX, destinoY))
    {
        *conclusao = true;
        *motorsRunning = false;
        *estado = CONCLUIDO;
        _ultimoMovimento = "parado";
        return;
    }

    // 6/7) Escolher próximo movimento: frente -> direita -> esquerda
    //      Só anda para vizinha que NÃO foi visitada e sem parede entre elas.
    char ordem[3] = {dirFrente, dirDireita, dirEsquerda};
    for (int i = 0; i < 3; i++)
    {
        char dir = ordem[i];

        if (_temParede(lab, rato->x, rato->y, dir))
            continue;

        int nx, ny;
        _vizinho(rato->x, rato->y, dir, &nx, &ny);

        if (nx < 0 || ny < 0 || nx >= LAB_TAM || ny >= LAB_TAM)
            continue;
        if (lab->celula[nx][ny].visitado)
            continue;

        // Vizinha válida e inédita -> vira, anda e empilha a nova posição
        _ultimoMovimento = _virarPara(rato, dir);
        Andar(rato); // atualiza rato->x / rato->y
        *motorsRunning = true;

        if (_topo < LAB_TAM * LAB_TAM - 1)
        {
            _topo++;
            _pilha[_topo].x = rato->x;
            _pilha[_topo].y = rato->y;
        }
        return;
    }

    // 8) Sem vizinhas inéditas -> backtrack (volta para o ponto anterior do trilho)
    _topo--; // desempilha a célula atual

    if (_topo < 0)
    {
        // 9) Pilha vazia: exploração completa sem encontrar o centro
        *motorsRunning = false;
        *estado = CONCLUIDO;
        _ultimoMovimento = "parado";
        return;
    }

    PosicaoDFS anterior = _pilha[_topo];
    char dirVolta = _direcaoEntre(rato->x, rato->y, anterior.x, anterior.y);
    _ultimoMovimento = _virarPara(rato, dirVolta);
    Andar(rato); // volta uma célula; rato->x/y passam a ser os de 'anterior'
    *motorsRunning = true;
}

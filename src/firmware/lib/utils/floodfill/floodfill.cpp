#include "./floodfill.h"

static const char _dirs[] = {'N', 'L', 'S', 'O'};

static bool _temParede(Labirinto *lab, int x, int y, char dir) // true/false de parede "na direção"
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

static void _vizinho(int x, int y, char dir, int *nx, int *ny) // {[nx][ny]} tem a celula "da direção"
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

// Fila circular pro BFS
static PosicaoFloodFill _fila[LAB_TAM * LAB_TAM];
static int _inicio = 0;
static int _fim = 0;
static int _quantidade = 0;

static void _push(PosicaoFloodFill p) // _fila.emplace_back(pair<int, int>)
{
    _fila[_fim] = p;
    _fim = (_fim + 1) % (LAB_TAM * LAB_TAM);
    _quantidade++;
}

static PosicaoFloodFill _pop() // _fila.pop()
{
    PosicaoFloodFill p = _fila[_inicio];
    _inicio = (_inicio + 1) % (LAB_TAM * LAB_TAM);
    _quantidade--;
    return p;
}

void executaFloodFill(Labirinto *lab, const PosicaoFloodFill destinos[], int quantidadeDestinos)
{
    //  dados da queue
    _inicio = 0;
    _fim = 0;
    _quantidade = 0;

    // reset de distâncias
    for (int x = 0; x < LAB_TAM; x++)
        for (int y = 0; y < LAB_TAM; y++)
            lab->celula[x][y].distancia = DIST_INFINITA;

    for (int i = 0; i < quantidadeDestinos; i++) // na volta é 1x1, na corrida é 2x2, por isso um vetor de destino
    {
        lab->celula[destinos[i].x][destinos[i].y].distancia = 0; // destino tem distancia 0
        _push(destinos[i]);                                      // adiciona o pair<x, y> para a queue
    }

    while (_quantidade > 0) // while(!queue.empty())
    {
        PosicaoFloodFill atual = _pop();
        int distAtual = lab->celula[atual.x][atual.y].distancia;

        for (int d = 0; d < 4; d++) // para cada direção
        {
            char dir = _dirs[d];
            if (_temParede(lab, atual.x, atual.y, dir)) //  Pula iteração se tiver parede na direção
                continue;

            int nx, ny;
            _vizinho(atual.x, atual.y, dir, &nx, &ny);
            if (nx < 0 || ny < 0 || nx >= LAB_TAM || ny >= LAB_TAM) // pra nao sair do mapa
                continue;

            if (lab->celula[nx][ny].distancia > distAtual + 1) // se: celula da direção > autual+1
            {
                lab->celula[nx][ny].distancia = distAtual + 1; //   atualiza o valor dela pra atual + 1
                _push({nx, ny});
            }
        }
    }
}

char escolheProximoMovimento(Labirinto *lab, int x, int y, char direcaoAtual)
{
    int melhorDistancia = DIST_INFINITA;
    char melhorDirecao = 'X';

    for (int d = 0; d < 4; d++) //  pra cada direção
    {
        char dir = _dirs[d];
        if (_temParede(lab, x, y, dir)) // proxima iteração se tiver parede na direção
            continue;

        int nx, ny;
        _vizinho(x, y, dir, &nx, &ny);
        if (nx < 0 || ny < 0 || nx >= LAB_TAM || ny >= LAB_TAM) // proxima iteração se sair do mapa
            continue;

        int dist = lab->celula[nx][ny].distancia;

        if (dist < melhorDistancia || (dist == melhorDistancia && dir == direcaoAtual)) // guarda a celula mais proxima do fim, comprioridade pra ir reto
        {
            melhorDistancia = dist;
            melhorDirecao = dir;
        }
    }

    return melhorDirecao; // passa a direção para celula mais proxima do fim
}

static bool _floodFillPronto = false;
static const char *_ultimoMovimentoFF = "parado"; // para telemetria

const char *getUltimoMovimentoFloodFill()
{
    return _ultimoMovimentoFF;
}

void resetFloodFill() // tem q usar entre um floodfill e outro (volta - corrida)
{
    _floodFillPronto = false;
    _ultimoMovimentoFF = "parado";
}

static int _indiceDir(char d)
{
    for (int i = 0; i < 4; i++)
        if (_dirs[i] == d)
            return i;
    return 0;
}
// relativa: 0 = frente, 1 = direita, 2 = tras, 3 = esquerda
static char _dirRelativa(char direcaoAtual, int relativa)
{
    return _dirs[(_indiceDir(direcaoAtual) + relativa + 4) % 4];
}

static const char *_virarPara(Rato *rato, char alvo) // vira para direção de menor distancia
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
    default:
        return "frente";
    }
}

void passoFloodFill(Rato *rato, Labirinto *lab, bool *motorsRunning,
                    int destinoX, int destinoY,
                    bool *conclusao, Estado *estado)
{
    if (!_floodFillPronto)
    {
        PosicaoFloodFill alvo = {destinoX, destinoY};
        executaFloodFill(lab, &alvo, 1);
        _floodFillPronto = true;
    }

    // Verifica se chegou no destino
    if (rato->x == destinoX && rato->y == destinoY)
    {
        *motorsRunning = false;
        *estado = CONCLUIDO;
        *conclusao = true;
        _ultimoMovimentoFF = "parado";
        return;
    }

    // Sensores pra detectar paredes ainda não encontradas pelo DFS
    atualizaSensores();
    lerDistancias(rato);

    char dirFrente = _dirRelativa(rato->direcao, 0);
    char dirDireita = _dirRelativa(rato->direcao, 1);
    char dirEsquerda = _dirRelativa(rato->direcao, 3);

    bool novaParede = false;

    if (temParedeFrente() && !_temParede(lab, rato->x, rato->y, dirFrente)) // se tem parede na frente mas não no mapa
    {
        registrarParede(lab, rato->x, rato->y, dirFrente);
        novaParede = true;
    }
    if (temParedeDireita() && !_temParede(lab, rato->x, rato->y, dirDireita)) // se tem parede na direita mas não no mapa
    {
        registrarParede(lab, rato->x, rato->y, dirDireita);
        novaParede = true;
    }
    if (temParedeEsquerda() && !_temParede(lab, rato->x, rato->y, dirEsquerda)) // se tem parede na esquerda mas não no mapa
    {
        registrarParede(lab, rato->x, rato->y, dirEsquerda);
        novaParede = true;
    }

    // Se teve atualização de parede refaz o calculo da rota
    if (novaParede)
    {
        PosicaoFloodFill alvo = {destinoX, destinoY};
        executaFloodFill(lab, &alvo, 1);
    }

    // Pega a direção do melhor movimento
    char proxDir = escolheProximoMovimento(lab, rato->x, rato->y, rato->direcao);

    if (proxDir == 'X') // So entra se tiver erro (nao encontrou caminho)
    {
        *motorsRunning = false;
        *estado = CONCLUIDO;
        *conclusao = true;
        _ultimoMovimentoFF = "parado";
        return;
    }

    // vira para o caminho escolhido e anda pra frente
    _ultimoMovimentoFF = _virarPara(rato, proxDir);
    Andar(rato);
    *motorsRunning = true;
}
Exemplo de formato JSON

```json
{
    "step"                          // Qual o passo esta (atualiza na movimentação)
    "tempoMs": 0,                   // Tempo em que os dados foram coletados em milissegundos

    "modo": "DFS",                  // Modo atual do robô (DFS, VOLTA, COMPETICAO)
    "estado": "EXPLORANDO",         // estado atual 
    "posicao": {                    // na matriz[15][15]
        "x": 0,                     // posição j na matriz[i][j]
        "y": 0                      // posição i na matriz[i][j]
    },
    "direcao": "norte",             // Direção atual do robô
    "ultimoMovimento": "frente",    // Último movimento realizado

    "paredes":{                     // se na célula atual tem paredes
        "norte": false,
        "sul": false,
        "leste": false,
        "oeste": false
    },

    "motores": {
        "pwmEsquerdo": 0,           // Contagem de pulsos
        "pwmDireito": 0             // Contagem de pulsos
    },

    "sensores": {
        "esquerdaCm": 0.0,              // Distância medida pelo sensor esquerdo
        "direitaCm": 0.0,               // Distância medida pelo sensor direito
        "frenteCm": 0.0                 // Distância medida pelo sensor da frente
    },

    "energia": {
        "tensaoV": 0.0,              // Tensão atual da bateria
        "correnteMa": 0.0             // Corrente consumida pelo sistema
    },

    "concluido": false            // Indica se o objetivo do modo atual foi concluído
}
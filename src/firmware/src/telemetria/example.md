Exemplo de formato JSON

```json
{
    "tempoMs": 0,                   // Tempo em que os dados foram coletados em milissegundos

    "modo": "DFS",                  // Modo atual do robô (DFS, VOLTA, COMPETICAO)
    "ultimoMovimento": "frente",    // Último movimento realizado
    "direcao": "norte",             // Direção atual do robô

    "posicao": {                    // na matriz[15][15]
        "x": 0,                     // posição j na matriz[i][j]
        "y": 0                      // posição i na matriz[i][j]
    },

    "motores": {
        "pwmEsquerdo": 0,           // Contagem de pulsos
        "pwmDireito": 0             // Contagem de pulsos
    },

    "sensores": {
        "esquerda": 0.0,              // Distância medida pelo sensor esquerdo
        "direita": 0.0,               // Distância medida pelo sensor direito
        "frente": 0.0                 // Distância medida pelo sensor da frente
    },

    "energia": {
        "tensao": 0.0,              // Tensão atual da bateria
        "corrente": 0.0             // Corrente consumida pelo sistema
    },

    "concluido": false            // Indica se o objetivo do modo atual foi concluído
}
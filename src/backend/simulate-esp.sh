#!/bin/bash

# Arrays com os valores dos enums
MODOS=("DFS" "FLOOD FILL" "CORRIDA")
ESTADOS=("PARADO" "EXPLORANDO" "ERRO" "FINALIZADO")
MOVIMENTOS=("frente" "curva_a_esquerda" "curva_a_direita" "meia_volta" "parado")

# Função auxiliar para gerar true ou false
get_bool() {
  [ $((RANDOM % 2)) -eq 1 ] && echo "true" || echo "false"
}

# ----------------------------------------------------
# Variáveis de Estado (Simulação de Caminho)
# ----------------------------------------------------
POS_X=0
POS_Y=0
STEP=0
DIRECAO="norte"

while true; do
  # Lógica de movimento: tenta mover para uma célula vizinha
  # Tem 50% de chance de tentar um movimento, caso contrário envia telemetria da mesma posição
  if [ $((RANDOM % 2)) -eq 1 ]; then
    NOVO_X=$POS_X
    NOVO_Y=$POS_Y
    NOVA_DIRECAO=$DIRECAO
    
    # Sorteia uma das 4 direções adjacentes
    case $((RANDOM % 4)) in
      0) NOVO_Y=$((POS_Y + 1)); NOVA_DIRECAO="norte" ;;
      1) NOVO_Y=$((POS_Y - 1)); NOVA_DIRECAO="sul" ;;
      2) NOVO_X=$((POS_X + 1)); NOVA_DIRECAO="leste" ;;
      3) NOVO_X=$((POS_X - 1)); NOVA_DIRECAO="oeste" ;;
    esac

    # Verifica os limites do labirinto (assumindo tamanho 16x16, de 0 a 15)
    if [ "$NOVO_X" -ge 0 ] && [ "$NOVO_X" -le 15 ] && [ "$NOVO_Y" -ge 0 ] && [ "$NOVO_Y" -le 15 ]; then
      POS_X=$NOVO_X
      POS_Y=$NOVO_Y
      DIRECAO=$NOVA_DIRECAO
      ((STEP++)) # Incrementa o step apenas se mudou de célula
    fi
  fi

  # Sorteando os outros enums
  MODO="${MODOS[$RANDOM % ${#MODOS[@]}]}"
  ESTADO="${ESTADOS[$RANDOM % ${#ESTADOS[@]}]}"
  MOVIMENTO="${MOVIMENTOS[$RANDOM % ${#MOVIMENTOS[@]}]}"

  # Construindo o payload com o estado atualizado
  PAYLOAD=$(cat <<EOF
{
  "step": $STEP,
  "tempoMs": $((RANDOM % 500)),
  "modo": "$MODO",
  "estado": "$ESTADO",
  "posicao": { 
    "x": $POS_X, 
    "y": $POS_Y 
  },
  "direcao": "$DIRECAO",
  "ultimoMovimento": "$MOVIMENTO",
  "paredes": {
    "norte": $(get_bool),
    "sul": $(get_bool),
    "leste": $(get_bool),
    "oeste": $(get_bool)
  },
  "motores": { 
    "pwmEsquerdo": $RANDOM, 
    "pwmDireito": $RANDOM 
  },
  "sensores": { 
    "esquerdaCm": $((RANDOM % 100)), 
    "frenteCm": $((RANDOM % 100)), 
    "direitaCm": $((RANDOM % 100)) 
  },
  "energia": { 
    "tensaoV": $((RANDOM % 12)), 
    "correnteMa": $((RANDOM % 500)) 
  },
  "conclusao": $(get_bool),
  "robotId": "esp32-sim-01"
}
EOF
)

  # Remove as quebras de linha e limpa os espaços
  PAYLOAD_LIMPO=$(echo "$PAYLOAD" | tr -d '\n' | tr -s ' ')

  echo "Enviando (Step: $STEP | X: $POS_X, Y: $POS_Y | Dir: $DIRECAO)"

  docker run --rm --network host eclipse-mosquitto mosquitto_pub \
    -h localhost \
    -p 1883 \
    -t "rato/telemetria" \
    -m "$PAYLOAD_LIMPO"

  sleep 1
done
#!/bin/bash
#
# Simula telemetria da ESP32 publicando no MQTT (tópico rato/telemetria).
#
# Modo padrão (realista): percorre o labirinto 8x8 em zigue-zague, paredes só
# nas bordas e telemetria estável — ideal para testar Dashboard / histórico.
#
# Modo aleatório (legado, quadrados vermelhos): SIM_MODE=random ./simulate-esp.sh
#
# Pré-requisitos:
#   1. Broker Mosquitto (docker compose up broker -d na pasta src/)
#   2. Backend com MQTT_URL=mqtt://localhost:1883
#   3. Frontend no Dashboard (Ctrl+D)
#
# Uso:
#   cd src/backend && chmod +x simulate-esp.sh && ./simulate-esp.sh

if [[ "$(uname -s)" == "Darwin" ]]; then
  MQTT_HOST="${MQTT_HOST:-host.docker.internal}"
  DOCKER_NET=()
else
  MQTT_HOST="${MQTT_HOST:-localhost}"
  DOCKER_NET=(--network host)
fi

MQTT_PORT="${MQTT_PORT:-1883}"
MQTT_TOPIC="${MQTT_TOPIC:-rato/telemetria}"
SIM_MODE="${SIM_MODE:-realistic}"
MAZE_SIZE="${MAZE_SIZE:-8}"
MAX_IDX=$((MAZE_SIZE - 1))

MODOS=("DFS" "FLOOD FILL" "CORRIDA")
ESTADOS=("PARADO" "EXPLORANDO" "ERRO" "FINALIZADO")
MOVIMENTOS=("frente" "curva_a_esquerda" "curva_a_direita" "meia_volta" "parado")

get_bool() {
  [ $((RANDOM % 2)) -eq 1 ] && echo "true" || echo "false"
}

# Paredes determinísticas: só borda do labirinto 8x8 (alinha com o frontend).
border_walls_json() {
  local x=$1
  local y=$2
  local north="false"
  local south="false"
  local east="false"
  local west="false"

  [ "$y" -ge "$MAX_IDX" ] && north="true"
  [ "$y" -le 0 ] && south="true"
  [ "$x" -ge "$MAX_IDX" ] && east="true"
  [ "$x" -le 0 ] && west="true"

  echo "{\"norte\":$north,\"sul\":$south,\"leste\":$east,\"oeste\":$west}"
}

POS_X=0
POS_Y=0
STEP=0
DIRECAO="leste"
ROW_DIR=1 # 1 = leste, -1 = oeste (zigue-zague)

publish_payload() {
  local walls_json
  if [ "$SIM_MODE" = "random" ]; then
    walls_json="{\"norte\":$(get_bool),\"sul\":$(get_bool),\"leste\":$(get_bool),\"oeste\":$(get_bool)}"
  else
    walls_json=$(border_walls_json "$POS_X" "$POS_Y")
  fi

  local modo estado movimento tensao conclusao
  if [ "$SIM_MODE" = "random" ]; then
    modo="${MODOS[$RANDOM % ${#MODOS[@]}]}"
    estado="${ESTADOS[$RANDOM % ${#ESTADOS[@]}]}"
    movimento="${MOVIMENTOS[$RANDOM % ${#MOVIMENTOS[@]}]}"
    tensao=$((RANDOM % 12))
    conclusao=$(get_bool)
  else
    modo="DFS"
    estado="EXPLORANDO"
    movimento="frente"
    tensao=$(awk "BEGIN { printf \"%.1f\", 12.4 - ($STEP * 0.02) }")
    conclusao="false"
  fi

  local sens_frente sens_esq sens_dir
  if [ "$SIM_MODE" = "random" ]; then
    sens_frente=$((RANDOM % 100))
    sens_esq=$((RANDOM % 100))
    sens_dir=$((RANDOM % 100))
  else
    sens_frente=25
    sens_esq=30
    sens_dir=25
  fi

  local payload
  payload=$(cat <<EOF
{
  "step": $STEP,
  "tempoMs": $((STEP * 1000)),
  "modo": "$modo",
  "estado": "$estado",
  "posicao": { "x": $POS_X, "y": $POS_Y },
  "direcao": "$DIRECAO",
  "ultimoMovimento": "$movimento",
  "paredes": $walls_json,
  "motores": { "pwmEsquerdo": 120, "pwmDireito": 120 },
  "sensores": {
    "esquerdaCm": $sens_esq,
    "frenteCm": $sens_frente,
    "direitaCm": $sens_dir
  },
  "energia": { "tensaoV": $tensao, "correnteMa": 220 },
  "conclusao": $conclusao,
  "robotId": "esp32-sim-01"
}
EOF
)

  local payload_limpo
  payload_limpo=$(echo "$payload" | tr -d '\n' | tr -s ' ')

  echo "Enviando [$SIM_MODE] (Step: $STEP | X: $POS_X, Y: $POS_Y | Dir: $DIRECAO)"

  docker run --rm "${DOCKER_NET[@]}" eclipse-mosquitto mosquitto_pub \
    -h "$MQTT_HOST" \
    -p "$MQTT_PORT" \
    -t "$MQTT_TOPIC" \
    -m "$payload_limpo"
}

move_random() {
  if [ $((RANDOM % 2)) -eq 0 ]; then
    return
  fi

  local novo_x=$POS_X
  local novo_y=$POS_Y
  local nova_direcao=$DIRECAO

  case $((RANDOM % 4)) in
    0) novo_y=$((POS_Y + 1)); nova_direcao="norte" ;;
    1) novo_y=$((POS_Y - 1)); nova_direcao="sul" ;;
    2) novo_x=$((POS_X + 1)); nova_direcao="leste" ;;
    3) novo_x=$((POS_X - 1)); nova_direcao="oeste" ;;
  esac

  if [ "$novo_x" -ge 0 ] && [ "$novo_x" -le "$MAX_IDX" ] && [ "$novo_y" -ge 0 ] && [ "$novo_y" -le "$MAX_IDX" ]; then
    POS_X=$novo_x
    POS_Y=$novo_y
    DIRECAO=$nova_direcao
    ((STEP++))
  fi
}

# Zigue-zague: (0,0)→(7,0)→(7,1)→(0,1)→…
move_snake() {
  if [ "$ROW_DIR" -eq 1 ]; then
    DIRECAO="leste"
    if [ "$POS_X" -lt "$MAX_IDX" ]; then
      POS_X=$((POS_X + 1))
    elif [ "$POS_Y" -lt "$MAX_IDX" ]; then
      POS_Y=$((POS_Y + 1))
      ROW_DIR=-1
      DIRECAO="oeste"
    else
      return
    fi
  else
    DIRECAO="oeste"
    if [ "$POS_X" -gt 0 ]; then
      POS_X=$((POS_X - 1))
    elif [ "$POS_Y" -lt "$MAX_IDX" ]; then
      POS_Y=$((POS_Y + 1))
      ROW_DIR=1
      DIRECAO="leste"
    else
      return
    fi
  fi
  ((STEP++))
}

echo "▶ Simulador ESP (modo: $SIM_MODE, labirinto ${MAZE_SIZE}x${MAZE_SIZE})"
echo "  Ctrl+C para parar | Modo caótico: SIM_MODE=random ./simulate-esp.sh"

while true; do
  publish_payload

  if [ "$SIM_MODE" = "random" ]; then
    move_random
  else
    move_snake
  fi

  sleep 1
done

# Backend

API de telemetria para o robô resolvedor de labirintos. Recebe dados via MQTT, persiste com Prisma/PostgreSQL e transmite ao frontend por WebSockets.

## Stack

- Node.js 20 + TypeScript
- Express (API REST)
- Prisma ORM + PostgreSQL
- MQTT (broker Mosquitto)
- WebSockets (Socket.IO)

## Arquitetura

Organizada por camadas para facilitar testes, reuso e evolução:

- `src/config`: leitura e validação de variáveis de ambiente
- `src/lib`: clientes e integrações compartilhadas (ex.: Prisma)
- `src/routes`: definição de rotas HTTP
- `src/controllers`: validação e resposta HTTP
- `src/services`: regras de negócio (telemetria, MQTT)
- `src/repositories`: acesso ao banco
- `src/websocket`: inicialização e emissão de eventos

Fluxo de dados:

1. ESP32 publica JSON em `MQTT_TOPIC_TELEMETRY`.
2. `mqtt.service` recebe a mensagem.
3. `telemetry.service` parseia, grava no banco e emite via WebSocket.
4. Frontend recebe `telemetry:new` e pode solicitar histórico.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

- `NODE_ENV`: ambiente (`development`/`production`)
- `PORT`: porta HTTP da API
- `DATABASE_URL`: URL do PostgreSQL
- `MQTT_URL`: URL do broker MQTT
- `MQTT_USERNAME`, `MQTT_PASSWORD`: credenciais (opcional)
- `MQTT_CLIENT_ID`: identificador do client MQTT
- `MQTT_TOPIC_TELEMETRY`: tópico de telemetria
- `CORS_ORIGIN`: origem permitida para API/WS
- `TELEMETRY_HISTORY_LIMIT`: limite de histórico enviado

## Scripts

- `npm run dev`: inicia o servidor com hot reload
- `npm run build`: compila para `dist/`
- `npm run start`: roda o build
- `npm run prisma:generate`: gera o client Prisma
- `npm run prisma:migrate`: aplica migrações
- `npm run prisma:studio`: abre o Prisma Studio

## Como rodar (local)

1. Suba o PostgreSQL e o Mosquitto (via docker-compose da raiz ou local).
2. Crie o `.env` a partir de `.env.example`.
3. Instale dependências:

```bash
npm install
```

4. Rode migrações:

```bash
npm run prisma:migrate
```

5. Inicie o backend:

```bash
npm run dev
```

## API REST

- `GET /health`: status simples
- `GET /api/telemetry?limit=100`: lista telemetrias mais recentes
- `GET /api/telemetry/:id`: consulta por id

## WebSockets

Eventos enviados:

- `telemetry:new`: nova telemetria persistida
- `telemetry:history`: lote de telemetrias recentes

Eventos recebidos:

- `telemetry:subscribe` com `{ "limit": 200 }` para receber histórico

## MQTT

Publique JSON em `MQTT_TOPIC_TELEMETRY`. Se o payload nao for JSON valido, o backend salva em `payload.raw`.

## Observações

- A tabela `Telemetry` armazena o payload como JSON (campo `payload`).
- O campo `robotId` e extraido do JSON quando presente.
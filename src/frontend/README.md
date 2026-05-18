# Dashboard de Telemetria - Frontend

Este diretório contém a interface de visualização do Rato Robótico.

## 🛠️ Stack Tecnológica
- **Framework:** React (Vite)
- **Estilização:** Tailwind CSS
- **Comunicação:** Socket.io-client (WebSockets)
- **Gráficos:** Recharts

## 📂 Estrutura de Pastas
- `/src/components`: Componentes reutilizáveis (Gráficos, Gauge de Energia, Grid do Labirinto).
- `/src/hooks`: Lógica de conexão com WebSockets e estados globais.
- `/src/assets`: Ícones futuristas e texturas de grid hexagonal.
- `/src/styles`: Configurações do Tailwind e temas de cores.
- `/src/tests`: Testes centralizados por tipo (components, hooks, utils, services, pages, integration) com mocks e fixtures reutilizáveis.

## ✅ Testes
- Rodar uma vez: `npm test`
- Modo watch: `npm run test:watch`
- Estrutura dos testes: `src/tests`

## 🚀 Como Inicializar
1. Certifique-se de que o **Node.js** está instalado.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` baseado no `.env.example` (aponte para a URL do Backend).
4. Inicie o servidor de desenvolvimento:
   
```bash
   npm run dev
   ```

## 📏 Padronização
- Siga as regras de branches: `feat/soft-descricao`.
- Commits devem seguir o padrão: `feat(soft): descrição`.

> [!IMPORTANT]
> **Nunca** envie a pasta `node_modules/` ou arquivos `.env` com credenciais reais para o repositório.
```

---

### ⚙️ README: Backend (Node.js + Express)

Localização sugerida: `/software/backend/README.md`

```markdown
# 🧠 Cérebro do Sistema - Backend

Responsável pelo processamento dos algoritmos de busca (A*/Flood Fill), gerenciamento do banco de dados e ponte de comunicação entre o **MQTT (ESP32)** e **WebSockets (Frontend)**.

## 🛠️ Stack Tecnológica
- **Ambiente:** Node.js + Express
- **Banco de Dados:** PostgreSQL (via Docker)
- **Protocolos:** MQTT (escuta o robô) e WebSockets (fala com o site)
- **ORM:** Prisma ou Sequelize

## 🏗️ Arquitetura de Dados
Os dados recebidos do robô seguem o fluxo definido na Issue de Arquitetura:
1. **Input:** Mensagens MQTT no tópico `rato/telemetria`.
2. **Processamento:** O backend valida a coordenada e atualiza o mapa no banco.
3. **Output:** Envio instantâneo via WebSockets para o Dashboard.

## 🚀 Como Inicializar
1. Utilize o Docker para subir a infraestrutura:
   
```bash
   docker-compose up -d
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute as migrations do banco de dados:
   ```bash
   npx prisma migrate dev
   ```
4. Inicie o servidor:
   ```bash
   npm run start:dev
   ```

## 📏 Padronização
- Branches: `feat/soft-descricao`.
- Commits: `feat(soft): descrição`.
# 📝 [2026.1] Projeto Rato Robótico - Grupo 2

Este é o repositório central para o desenvolvimento do projeto de **Projeto Integrador 1 (PI1)**. O objetivo é desenvolver um rato robótico capaz de mapear e resolver um labirinto de forma autônoma.

-----

## 🏗️ Estrutura desse diretório (src)

O diretório está organizado para facilitar a colaboração entre as frentes de **Software** no desenvolvimento da aplicação. Dessa forma, em conformidade com a arquitetura do projeto, o diretório está dividido em:

*   `/backend`: Cérebro do sistema (Node.js/Express) que processa telemetria e lógica de busca.
*   `/frontend`: Dashboard futurista (React/Vite) para monitoramento em tempo real.
*   `/firmware`: Código-fonte do ESP32 (C++/PlatformIO) para controle de sensores e motores.
*   `docker-compose.yml`: Orquestração de todo o ecossistema de software.

-----

## 🚀 Como Iniciar (Ambiente Docker)

Para garantir que todos rodem o mesmo ambiente (Banco de Dados, Broker MQTT e Servidores), utilizamos Docker.

### Pré-requisitos:
*   Docker e Docker Compose instalados.
*   Arquivos `.env` configurados em `/backend` e `/frontend` (use os arquivos `.env.example` como base).

### Comandos Principais:

1.  **Subir o ambiente completo:**
  ```bash
  docker-compose up --build 
  ```
*Isso iniciará o Backend (porta 3000), o Frontend (porta 5173), o PostgreSQL e o Broker MQTT Mosquitto.*

2. **Parar a execução:**
  ```bash
  CTRL + C` no terminal ou `docker-compose down.
  ```

3. **Acessar logs de um serviço específico:**
```bash
docker-compose logs -f backend
```
-----
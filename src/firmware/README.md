# 🐀 Guia de Configuração e Upload do Firmware (ESP32)

Este repositório contém o firmware de telemetria e controle do robô MicroMouse desenvolvido sobre a plataforma **ESP32** utilizando o **PlatformIO**. O circuito comunica-se via protocolo MQTT enviando payloads estruturados para o ecossistema Docker (Mosquitto Broker + Backend Node.js + PostgreSQL).

---

## 🛠️ Pré-requisitos e Instalação

1. **VS Code**: Certifique-se de ter o Visual Studio Code instalado.
2. **Extensão PlatformIO**:
   * Abra o VS Code, vá na aba de Extensões (`Ctrl + Shift + X`).
   * Busque por **PlatformIO IDE** e clique em **Instalar**.
   * Aguarde a inicialização do ambiente (um ícone de formiga 🐜 aparecerá na barra lateral esquerda).

---

## 🏗️ Estrutura e Arquivos Críticos de Configuração

> ⚠️ **ATENÇÃO ANTES DE COMMITAR:** Os arquivos `src/main.cpp` e `platformio.ini` contêm credenciais de Wi-Fi e mapeamento de portas USB que variam de acordo com o computador de cada membro. **Evite subir alterações desses parâmetros locais para o Git** para não quebrar o ambiente da bancada dos colegas.

### 1. Configurações de Rede e Portas (`platformio.ini`)
Abra o arquivo na raiz do projeto do firmware e atente-se às seguintes diretivas:

```ini
; ---------------------------------------------------------------------
; Ambiente 1: Desenvolvimento Físico na Placa DevKit V1 (Bancada Local)
; A Placa configurada atualmente foi testada e validada, por favor
; NÃO altere a configuração do ambiente 'esp32dev' nem a velocidade do monitor.
; ---------------------------------------------------------------------

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.3
    adafruit/Adafruit INA219@^1.2.3

; 🔌 PORTAS USB LOCAIS: Comentadas para usar a varredura automática do PlatformIO.
; Se precisar travar em uma porta específica do Linux, mude o número e tire o ';'
; upload_port = /dev/ttyUSB1
; monitor_port = /dev/ttyUSB1

; ---------------------------------------------------------------------
; Ambiente 2: Configuração EXCLUSIVA para Testes Automatizados na CI (GitHub Actions)
; Comente para passar o código para a ESP32 real, descomente para rodar testes unitários locais.
; ---------------------------------------------------------------------
[env:native]
platform = native
test_framework = unity
```

### 2. Configurações de Firmware (`src/main.cpp`)

Dentro de `src/main.cpp`, verifique e ajuste as variáveis globais de rede e comunicação:

```cpp
// ---------------- CREDENCIAIS LOCAIS (ALTERE PARA O SEU WI-FI) ----------------
const char* WIFI_SSID = "NOME_DO_SEU_WIFI";
const char* WIFI_PASSWORD = "SENHA_DO_SEU_WIFI";

// ---------------- CONFIGURAÇÃO DO BROKER (DOCKER) ----------------
// Troque pelo IP local da máquina que está rodando o 'docker compose up'
const char* MQTT_BROKER = "192.168.0.12"; 
const int MQTT_PORT = 1883;
const char* MQTT_TELEMETRY_TOPIC = "rato/telemetria";
const char* ROBOT_ID = "UAV-MOUSE-01";
```

---

## 🚀 Ciclo de Desenvolvimento (Build, Upload e Monitor)

As ferramentas de execução ficam localizadas na **barra inferior** do VS Code ou no painel do ícone do PlatformIO (🐜):

1. **Check (Build) `✓`**: Compila o código C++ localmente para validar se não existem erros de sintaxe ou bibliotecas faltando.
2. **Seta para Direita (Upload) `→`**: Grava fisicamente o binário compilado na memória flash da ESP32.
3. **Plugue de Tomada (Serial Monitor) `🔌`**: Abre a comunicação serial nativa na velocidade `115200` para debugar os prints do robô (`Serial.println`) no terminal.

---

## 🚨 Checklist de Sobrevivência na Bancada (Erros Comuns)

### 1. Erro fatal: `Could not open /dev/ttyUSB0, port is busy or doesn't exist`

No Linux (Ubuntu), o sistema bloqueia o acesso à porta serial por padrão ou altera o índice após o Docker subir.

* Se der erro, descubra o nome real da sua porta rodando: `ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null`
* Libere a permissão de leitura e escrita com o comando:
```bash
sudo chmod 666 /dev/ttyUSB0   # Substitua pelo número/nome correto encontrado
```

* Se o erro persistir, **comente** as linhas `upload_port` e `monitor_port` no `platformio.ini` para que o PlatformIO faça a varredura automática.

### 2. O JSON está grande demais e o backend não recebe nada?

O validador DTO do nosso backend exige um payload completo de telemetria elétrica e espacial. Como a string gerada é gigante, a biblioteca `PubSubClient` da ESP32 **vai ignorar o envio por estouro de buffer** se o limite não for aumentado manualmente.

* **Solução:** Nunca remova a seguinte linha de configuração dentro do `void setup()` no `main.cpp`:
```cpp
// Mantém o buffer expandido para pacotes grandes passarem pela rede
client.setBufferSize(1024); 
```

### 3. Validação estrita do DTO no Backend

O payload JSON enviado pela placa deve conter **estritamente chaves idênticas** às mapeadas no validador do backend. Caso altere alguma medição de hardware (ex: mudar o nome de `pwmEsquerdo` para `rpmEsquerdo`), o backend rejeitará a inserção e exibirá um log de violação de DTO no console do Docker.

---


# 🗺️ Roadmap de Desenvolvimento & Calibração (Pendências)

Abaixo estão os módulos técnicos que precisam ser definidos e documentados pelo grupo nas próximas sprints:

## 1. Definição da Arquitetura do Robô
* [ ] **Modelagem Física:** Definir a distribuição de peso, diâmetro exato das rodas e distância entre os eixos (distância entre rodas) para cálculo de odometria.
* [ ] **Machine State (Máquina de Estados):** Mapear o fluxo lógico dos estados do robô (`PARADO`, `EXPLORANDO`, `CORRIDA_RAPIDA`, `FINALIZADO`) dentro do loop principal.
* [ ] **Integração do INA219:** Descomentar e validar a leitura real de tensão e corrente do circuito para alimentar a telemetria elétrica.

## 2. Parâmetros e Calibração do Encoder
* [ ] **Resolução do Disco:** Documentar o número de pulsos por volta (PPR) do encoder acoplado ao motor.
* [ ] **Cálculo de Distância:** Implementar a conversão matemática de pulsos para milímetros baseada no perímetro da roda:
    $$\text{Distância} = \frac{\text{Pulsos} \times (\pi \times \text{Diâmetro da Roda})}{\text{PPR}}$$
* [ ] **Alinhamento de Trajetória:** Implementar e calibrar um controle PID simples para ajustar a velocidade dos motores caso um lado do encoder esteja contando mais rápido que o outro em linha reta.

## 3. Calibração dos Sensores Ultrassônicos
* [ ] **Curva de Erro:** Mapear a precisão das leituras de distância em centímetros (`readUltrasonic`) comparando com uma régua física na bancada.
* [ ] **Filtro de Ruído:** Avaliar a necessidade de implementar uma média móvel simples nas leituras para evitar falsas detecções de paredes provocadas por reflexos do som.
* [ ] **Limiar de Parede (Threshold):** Ajustar o valor crítico atual de `10.0f` no código para a distância ideal em que o robô deve centralizar ou desviar das paredes das células do labirinto.
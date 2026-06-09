# 📝 [2026.1] Projeto Ratobô - Grupo 2

Este é o repositório central para o desenvolvimento do projeto de **Projeto Integrador 1 (PI1)**. O objetivo é desenvolver um rato robótico capaz de mapear e resolver um labirinto de forma autônoma.

-----

## 🏗️ Estrutura do Projeto

O repositório está organizado para facilitar a colaboração entre as frentes de **Energia, Estrutura, Eletrônica e Software**:

  * `/docs`: Documentação técnica e relatórios (LaTeX/Overleaf).
  * `/hw`: Esquemáticos e PCBs (EasyEDA/Altium).
  * `/mec`: Modelos CAD, arquivos para impressão 3D e design do labirinto.
  * `/src`: Código-fonte do ESP32 (Firmware) e Dashboard Web (Frontend/Backend).

-----

## 🚦 Como Contribuir (IMPORTANTE)

Para manter a organização entre as 4 equipes, seguimos um fluxo de trabalho rigoroso. **Antes de realizar qualquer alteração, leia o nosso [Guia de Contribuição (CONTRIBUTING.md)](https://github.com/fcte-pi1/2026_1_PI1_Grupo02_Diogo/blob/main/CONTRIBUTING.md)**.

### Resumo das Regras:

1.  **Não commite na `main`**: Use branches de funcionalidade (`feat/`, `fix/`) a partir da branch `develop` 
2.  **Padrão de Commits**: Use o formato `tipo(escopo): descrição` (ex: `feat(soft): adiciona algoritmo A*`).
3.  **Issues**: Toda tarefa deve estar documentada em uma Issue e atribuída a um ou dois membros.

-----

## 🛠️ Tecnologias e Ferramentas

| Frente | Tecnologias |
| :--- | :--- |
| **Software** | ESP32 (C++), React, MQTT, WebSockets, Expres.js, PrismaORM, Postgres |
| **Eletrônica** | EasyEDA, Motores com Encoder, Sensores Ultrassônicos/IR |
| **Estrutura** | Impressão 3D (PLA/ABS), CAD (Fusion360) |
| **Energia** | Baterias Li-Po, Sensores de Tensão e Corrente |

-----

## 📅 Links e Referências Rápidas

  * 📘 **Template Relatório Técnico (Overleaf):** [Link do Projeto](https://www.overleaf.com/project/64ecade6b5042884c2722cc8)
  * 📊 **Tutorial para Rodar software:** [Tutorial README.md](https://github.com/fcte-pi1/2026_1_PI1_Grupo02_Diogo/blob/main/src/README.md)
  * 📂 **Documento de Decisões:** [Link do Google Docs](https://docs.google.com/document/d/1rcPcyDlrb-aLtko67VCIYEqcur4CE0YzXbpeuBHNm5k/edit?usp=sharing)

-----

> [\!IMPORTANT]
> **Atenção Grupo:** Evitem o envio de arquivos binários pesados (\>5MB). Para vídeos de testes, subam em plataformas externas (YouTube/Drive) e adicionem o link na documentação.

-----

### 🎓 Instruções Originais do Template (PI1)

\<details\>
\<summary\>Clique para ver as instruções da disciplina\</summary\>

1.  **Nomenclatura do Repositório:** `<ano>.<semestre>_PI1_Grupo<n>_<professor>`.
2.  **Equipe:** Criar equipe com sufixo `_Equipe` e garantir permissões de escrita.
3.  **Avaliação:** A organização e utilização correta das ferramentas do GitHub (PRs, Issues, Branches) compõem a nota do grupo.

\</details\>

-----
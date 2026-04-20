# 🚀 Guia de Contribuição e Padronização

Este documento estabelece os padrões de desenvolvimento e colaboração para o projeto de PI1 - Rato Robô Labirinto. O cumprimento destas normas é essencial para a organização e integridade do projeto entre as frentes de **Energia, Estrutura, Eletrônica e Software**.

## 🌿 Fluxo de Trabalho (Git Flow)

Para manter a estabilidade do projeto, **não é permitido realizar commits diretamente na `main`**.

1.  **Issues:** Antes de iniciar qualquer tarefa, certifique-se de que existe uma Issue aberta e atribuída a você.
2.  **Branches:** Crie uma ramificação a partir da `develop` para sua tarefa:
    * Formato: `tipo/setor-descrição` (ex: `feat/soft-mapeamento` ou `docs/energ-calculo-bateria`).
3.  **Pull Requests (PR):** Ao finalizar, abra um PR para a branch `develop`. Todo PR deve ser revisado por pelo menos um outro membro antes do merge.

---

## 🌳 Gestão de Branches

Utilizamos nomes de branches padronizados para identificar rapidamente o que está sendo desenvolvido e por qual equipe. O formato deve ser:
`tipo/setor-descricao-curta`

### Categorias de Branches (Tipos):
* `feat/`: Para novas funcionalidades, componentes ou peças.
* `fix/`: Para correções de bugs, erros em circuitos ou ajustes em modelos 3D.
* `docs/`: Para alterações em documentação e manuais.
* `test/`: Para códigos de teste de sensores ou protótipos de estrutura.

### Identificadores de Setor:
* `soft-`: Software
* `eletr-`: Eletrônica
* `estru-`: Estrutura
* `energ-`: Energia

**Exemplos de nomes de branches:**
- `feat/soft-algoritmo-busca`
- `fix/eletr-esquematico-ponte-h`
- `docs/energ-tabela-consumo`
- `feat/estru-chassi-v1`

---

## 📝 Padronização de Commits

Adotamos o padrão **Conventional Commits**. As mensagens devem estar em português e seguir a estrutura:
`<tipo>(escopo): <descrição curta em letras minúsculas>`

### Tipos de Commit:
* **feat**: Nova funcionalidade ou componente.
* **fix**: Correção de erros ou problemas.
* **docs**: Alterações em documentação.
* **chore**: Atualizações de configuração ou bibliotecas.
* **refactor**: Melhoria de código/projeto sem alterar funcionalidade.

### Escopos de Commit:
Use os mesmos identificadores de setor: `soft`, `eletr`, `estru`, `energ`.

**Exemplos:**
- `feat(soft): implementa comunicacao via mqtt`
- `fix(estru): ajusta diametro do encaixe do motor`
- `docs(eletr): adiciona pinout do esp32 no readme`

---

## 🎫 Gestão de Issues

Utilizamos as Issues do GitHub para organizar o progresso. Ao criar uma:
1.  **Etiqueta (Label):** Aplique a label correspondente ao seu setor (Energia, Estrutura, etc.).
2.  **Milestone:** Vincule à entrega correspondente (ex: "Protótipo V1 - Quarta-feira").
3.  **Título:** Use o prefixo do setor no título, ex: `[SOFTWARE] Implementar WebSockets`.

---

## 🔗 Links Úteis
* **Relatório Técnico (Overleaf/LaTeX):** [\[Clique aqui para acessar o relatório\]](https://pt.overleaf.com/5565866792kbgpjphxfgcx#84769f)
* **Documentação Auxiliar (Google Docs):** [\[Clique aqui para acessar o docs\]](https://docs.google.com/document/d/1rcPcyDlrb-aLtko67VCIYEqcur4CE0YzXbpeuBHNm5k/edit?tab=t.0#heading=h.je5rptgvq04a)
* **Ambiente de Desenvolvimento:** VS Code + PlatformIO (Software).

---


### Dica para fluxo no terminal:

Para criar a branch seguindo esse padrão e já começar a trabalhar, você usaria:

```bash
# Se for fazer a parte de software do mapeamento
git checkout develop
git pull origin develop
git checkout -b feat/soft-mapeamento-labirinto
```
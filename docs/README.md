# Documentação de projeto

Nesta pasta ficam os documentos do projeto, como orçamento, organização da equipe e relatório.

## Como editar o relatório

Para quem está começando com Git e LaTeX, o caminho mais simples é usar o Visual Studio Code com a extensão [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).

### 1. Instale o VS Code

No Linux:

```bash
sudo snap install code --classic
```

No Windows, use o instalador do site oficial ou o PowerShell:

```powershell
winget install -e --id Microsoft.VisualStudioCode
```

### 2. Instale a extensão recomendada

No VS Code, abra a aba de extensões e instale:

- LaTeX Workshop

Se preferir usar o terminal do VS Code, o comando é:

```bash
code --install-extension James-Yu.latex-workshop
```

### 3. Instale uma distribuição LaTeX completa

Esse passo evita os erros mais comuns de compilação, como falta de `latexmk`, `pdflatex` ou `abntex2.cls`.

No Linux, use:

```bash
sudo apt update && sudo apt install texlive-full
```

No Windows, use MiKTeX ou TeX Live. Se quiser instalar via `winget`, use:

```powershell
winget install -e --id MiKTeX.MiKTeX
```

### 4. Compile o relatório

Abra o arquivo `docs/relatorio/relatorio.tex` no VS Code e use o botão de compilação da extensão LaTeX Workshop.

## Observações

> [!WARNING]
> Os arquivos `.pdf` e os arquivos intermediários gerados pela compilação do LaTeX não devem ser comitados.

Se aparecer erro de classe ausente, verifique se a distribuição LaTeX foi instalada corretamente e se o `latexmk` está disponível no PATH.

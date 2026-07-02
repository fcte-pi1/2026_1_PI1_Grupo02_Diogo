# Testes E2E (Playwright)

Suíte funcional mapeada ao **Roteiro de Testes Funcionais** do relatório (CT01–CT07).

## Mapeamento CT → teste

| CT | Caso de teste | Arquivo | Status |
|----|---------------|---------|--------|
| CT01 | Exibir tipo do labirinto | `dashboard-ct.spec.ts` | `fixme` — UI pendente |
| CT02 | Exibir trajeto do micromouse | `dashboard-ct.spec.ts` | Automatizado |
| CT03 | Exibir consumo de bateria | `dashboard-ct.spec.ts` | Automatizado |
| CT04 | Exibir velocidade média | `dashboard-ct.spec.ts` | `fixme` — campo fixo em 0 |
| CT05 | Exibir tempo de conclusão | `dashboard-ct.spec.ts` | Automatizado (cronômetro ativo) |
| CT06 | Exibir desafio cumprido | `dashboard-ct.spec.ts` | `fixme` — UI pendente |
| CT07 | Atualização em tempo real | `dashboard-ct.spec.ts` | Automatizado |

## Arquitetura

```
Playwright → Frontend (Vite) → Socket.io mock (e2e/mock-ws-server.mjs)
                                      ↑
                              POST /emit (injeta telemetry:step)
```

O mock WebSocket evita depender de MQTT, firmware ou banco de dados durante os testes E2E.

## Como executar

```bash
cd src/frontend
npm run test:e2e
```

Modo interativo:

```bash
npm run test:e2e:ui
```

Relatório HTML:

```bash
npm run test:e2e:report
```

## Pré-requisitos

Na primeira vez, instale o navegador no projeto:

```bash
npm run test:e2e:install
```

# Tests

Esta pasta concentra testes automatizados do backend.

## Estrutura
- tests/unit: testes unitarios, isolando dependencias com mocks.
- tests/integration: testes de integracao (DB, MQTT, WebSocket, etc).
- tests/helpers: utilitarios reutilizaveis para montagem de requests/responses.
- tests/mocks: mocks reutilizaveis compartilhados entre testes.

## Convenções
- Espelhe a estrutura de src dentro de tests/unit.
- Nomeie os arquivos como <modulo>.test.ts.
- Para testes unitarios, isole dependencias externas usando mocks.

## Cobertura de testes

```bash
npm run test:coverage
```

Gera o relatório em `coverage/` (HTML em `coverage/lcov-report/index.html`).

Meta minima configurada no Jest: **70%** (statements, branches, functions e lines).

Para acompanhar em modo watch:

```bash
npm run test:coverage:watch
```

Arquivos incluidos: todo `src/**/*.ts`, exceto `src/server.ts` (bootstrap) e `src/lib/prisma.ts` (cliente DB).

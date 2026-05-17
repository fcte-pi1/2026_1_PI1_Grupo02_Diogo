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

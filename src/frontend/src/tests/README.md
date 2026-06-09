# Frontend tests

## E2E (Playwright)

Testes funcionais do dashboard mapeados ao roteiro CT01–CT07 ficam em `e2e/`.
Ver `e2e/README.md` para execução e mapeamento completo.

```bash
npm run test:e2e:install   # primeira vez
npm run test:e2e
```

## Cobertura

Meta mínima configurada no Vitest: **70%** (statements, branches, functions, lines).

```bash
npm run test:coverage
```

Escopo: `src/**`, exceto `main.tsx`, tipos, `WelcomeScreen` e stubs de config.

## Structure
- tests/components: component tests (React Testing Library).
- tests/hooks: hook tests and hook utilities.
- tests/utils: pure function tests.
- tests/services: API and data layer tests.
- tests/pages: page level tests.
- tests/integration: integration tests for flows.
- tests/mocks: reusable mocks (sockets, APIs, timers).
- tests/fixtures: shared static data for tests.
- tests/helpers: shared helpers like custom render.

## Conventions
- Keep tests centralized under src/tests.
- Mirror the src modules in the test folders when possible.
- Use .test.tsx for React components and .test.ts for utils/services.
- Prefer reusable mocks in tests/mocks instead of inline mocks.

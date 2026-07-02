# Testes de integracao

Testes que exercitam varias camadas (rotas HTTP, controllers, services e repositorios).

## Como rodar

```bash
npm run test -- tests/integration
npm run test:coverage
```

Os testes de integracao usam `supertest` contra o `app` Express, com o Prisma mockado para nao depender de banco real no CI.

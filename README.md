# Leximetrics IA

Monorepo para Leximetrics IA, un "Legal Operating System" multi-tenant para estudios jurídicos chilenos.

## Estructura del Proyecto

Este monorepo utiliza **pnpm workspaces** y está organizado de la siguiente manera:

### `apps/`
- **`api`**: Backend Core en NestJS (TypeScript).
- **`web`**: Frontend en Next.js 14 App Router + NextAuth + Tailwind.

### `packages/`
- **`db`**: Paquete compartido de base de datos (Prisma, migraciones, seeds).

### `services/`
- **`ai-service`**: Microservicio en Python (FastAPI) para J.A.R.V.I.S. (OCR + LLM).

## Requisitos Previos

- Node.js >= 18
- pnpm >= 8
- Python >= 3.10 (para `services/ai-service`)
- Docker (opcional, para base de datos local)

## Comandos Básicos

### Instalación

```bash
pnpm setup
# o
pnpm install
```

### Desarrollo

```bash
pnpm dev
```
Ejecuta el script `dev` en todos los workspaces que lo tengan definido.

### Linting

```bash
pnpm lint
```

## Notas de Desarrollo

- **Multi-tenant**: La mayoría de las operaciones de base de datos requieren un `tenantId`.
- **API Proxy**: El frontend se comunica con el backend a través de un proxy en `apps/web/src/app/api/proxy`.

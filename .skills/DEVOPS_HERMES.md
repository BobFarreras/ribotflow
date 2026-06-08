# [SKILL:DEVOPS_HERMES]

## Contexto de Activación
Esta skill se despierta cuando se requiere: configuración de pipelines CI/CD, optimización de Docker, gestión de hooks de Git, monitorización con Sentry, o implementación de la metodología Hermes para generación de código autónoma.

## 📦 Ecosistema de Paquetes
- **Gestor:** `pnpm` (obligatorio, nunca npm ni yarn)
- **Workspace:** Monorepo-ready si es necesario (pnpm-workspace.yaml)
- **Lockfile:** `pnpm-lock.yaml` nunca se modifica manualmente

## 🐕 Hooks de Git (Husky + lint-staged)
- **Pre-commit:** `npx lint-staged` → eslint --fix, prettier --write, vitest run --related
- **Pre-push:** `pnpm tsc --noEmit` → verificación de tipado estricto total
- **Config:** `.lintstagedrc.json` en la raíz del proyecto

## 🚀 GitHub Actions
- **ci.yml:** PR → checkout, pnpm audit, pnpm lint, pnpm tsc, pnpm test
- **cd.yml:** Merge a main → tests, next build, docker multi-stage build (<200MB), push a GHCR con tag :latest + commit hash

## 🎯 Sentry (Observabilidad)
- **Cloud:** Sentry SaaS con DSN configurado vía env
- **Self-Hosted:** Sentry local del cliente o desactivado totalmente (privacidad de datos)
- **Regla:** Nunca enviar datos de producción self-hosted a servicios externos sin consentimiento

## 🧠 MCP Engram (Memoria de Proyecto)
- Cada decisión de arquitectura estructural se registra en la memoria de Engram
- Agentes futuros consultan Engram antes de modificar servicios críticos (Veri*factu, RAG, auth)

## 🔄 Metodología Hermes (Ciclo de Desarrollo)
1. **Especificación Declarativa:** Primero interfaces y tipos puros (SDD)
2. **Generación Aislada:** Código en archivo separado o rama aislada + mocks de DB
3. **Feedback Loop:** Tests propios 3-4 veces en sandbox antes de entregar
4. **Validación Final:** Compilación 100% + SoC respetada

## 🐋 Docker (Self-Hosted)
- **Multi-stage build:** Dependencies → Build → Runner (node:20-alpine)
- **Variables clave:** `NEXT_PUBLIC_APP_MODE=self_hosted`, `DATABASE_URL`, `REDIS_URL` (opcional)
- **Puertos:** 3000 (app), 5432 (postgres), 6379 (redis, opcional)
- **Volúmenes:** `./data/postgres`, `./data/redis` (si se usa)

## ⚡ Async Jobs (BullMQ/Redis vs Postgres)
- **Cloud:** BullMQ + Redis para tareas asíncronas (emails, reports, sincronizaciones)
- **Self-Hosted:** pg-boss (basado en Postgres) como alternativa sin Redis, o modo síncron simplificado
- **Abstracción:** `/src/services/jobs/` con interfaz común `JobQueue` que implementa `RedisQueue` o `PostgresQueue`

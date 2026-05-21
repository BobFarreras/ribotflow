# [SKILL:DEVOPS_HERMES]

## Context d'Activació
Aquesta skill es desperta quan es requereix: configuració de pipelines CI/CD, optimització de Docker, gestió de hooks de Git, monitorització amb Sentry, o implementació de la metodologia Hermes per a generació de codi autònoma.

## 📦 Ecosistema de Paquetes
- **Gestor:** `pnpm` (obligatori, mai npm ni yarn)
- **Workspace:** Monorepo-ready si cal (pnpm-workspace.yaml)
- **Lockfile:** `pnpm-lock.yaml` mai es modifica manualment

## 🐕 Hooks de Git (Husky + lint-staged)
- **Pre-commit:** `npx lint-staged` → eslint --fix, prettier --write, vitest run --related
- **Pre-push:** `pnpm tsc --noEmit` → verificació de tipat estricte total
- **Config:** `.lintstagedrc.json` a l'arrel del projecte

## 🚀 GitHub Actions
- **ci.yml:** PR → checkout, pnpm audit, pnpm lint, pnpm tsc, pnpm test
- **cd.yml:** Merge a main → tests, next build, docker multi-stage build (<200MB), push a GHCR amb tag :latest + commit hash

## 🎯 Sentry (Observabilitat)
- **Cloud:** Sentry SaaS amb DSN configurat via env
- **Self-Hosted:** Sentry local del client o desactivat totalment (privacitat de dades)
- **Regla:** Mai enviar dades de producció self-hosted a serveis externs sense consentiment

## 🧠 MCP Engram (Memòria de Projecte)
- Cada decisió d'arquitectura estructural es registra a la memòria d'Engram
- Agents futurs consulten Engram abans de modificar serveis crítics (Veri*factu, RAG, auth)

## 🔄 Metodologia Hermes (Cicle de Desenvolupament)
1. **Especificació Declarativa:** Primer interfícies i tipus purs (SDD)
2. **Generació Aïllada:** Codi en fitxer separat o branca aïllada + mocks de DB
3. **Feedback Loop:** Tests propis 3-4 vegades en sandbox abans de lliurar
4. **Validació Final:** Compilació 100% + SoC respectada

## 🐋 Docker (Self-Hosted)
- **Multi-stage build:** Dependencies → Build → Runner (node:20-alpine)
- **Variables clau:** `NEXT_PUBLIC_APP_MODE=self_hosted`, `DATABASE_URL`, `REDIS_URL` (opcional)
- **Ports:** 3000 (app), 5432 (postgres), 6379 (redis, opcional)
- **Volums:** `./data/postgres`, `./data/redis` (si s'usa)

## ⚡ Async Jobs (BullMQ/Redis vs Postgres)
- **Cloud:** BullMQ + Redis per a tasques asíncrones (emails, reports, sincronitzacions)
- **Self-Hosted:** pg-boss (Postgres-based) com alternativa sense Redis, o mode síncron simplificat
- **Abstracció:** `/src/services/jobs/` amb interfície comuna `JobQueue` que implementa `RedisQueue` o `PostgresQueue`

# RIBOTFLOW

> Sistema operativo empresarial proactivo — ERP, SAT, CRM y Control de Acceso.
> Diseñado para 2026. SaaS Cloud + Self-Hosted vía Docker.

## 🚀 Inicio Rápido

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## 📦 Tecnologías

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, proxy.ts) |
| Base de Datos | PostgreSQL 16+ / Drizzle ORM |
| Autenticación | Auth.js v5 (JWT) |
| Estilos | Tailwind CSS 4 + Radix UI |
| Testing | Vitest |
| CI/CD | GitHub Actions |
| Docker | Multi-stage build <200MB |
| Memoria IA | Engram MCP |

## 🏗️ Arquitectura

Clean Architecture con Separación de Responsabilidades (SoC):

```
src/
├── proxy.ts              → Seguridad + RBAC (Next.js 16)
├── app/                  → Rutas visuales (App Router)
├── actions/              → Server Actions (controladores)
├── services/             → Lógica de negocio (framework-agnostic)
├── db/                   → Esquemas Drizzle + migraciones
├── components/           → Componentes React
├── hooks/                → React Hooks personalizados
├── lib/                  → Utilidades y configuración
├── types/                → Definiciones TypeScript
├── locales/              → Traducciones (ca/es)
└── config/               → Configuración de la aplicación
```

## 🌍 Modos de Ejecución

| Modo | Descripción |
|------|-------------|
| `cloud` | SaaS multi-tenant (todas las empresas comparten DB) |
| `self_hosted` | Docker single-tenant (1 empresa por instancia) |

Mismo código, diferente contexto. El filtro `company_id` funciona en ambos modos.

## 📋 Documentación

| Archivo | Contenido |
|---------|-----------|
| `AGENTS.md` | Reglas de arquitectura y desarrollo |
| `PROJECT.md` | Blueprint de módulos y hoja de ruta |
| `INFRASTRUCTURE.md` | Matriu de comportamiento por modo |
| `TOOLING_AND_WORKFLOW.md` | Ecosistema de calidad, CI/CD, Hermes |
| `AUTH.md` | Autenticación, multi-tenancy y RBAC |
| `ARCHITECTURE.md` | Plànols completos de la estructura |
| `.skills/` | Contexto rápido para agentes IA |

## 🌐 Idiomas

- **Código:** Inglés (variables, funciones, comentarios, archivos)
- **UI del usuario:** Catalán / Castellano (vía i18n)
- **Documentación del equipo:** Castellano

## 📄 Licencia

MIT

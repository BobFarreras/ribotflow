# Contribuir a RIBOTFLOW

Gracias por tu interés en contribuir. Este proyecto sigue la metodología **Hermes** + **SDD** (Specification-Driven Development).

## 🚀 Inicio Rápido

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## 📋 Convenciones

| Elemento | Regla |
|----------|-------|
| Idioma del código | Inglés (variables, funciones, comentarios) |
| Idioma de la UI | Catalán / Castellano (vía i18n) |
| Idioma de la docs | Castellano |
| Commits | Inglés (Conventional Commits) |
| Gestor de paquetes | pnpm (obligatorio) |
| Tipado | TypeScript estricto (`strict: true`) |

## 🏗️ Arquitectura

Clean Architecture con Separación de Responsabilidades:

```
src/
├── proxy.ts          → Seguridad + RBAC (Next.js 16)
├── app/              → Rutas visuales
├── actions/          → Server Actions (controladores)
├── services/         → Lógica de negocio (framework-agnostic)
├── db/               → Esquemas Drizzle + migraciones
├── components/       → Componentes React
├── hooks/            → Hooks personalizados
├── lib/              → Utilidades
├── types/            → Tipos TypeScript
└── locales/          → Traducciones (ca/es)
```

## 🧠 Memoria (Engram MCP)

Cada agente debe guardar memoria de:
- Decisiones de arquitectura
- Errores y soluciones
- Nuevas features
- Cambios de convención

Consulta `AGENTS.md` para el formato exacto.

## 🧪 Testing

```bash
pnpm test              # Ejecutar todos los tests
pnpm test:watch        # Modo watch
pnpm test:coverage     # Con reporte de cobertura
```

Cobertura mínima: **80%** para servicios y acciones.

## 🔀 Flujo de Git

```
main          → Producción (estable)
develop       → Integración
features/*    → Nuevas funcionalidades
release/*     → Preparación de versión
hotfix/*      → Correcciones urgentes
```

### Proceso

1. Crea una rama desde `develop`: `git checkout -b features/nombre-feature`
2. Trabaja y haz commits pequeños
3. Mergea a `develop` con PR
4. El maintainer revisa y aprueba

## 📝 Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add invoice generation
fix: resolve company_id filter bug
docs: update architecture diagram
refactor: extract invoice service
test: add invoice service unit tests
chore: update dependencies
```

## 🔒 Seguridad

- Nunca commitear `.env` ni secretos
- Nunca exponer stack traces en producción
- Todas las consultas DB deben filtrar por `company_id`
- Cookies: `httpOnly`, `secure`, `sameSite: "lax"`

## 🐛 Reportar Bugs

Usa los templates de GitHub Issues:
- [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)

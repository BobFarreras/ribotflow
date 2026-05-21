# AGENTS.md - Reglas de Arquitectura y Desarrollo para RIBOTFLOW

## 🌐 Convención de Idioma

| Elemento | Idioma | Ejemplo |
|----------|--------|---------|
| **Código** (variables, funciones, tipos, archivos) | 🇬🇧 Inglés | `getUserById`, `InvoiceStatus`, `billing-service.ts` |
| **Comments** (cabeceras, JSDoc, inline) | 🇬🇧 Inglés | `// Fetches user by ID with company filter` |
| **UI** (texto visible para el usuario) | 🇨🇦 Catalán / 🇪🇸 Castellano | vía `i18n` keys: `t("billing.invoice.title")` |
| **DB** (tablas, columnas) | 🇬🇧 Inglés | `work_orders`, `company_id`, `created_at` |
| **API** (rutas, endpoints, responses) | 🇬🇧 Inglés | `/api/billing/invoices`, `{ "invoiceId": "..." }` |
| **Docs equipo** (AGENTS.md, PROJECT.md, .skills/) | 🇪🇸 Castellano | Documentación interna del equipo |
| **Commits** (mensajes git) | 🇬🇧 Inglés | `feat: add invoice generation` |
| **i18n keys** | 🇬🇧 Inglés | `sat.workOrder.create.success` |

### Regla de Oro
> **Todo el código en inglés.** El usuario final ve catalán o castellano mediante el sistema `i18n`. La documentación del equipo se mantiene en castellano.

### Implementación i18n
- Archivos JSON en `/src/locales/{ca,es}/`
- Nunca texto hardcoded en componentes → siempre claves de traducción
- Tablas DB: estados y categorías con claves, nunca texto rígido
- Server Components: `getTranslations()` para i18n en servidor
- Client Components: `useTranslations()` hook para i18n en cliente

## 🤖 Reglas Globales para Agentes IA
- **Idioma de comunicación:** Castellano (preferente) / Catalán / Inglés (código)
- **Gestor de paquetes:** `pnpm` (obligatorio, nunca npm ni yarn)
- **Tipado:** TypeScript estricto (`strict: true` en tsconfig)
- **Metodología:** SDD (Specification-Driven Development) + SOLID
- **Arquitectura:** Clean Architecture con Separación de Responsabilidades (SoC)
- **Memoria:** Engram MCP persistente — los agentes guardan decisiones en `~/.engram/`

## 🏗️ Principios Arquitectónicos
1. **SoC (Separation of Concerns):** Cada capa tiene una responsabilidad única
2. **Dependency Inversion:** Las capas internas no dependen de las externas
3. **Interface Segregation:** Interfaces pequeñas y específicas
4. **Multi-tenancy:** `company_id` en TODAS las consultas de negocio
5. **i18n:** Nunca texto hardcoded, siempre claves de traducción

## 🤖 SKILLS DISPONIBLES
- `[SKILL:DEVOPS_HERMES]`: Aplica conocimientos de pipelines de GitHub Actions, optimización de hooks de Husky, monitorización asíncrona con Sentry, persistencia de contexto mediante MCP Engram y ciclos de generación y validación autónoma de código bajo la metodología Hermes.
- `[SKILL:DB_ARCHITECT]`: Domina Drizzle ORM, PostgreSQL, diseño de esquemas multi-tenant con `company_id`, migraciones, índices y optimización de consultas.
- `[SKILL:UI_UX]`: Especialista en Next.js App Router, Tailwind CSS, Radix UI, diseño Mobile-First, PWA offline, accesibilidad WCAG 2.1 AA e i18n (ca/es).
- `[SKILL:AUTH_GUARD]`: Aplica control de acceso basado en roles (RBAC estrictos: OWNER, ADMIN, TECHNICIAN, OFFICE) a través de Auth.js. Domina la arquitectura de Multi-tenancy lógico mediante el filtrado obligatorio por `company_id` en Server Actions y rutas de API para el entorno Cloud, y el mapeo asíncrono de un único inquilino en entornos Self-Hosted. Garantizar la inmutabilidad de la sesión en el JWT.

## 📐 Estructura de Cabeceras Obligatorias
Todos los archivos `.ts` y `.tsx` deben comenzar con:
```typescript
/**
 * Creation/modification date: DD/MM/YYYY
 * Path: src/path/to/file.ts
 * Description: Brief description of the file's responsibility.
 */
```

## 🧪 Testing
- **Framework:** Vitest
- **Cobertura mínima:** 80% para servicios y acciones
- **Mocks:** Factories en `/tests/factories/`
- **Pre-push:** `pnpm tsc --noEmit` obliga a compilación sin errores

## 🔒 Seguridad
- **Cookies:** `httpOnly`, `secure`, `sameSite: "lax"`
- **Sessions:** JWT firmado, nunca modificable desde el cliente
- **DB:** Nunca consultas sin `company_id` en entorno Cloud
- **Errors:** Nunca exponer stack traces en producción

## 📦 Ecosistema
- **Next.js:** 16+ (App Router, Server Components por defecto)
- **Database:** PostgreSQL 16+ vía Drizzle ORM
- **Auth:** Auth.js v5
- **Queue:** BullMQ/Redis (Cloud) o pg-boss (Self-Hosted)
- **Monitoring:** Sentry (configurable por modo)
- **CI/CD:** GitHub Actions (ci.yml + cd.yml)
- **Docker:** Multi-stage build <200MB

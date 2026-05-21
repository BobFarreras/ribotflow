# AGENTS.md - Regles d'Arquitectura i Desenvolupament per a RIBOTFLOW

## 🤖 Regles Globals per a Agents IA
- **Idioma de comunicació:** Català (preferent) / Castellà / Anglès (codi)
- **Gestor de paquets:** `pnpm` (obligatori, mai npm ni yarn)
- **Tipat:** TypeScript estricte (`strict: true` al tsconfig)
- **Metodologia:** SDD (Specification-Driven Development) + SOLID
- **Arquitectura:** Clean Architecture amb Separació de Responsabilitats (SoC)

## 🏗️ Principis Arquitectònics
1. **SoC (Separation of Concerns):** Cada capa té una responsabilitat única
2. **Dependency Inversion:** Les capes internes no depenen de les externes
3. **Interface Segregation:** Interfícies petites i específiques
4. **Multi-tenancy:** `company_id` a TOTES les consultes de negoci
5. **i18n:** Mai text hardcoded, sempre claus de traducció

## 🤖 SKILLS DISPONIBLES
- `[SKILL:DEVOPS_HERMES]`: Aplica coneixements de pipelines de GitHub Actions, optimització de hooks de Husky, monitorització asíncrona amb Sentry, persistència de context mitjançant MCP Engram i cicles de generació i validació autònoma de codi sota la metodologia Hermes.
- `[SKILL:DB_ARCHITECT]`: Domina Drizzle ORM, PostgreSQL, disseny d'esquemes multi-tenant amb `company_id`, migracions, índexs i optimització de consultes.
- `[SKILL:UI_UX]`: Especialista en Next.js App Router, Tailwind CSS, Radix UI, disseny Mobile-First, PWA offline, accessibilitat WCAG 2.1 AA i i18n (ca/es).
- `[SKILL:AUTH_GUARD]`: Aplica control d'accés basat en rols (RBAC estrictes: OWNER, ADMIN, TECHNICIAN, OFFICE) a través d'Auth.js. Domina l'arquitectura de Multi-tenancy lògic mitjançant el filtrat obligatori per `company_id` en Server Actions i rutes d'API per a l'entorn Cloud, i el mapeig asíncron d'un inquilí únic en entorns Self-Hosted. Garantir la immutabilitat de la sessió en el JWT.

## 📐 Estructura de Capçaleres Obligatòries
Tots els fitxers `.ts` i `.tsx` han de començar amb:
```typescript
/**
 * Data de creació/modificació: DD/MM/YYYY
 * Ruta: src/path/to/file.ts
 * Descripció: Breu descripció de la responsabilitat del fitxer.
 */
```

## 🧪 Testing
- **Framework:** Vitest
- **Cobertura mínima:** 80% per a serveis i accions
- **Mocks:** Factories a `/tests/factories/`
- **Pre-push:** `pnpm tsc --noEmit` obliga a compilació sense errors

## 🔒 Seguretat
- **Cookies:** `httpOnly`, `secure`, `sameSite: "lax"`
- **Sessions:** JWT signat, mai modificable des del client
- **DB:** Mai consultes sense `company_id` en entorn Cloud
- **Errors:** Mai exposar stack traces en producció

## 📦 Ecosistema
- **Next.js:** 16+ (App Router, Server Components per defecte)
- **Database:** PostgreSQL 16+ via Drizzle ORM
- **Auth:** Auth.js v5
- **Queue:** BullMQ/Redis (Cloud) o pg-boss (Self-Hosted)
- **Monitoring:** Sentry (configurable per mode)
- **CI/CD:** GitHub Actions (ci.yml + cd.yml)
- **Docker:** Multi-stage build <200MB

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

## 🧠 Memoria Engram — Cuándo Guardar

Los agentes deben guardar memoria en Engram de forma **proactiva y granular**. No esperar al final de la sesión.

### ✅ GUARDAR SIEMPRE (auto-save obligatorio)

| Evento | Tipo Engram | Ejemplo |
|--------|-------------|---------|
| **Decisión de arquitectura** | `architecture` | "Usar proxy.ts en vez de middleware.ts (Next.js 16)" |
| **Decisión de diseño DB** | `decision` | "company_id indexado en todas las tablas de negocio" |
| **Error encontrado + solución** | `bugfix` | "Drizzle pool timeout en producción → aumentar idleTimeoutMillis" |
| **Nueva feature implementada** | `feature` | "Server Action createWorkOrder con validación Zod + filtro company_id" |
| **Cambio de convención** | `convention` | "Todos los comentarios en inglés, docs del equipo en castellano" |
| **Patrón reutilizable descubierto** | `pattern` | "Template de Server Action con auth + role check + company filter" |
| **Dependencia añadida/eliminada** | `dependency` | "Añadido bcryptjs para hash de passwords" |
| **Variable de entorno nueva** | `config` | "NEXT_PUBLIC_APP_MODE determina comportamiento cloud/self-hosted" |

### ❌ NO GUARDAR (ruido innecesario)

- Cambios de formato (prettier, orden de imports)
- Renombrar variables siguiendo convención existente
- Commits rutinarios sin impacto arquitectónico
- Texto de documentación sin decisiones asociadas

### 📝 Formato de Guardado

```typescript
engram save "<título conciso>" "<descripción: qué, por qué, dónde>" --type <tipo> --project ribotflow
```

### 🔄 Flujo de Sesión

```
[ Agente trabaja ] → [ Decisión/Error/Feature ] → [ mem_save inmediato ]
                                                      ↓
[ Sigue trabajando ] → [ Otra decisión ] → [ mem_save inmediato ]
                                                      ↓
[ Fin de tarea ] → [ mem_session_summary resumen global ]
```

> **Regla:** Si otro agente futuro necesitaría saber esto para no repetir el mismo error o tomar la misma decisión → **GUARDAR**.

## 🤖 SKILLS DISPONIBLES
- `[SKILL:DEVOPS_HERMES]`: Aplica conocimientos de pipelines de GitHub Actions, optimización de hooks de Husky, monitorización asíncrona con Sentry, persistencia de contexto mediante MCP Engram y ciclos de generación y validación autónoma de código bajo la metodología Hermes.
- `[SKILL:DB_ARCHITECT]`: Domina Drizzle ORM, PostgreSQL, diseño de esquemas multi-tenant con `company_id`, migraciones, índices y optimización de consultas.
- `[SKILL:UI_UX]`: Especialista en Next.js App Router, Tailwind CSS, Radix UI, diseño Mobile-First, PWA offline, accesibilidad WCAG 2.1 AA e i18n (ca/es).
- `[SKILL:AUTH_GUARD]`: Aplica control de acceso basado en roles (RBAC estrictos: OWNER, ADMIN, TECHNICIAN, OFFICE) a través de Auth.js. Domina la arquitectura de Multi-tenancy lógico mediante el filtrado obligatorio por `company_id` en Server Actions y rutas de API para el entorno Cloud, y el mapeo asíncrono de un único inquilino en entornos Self-Hosted. Garantizar la inmutabilidad de la sesión en el JWT.
- `[SKILL:FRONTEND_DEV]`: Especialista en React 19, Server Components, Client Components, hooks personalizados, gestión de estado, formularios con React Hook Form + Zod, y patrones de composición de componentes.
- `[SKILL:BACKEND_DEV]`: Domina Server Actions como controladores, rutas de API, capa de servicios framework-agnostic, colas asíncronas (BullMQ/pg-boss), y patrones de Clean Architecture.
- `[SKILL:SECURITY]`: Experto en protección de rutas vía proxy.ts, validación de inputs con Zod, sanitización de datos, headers de seguridad, cookies seguras, y prevención de OWASP Top 10.
- `[SKILL:ENGRAM_MCP]`: Gestiona la memoria persistente del proyecto. Sabe cuándo guardar (decisiones, errores, features), cómo estructurar memorias, y cómo recuperar contexto relevante sin consumir tokens de sesión.
- `[SKILL:TESTING]`: Especialista en Vitest, factories de datos, mocks de servicios, tests de integración con DB, tests E2E, y cobertura mínima del 80% para servicios y acciones.

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

## 🗄️ Migraciones de Base de Datos (Drizzle ORM)
- **Nunca usar `db:push` en equipo:** Puede borrar datos. Solo para contenedores nuevos o CI.
- **Flujo correcto:**
  1. Modificar `src/db/schema/*.ts`
  2. `pnpm db:generate` → crea migración versionada en `src/db/migrations/`
  3. Hacer `git commit` del archivo SQL generado
  4. Compañeros: `git pull && pnpm db:migrate`
- **Setup diario:** `pnpm db:setup` (hace `db:up` + `db:migrate`)
- **Reset completo (pierde datos):** `pnpm db:reset` + `pnpm db:setup:fresh`
- **Sincronización entre máquinas (CRÍTICO):**
  - Si un agente ha trabajado en otra máquina y modificado el schema, al volver a esta máquina y hacer `git pull`, las migraciones nuevas deben aplicarse con `pnpm db:migrate`.
  - Si la BD local fue creada con `db:push` o seed scripts (sin pasar por `db:migrate`), la tabla `drizzle.__drizzle_migrations` puede estar vacía o incompleta.
  - **Síntoma:** `pnpm db:migrate` falla con `relation already exists` porque intenta reaplicar migraciones antiguas.
  - **Solución:** Seguir el **Protocol de Sincronització de Màquina** documentado en `docs/AGENT_CONTEXT.md` (reconstruir `__drizzle_migrations` y luego `db:migrate`).
  - **Prevención:** Documentar en memoria (Engram) si una máquina específica tiene la BD desfasada para que el siguiente agente lo sepa inmediatamente.

## 🏗️ Regla de Arquitectura: Separación de Responsabilidades (SoC)

### Límite de líneas por archivo
**Ningún archivo de servicio (.ts) debe exceder las 300 líneas de código.**
Si un servicio supera este límite, DEBE dividirse siguiendo esta estructura obligatoria.

### Estructura obligatoria para servicios complejos (ej: generación de PDFs)
```
src/services/<dominio>/
  ├── index.ts                 # Service orchestrator (inyección de deps, orquestación)
  ├── builder/
  │   ├── BaseBuilder.ts       # Primitivas de dibujo (drawText, drawRect, measureWidth)
  │   └── <Entity>Builder.ts   # Layout específico por entidad (QuoteBuilder, WorkOrderBuilder)
  ├── layout/
  │   └── components/          # Un componente visual = un archivo (máx 150 líneas)
  │       ├── Header.ts
  │       ├── InfoSection.ts
  │       ├── ItemsTable.ts
  │       └── ...
  ├── constants.ts             # Colores, tamaños, márgenes (puro data)
  ├── labels.ts                # Traducciones i18n (puro data)
  ├── types.ts                 # Interfaces y types
  └── utils/
      ├── sanitize.ts          # Helpers puros (sin side effects)
      ├── format.ts            # Formateo de fechas, monedas
      └── helpers.ts           # Funciones utilitarias genéricas
```

### Principios SOLID aplicados
1. **Single Responsibility**: Cada archivo hace UNA sola cosa. `ItemsTable.ts` solo dibuja la tabla. `sanitize.ts` solo sanitiza texto.
2. **Open/Closed**: Los componentes de layout se pueden extender (herencia/composición) sin modificar el código existente.
3. **Liskov Substitution**: Los builders específicos heredan del base y respetan su interfaz.
4. **Interface Segregation**: Un componente NO debe depender de datos que no necesita (ej: `ItemsTable` solo recibe `items[]`, no el `quote` completo).
5. **Dependency Inversion**: El `PdfService` depende de abstracciones (`BaseBuilder`), no de implementaciones concretas.

### Reglas de oro
- **Cada componente de layout = máximo 150 líneas.** Si es más largo, subdividirlo.
- **NUNCA** duplicar lógica de dibujo entre builders. Si dos builders usan el mismo componente, extraerlo a `layout/components/`.
- Los componentes reciben **datos primitivos** (strings, numbers) y NO dependen de schemas de Drizzle.
- Tests unitarios obligatorios para cada componente de layout (cobertura mínima 80%).
- Los `constants.ts` y `labels.ts` son puro data, sin lógica. Si crecen >200 líneas, dividir por idioma o dominio.

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

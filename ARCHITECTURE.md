# 🏗️ RIBOTFLOW - Arquitectura Clean Architecture (Next.js 16+)

> **Fecha de creación:** 21/05/2026
> **Estado:** Planos iniciales completados
> **Metodología:** Hermes + SDD + SOLID

---

## 📁 Mapa Completo de Estructura de Directorios

```
RIBOTFLOW-MVP/
├── .skills/                          # 🧠 Contexto para agentes IA
│   ├── DEVOPS_HERMES.md              #   CI/CD, Docker, Sentry, Husky
│   ├── DB_ARCHITECT.md               #   Drizzle ORM, PostgreSQL, Multi-tenancy
│   ├── UI_UX.md                      #   Next.js UI, Tailwind, Radix, i18n
│   └── AUTH_GUARD.md                 #   Auth.js, RBAC, Sesiones, JWT
│
├── .github/workflows/                # 🚀 GitHub Actions Pipelines
│   ├── ci.yml                        #   Validación de calidad (PR)
│   └── cd.yml                        #   Despliegue + Docker build (main)
│
├── docker/                           # 🐋 Configuración Docker
│   ├── postgres/                     #   Scripts de inicialización DB
│   └── redis/                        #   Configuración Redis (Cloud)
│
├── public/                           # 📦 Assets estáticos
│   ├── fonts/                        #   Tipografías
│   └── icons/                        #   Iconos PWA
│
├── tests/                            # 🧪 Suite de Testing (Vitest)
│   ├── unit/                         #   Tests unitarios
│   ├── integration/                  #   Tests de integración
│   ├── e2e/                          #   Tests end-to-end
│   ├── mocks/                        #   Mocks de servicios externos
│   └── factories/                    #   Factories de datos de test
│
├── src/
│   ├── proxy.ts                      # 🛡️ Proxy de seguridad + RBAC (Next.js 16)
│   ├── instrumentation.ts            # 🎯 Sentry (condicional por modo)
│   │
│   ├── app/                          # 🌐 Rutas visuales (Next.js App Router)
│   │   ├── layout.tsx                #   Layout raíz (idioma, metadatos)
│   │   ├── page.tsx                  #   Redirección inicial
│   │   │
│   │   ├── (auth)/                   #   Route group: Autenticación
│   │   │   ├── login/                #     /login
│   │   │   ├── register/             #     /register
│   │   │   └── setup/                #     /setup (Self-Hosted wizard)
│   │   │
│   │   ├── (dashboard)/              #   Route group: App principal
│   │   │   └── dashboard/
│   │   │       ├── sat/              #     Módulo SAT (órdenes de trabajo)
│   │   │       ├── erp/              #     Módulo ERP (stocks, productos)
│   │   │       ├── billing/          #     Módulo Facturación + Veri*factu
│   │   │       ├── crm/              #     Módulo CRM (clientes, ventas)
│   │   │       ├── access/           #     Módulo Control de Acceso (fichaje)
│   │   │       ├── settings/         #     Configuración de empresa
│   │   │       └── unauthorized/     #     Página de acceso denegado
│   │   │
│   │   └── api/                      # 🔌 Rutas de API
│   │       ├── auth/[...nextauth]/   #   Handler Auth.js
│   │       ├── health/               #   Health check endpoint
│   │       └── webhooks/verifactu/   #   Webhook AEAT Veri*factu
│   │
│   ├── actions/                      # ⚡ Server Actions (Controladores)
│   │   ├── sat/                      #   Acciones del módulo SAT
│   │   ├── erp/                      #   Acciones del módulo ERP
│   │   ├── billing/                  #   Acciones de facturación
│   │   ├── crm/                      #   Acciones del CRM
│   │   ├── access/                   #   Acciones de control de acceso
│   │   └── settings/                 #   Acciones de configuración
│   │
│   ├── services/                     # 💼 Capa de Negocio (Framework-agnostic)
│   │   ├── sat/                      #   Lógica de negocio SAT
│   │   ├── erp/                      #   Lógica de negocio ERP
│   │   ├── billing/                  #   Lógica de facturación + Veri*factu
│   │   ├── crm/                      #   Lógica de negocio CRM
│   │   ├── access/                   #   Lógica de control de acceso
│   │   ├── jobs/                     #   🔄 Cola asíncrona (Redis/Postgres)
│   │   ├── integrations/             #   Integraciones (Google, SMTP)
│   │   └── i18n/                     #   Servicio de traducciones
│   │
│   ├── db/                           # 🗄️ Capa de Datos (Drizzle ORM)
│   │   ├── index.ts                  #   Instancia de conexión DB
│   │   ├── schema/                   #   Esquemas de tablas
│   │   │   └── auth.ts               #     companies, users, accounts, sessions
│   │   ├── migrations/               #   Migraciones generadas
│   │   ├── queries/                  #   Consultas reutilizables
│   │   └── seeds/                    #   Seeds de datos iniciales
│   │
│   ├── components/                   # 🎨 Componentes React
│   │   ├── ui/                       #   Componentes atómicos (Button, Input...)
│   │   ├── layout/                   #   Estructuras (Header, Sidebar, Shell)
│   │   ├── modules/                  #   Componentes por módulo
│   │   │   ├── sat/                  #     Componentes SAT
│   │   │   ├── erp/                  #     Componentes ERP
│   │   │   ├── billing/              #     Componentes Facturación
│   │   │   ├── crm/                  #     Componentes CRM
│   │   │   └── access/               #     Componentes Control de Acceso
│   │   ├── forms/                    #   Formularios con validación Zod
│   │   ├── charts/                   #   Visualizaciones de datos
│   │   ├── pwa/                      #   Componentes PWA (offline, sync)
│   │   └── auth/                     #   Componentes de autenticación
│   │
│   ├── hooks/                        # 🪝 React Hooks personalizados
│   │   ├── sat/                      #   Hooks del módulo SAT
│   │   ├── erp/                      #   Hooks del módulo ERP
│   │   ├── billing/                  #   Hooks de facturación
│   │   ├── crm/                      #   Hooks del CRM
│   │   └── access/                   #   Hooks de control de acceso
│   │
│   ├── lib/                          # 📚 Utilidades y configuración
│   │   ├── auth/                     #   Configuración Auth.js v5
│   │   ├── utils/                    #   Funciones auxiliares (crypto, format...)
│   │   ├── validators/               #   Esquemas Zod para validación
│   │   ├── constants/                #   Constantes globales (rutas, roles...)
│   │   ├── errors/                   #   Clases de error personalizadas
│   │   └── logger/                   #   Logger estructurado
│   │
│   ├── config/                       # ⚙️ Configuración de la aplicación
│   │
│   ├── types/                        # 📝 Definiciones de tipos TypeScript
│   │   ├── index.ts                  #   Tipos globales (Role, Plan, User...)
│   │   ├── sat/                      #   Tipos del módulo SAT
│   │   ├── erp/                      #   Tipos del módulo ERP
│   │   ├── billing/                  #   Tipos de facturación
│   │   ├── crm/                      #   Tipos del CRM
│   │   └── access/                   #   Tipos de control de acceso
│   │
│   ├── locales/                      # 🌐 Traducciones (i18n)
│   │   ├── ca/                       #   Catalán
│   │   └── es/                       #   Castellano
│   │
│   └── styles/                       # 🎨 Estilos globales
│       └── globals.css               #   Tailwind + variables CSS
│
├── .env.example                      # 🔑 Plantilla de variables de entorno
├── AGENTS.md                         # 🤖 Reglas para agentes IA
├── AUTH.md                           # 🔐 Documentación de autenticación
├── INFRASTRUCTURE.md                 # 🏗️ Matriz de comportamiento por modo
├── PROJECT.md                        # 📋 Hoja de ruta de módulos
├── TOOLING_AND_WORKFLOW.md           # 🔧 Ecosistema de calidad
├── ARCHITECTURE.md                   # 📐 Este documento
├── package.json                      # 📦 Dependencias (pnpm)
├── tsconfig.json                     # ⚙️ Configuración TypeScript (strict)
├── next.config.ts                    # ⚙️ Configuración Next.js (standalone)
├── docker-compose.yml                # 🐋 Docker Compose (Self-Hosted)
└── Dockerfile                        # 🐋 Multi-stage build (<200MB)
```

---

## 📦 Explicación de Capas Clave

### 🛡️ `src/proxy.ts` - Proxy de Seguridad y RBAC (Next.js 16)
| Responsabilidad | Detalle |
|-----------------|---------|
| Intercepta rutas | Todas excepto `/login`, `/register`, `/setup`, `/api/health` |
| Verifica sesión | JWT vía Auth.js → valida `companyId` + `role` |
| Filtra por rol | `TECHNICIAN` → solo `/dashboard/sat` + `/dashboard/access` |
| Inyecta headers | `x-user-role` + `x-company-id` para rutas descendientes |
| Redirige | A `/login` si no autenticado, `/unauthorized` si sin permiso |

> **Nota:** Next.js 16 ha deprecado `middleware.ts` y lo ha renombrado a `proxy.ts`. La función exportada también cambia de `middleware()` a `proxy()`.

### ⚡ `src/actions/` - Server Actions (Controladores)
| Principio | Aplicación |
|-----------|------------|
| SoC | Cada módulo tiene su directorio de acciones |
| Multi-tenancy | Todas las acciones filtran por `session.user.companyId` |
| Validación | Inputs validados con Zod antes de llamar a servicios |
| Errores | Errores personalizados (`UnauthorizedError`, `ValidationError`) |

### 💼 `src/services/` - Capa de Negocio
| Característica | Detalle |
|----------------|---------|
| Framework-agnostic | No depende de Next.js ni React |
| Testable | Fácil de mockear para tests unitarios |
| Reutilizable | Llamada desde Server Actions, API routes, o jobs |
| Async jobs | Interfaz `JobQueue` abstracta (Redis/Postgres) |

### 🗄️ `src/db/` - Capa de Datos
| Componente | Función |
|------------|---------|
| `schema/` | Definición de tablas Drizzle ORM con `company_id` |
| `migrations/` | Migraciones versionadas generadas por `drizzle-kit` |
| `queries/` | Consultas reutilizables con filtro multi-tenant |
| `index.ts` | Instancia única de conexión con pooling |

---

## 🔀 Flujo de Datos (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Components  │→ │   Hooks      │→ │   Server Actions │   │
│  │ (UI/UX)     │  │ (state, api) │  │   (controllers)  │   │
│  └─────────────┘  └──────────────┘  └────────┬─────────┘   │
└───────────────────────────────────────────────┼─────────────┘
                                                │
┌───────────────────────────────────────────────▼─────────────┐
│                    SERVIDOR (Next.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Services   │← │  Validators  │← │   Server Actions │   │
│  │  (negocio)  │→ │   (Zod)      │  │   (entrada)      │   │
│  └──────┬──────┘  └──────────────┘  └──────────────────┘   │
│         │                                                   │
│  ┌──────▼──────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   DB        │← │  Queries     │← │   Services       │   │
│  │  (Drizzle)  │  │ (reutiliz.)  │  │ (lógica negocio) │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏢 Multi-Tenancy: Cloud vs Self-Hosted

### Cloud (SaaS Multi-tenant)
```
┌──────────────────────────────────────────────┐
│           PostgreSQL Central                 │
│  ┌──────────────────────────────────────┐    │
│  │ companies                            │    │
│  │ ├── id: uuid                         │    │
│  │ ├── name: "Fusteria Marcel"          │    │
│  │ └── tenant_slug: "fusteria-marcel"   │    │
│  ├──────────────────────────────────────┤    │
│  │ companies                            │    │
│  │ ├── id: uuid                         │    │
│  │ ├── name: "Técnicos Girona"          │    │
│  │ └── tenant_slug: "tecnicos-girona"   │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ users (todos con company_id)         │    │
│  │ ├── user1 → company_id: fusteria     │    │
│  │ ├── user2 → company_id: fusteria     │    │
│  │ ├── user3 → company_id: tecnicos     │    │
│  │ └── user4 → company_id: tecnicos     │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ work_orders (todas con company_id)   │    │
│  │ ├── wo1 → company_id: fusteria       │    │
│  │ ├── wo2 → company_id: tecnicos       │    │
│  │ └── ...                              │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### Self-Hosted (Docker Single-tenant)
```
┌──────────────────────────────────────────────┐
│        PostgreSQL Dedicado (VPS Cliente)     │
│  ┌──────────────────────────────────────┐    │
│  │ companies                            │    │
│  │ ├── id: uuid                         │    │
│  │ ├── name: "Mi Empresa"               │    │
│  │ └── tenant_slug: "mi-empresa"        │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ users (todos con el mismo company_id)│    │
│  │ ├── user1 → company_id: mi-empresa   │    │
│  │ ├── user2 → company_id: mi-empresa   │    │
│  │ └── ...                              │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

> **Nota:** El código es **idéntico** en ambos modos. La diferencia es el número de filas en `companies`.

---

## 🔄 Async Jobs: Abstracción de Cola

```typescript
// src/services/jobs/interface.ts
export interface JobQueue {
  enqueue(job: JobData, options?): Promise<string>;
  registerHandler(handler: JobHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Cloud → RedisQueue (BullMQ)
// Self-Hosted → PostgresQueue (pg-boss)

// Uso:
const queue = createJobQueue(); // Detecta modo automáticamente
await queue.enqueue({
  type: "send-invoice-email",
  payload: { invoiceId: "abc123" },
  companyId: "company-uuid",
});
```

---

## 🔐 Matriz de Permisos RBAC

| Ruta | OWNER | ADMIN | TECHNICIAN | OFFICE |
|------|:-----:|:-----:|:----------:|:------:|
| `/dashboard/sat` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard/erp` | ✅ | ✅ | ❌ | ✅ |
| `/dashboard/billing` | ✅ | ✅ | ❌ | ✅ |
| `/dashboard/crm` | ✅ | ✅ | ❌ | ✅ |
| `/dashboard/access` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/settings` | ✅ | ❌ | ❌ | ❌ |

---

## ⚠️ Correcciones y Decisiones de Arquitectura

### 1. Multi-tenancy: Mismo Código, Diferente Contexto
**Decisión:** No crear ramas de código para Cloud vs Self-Hosted.
**Motivo:** El filtro `company_id` funciona igual en ambos modos. En Self-Hosted, solo hay 1 empresa, pero el código no cambia.
**Beneficio:** Mantenimiento único, menos bugs, actualizaciones simultáneas.

### 2. Async Jobs: Interfaz Abstracta
**Decisión:** Crear interfaz `JobQueue` con implementaciones `RedisQueue` y `PostgresQueue`.
**Motivo:** Cloud tiene Redis disponible; Self-Hosted puede no tenerlo. pg-boss usa la misma DB Postgres.
**Beneficio:** Cambio de provider sin modificar código de negocio.

### 3. Proxy: `proxy.ts` en lugar de `middleware.ts` (Next.js 16)
**Decisión:** Usar `proxy.ts` con función `proxy()` en lugar de `middleware.ts`.
**Motivo:** Next.js 16 ha deprecado la convención `middleware.ts` y la ha renombrado a `proxy.ts`. El término "proxy" refleja mejor que es un límite de red frente a la app.
**Corrección:** Cambiado `export function middleware()` → `export function proxy()`.

### 4. Sentry: Condicional por Modo
**Decisión:** `instrumentation.ts` verifica `NEXT_PUBLIC_APP_MODE` antes de inicializar Sentry.
**Motivo:** Self-Hosted no debe enviar datos a servicios externos por privacidad.

### 5. Docker: Multi-stage Build <200MB
**Decisión:** 3 stages (deps → builder → runner) con `node:20-alpine`.
**Motivo:** Imagen pequeña para despliegues rápidos y menor superficie de ataque.

---

## 🚀 Próximos Pasos

1. **Instalar dependencias:** `pnpm install`
2. **Configurar env:** Copiar `.env.example` → `.env.local`
3. **Generar migraciones:** `pnpm db:generate`
4. **Aplicar migraciones:** `pnpm db:migrate`
5. **Iniciar desarrollo:** `pnpm dev`

---

> **Protocolo Hermes completado.** Estructura Clean Architecture generada con éxito.
> **Skills de contexto:** `.skills/` con 4 archivos para agentes IA.
> **Archivos clave:** proxy, auth, db schema, env, Docker, CI/CD.

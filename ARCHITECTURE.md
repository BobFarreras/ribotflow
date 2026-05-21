# 🏗️ RIBOTFLOW - Arquitectura Clean Architecture (Next.js 15+)

> **Data de creació:** 21/05/2026  
> **Estat:** Plànols inicials completats  
> **Metodologia:** Hermes + SDD + SOLID

---

## 📁 Mapa Complet d'Estructura de Directoris

```
RIBOTFLOW-MVP/
├── .skills/                          # 🧠 Context per a agents IA
│   ├── DEVOPS_HERMES.md              #   CI/CD, Docker, Sentry, Husky
│   ├── DB_ARCHITECT.md               #   Drizzle ORM, PostgreSQL, Multi-tenancy
│   ├── UI_UX.md                      #   Next.js UI, Tailwind, Radix, i18n
│   └── AUTH_GUARD.md                 #   Auth.js, RBAC, Sessions, JWT
│
├── .github/workflows/                # 🚀 GitHub Actions Pipelines
│   ├── ci.yml                        #   Validació de qualitat (PR)
│   └── cd.yml                        #   Desplegament + Docker build (main)
│
├── docker/                           # 🐋 Configuració Docker
│   ├── postgres/                     #   Scripts d'inicialització DB
│   └── redis/                        #   Configuració Redis (Cloud)
│
├── public/                           # 📦 Assets estàtics
│   ├── fonts/                        #   Tipografies
│   └── icons/                        #   Icones PWA
│
├── tests/                            # 🧪 Suite de Testing (Vitest)
│   ├── unit/                         #   Tests unitaris
│   ├── integration/                  #   Tests d'integració
│   ├── e2e/                          #   Tests end-to-end
│   ├── mocks/                        #   Mocks de serveis externs
│   └── factories/                    #   Factories de dades de test
│
├── src/
│   ├── middleware.ts                 # 🛡️ Middleware de seguretat + RBAC
│   ├── instrumentation.ts            # 🎯 Sentry (condicional per mode)
│   │
│   ├── app/                          # 🌐 Rutes visuals (Next.js App Router)
│   │   ├── layout.tsx                #   Layout arrel (idioma, metadades)
│   │   ├── page.tsx                  #   Redirecció inicial
│   │   │
│   │   ├── (auth)/                   #   Route group: Autenticació
│   │   │   ├── login/                #     /login
│   │   │   ├── register/             #     /register
│   │   │   └── setup/                #     /setup (Self-Hosted wizard)
│   │   │
│   │   ├── (dashboard)/              #   Route group: App principal
│   │   │   └── dashboard/
│   │   │       ├── sat/              #     Mòdul SAT (ordres de treball)
│   │   │       ├── erp/              #     Mòdul ERP (estocs, productes)
│   │   │       ├── billing/          #     Mòdul Facturació + Veri*factu
│   │   │       ├── crm/              #     Mòdul CRM (clients, vendes)
│   │   │       ├── access/           #     Mòdul Control d'Accés (fitxatge)
│   │   │       ├── settings/         #     Configuració d'empresa
│   │   │       └── unauthorized/     #     Pàgina d'accés denegat
│   │   │
│   │   └── api/                      # 🔌 Rutes d'API
│   │       ├── auth/[...nextauth]/   #   Handler Auth.js
│   │       ├── health/               #   Health check endpoint
│   │       └── webhooks/verifactu/   #   Webhook AEAT Veri*factu
│   │
│   ├── actions/                      # ⚡ Server Actions (Controladors)
│   │   ├── sat/                      #   Accions del mòdul SAT
│   │   ├── erp/                      #   Accions del mòdul ERP
│   │   ├── billing/                  #   Accions de facturació
│   │   ├── crm/                      #   Accions del CRM
│   │   ├── access/                   #   Accions de control d'accés
│   │   └── settings/                 #   Accions de configuració
│   │
│   ├── services/                     # 💼 Capa de Negoci (Framework-agnostic)
│   │   ├── sat/                      #   Lògica de negoci SAT
│   │   ├── erp/                      #   Lògica de negoci ERP
│   │   ├── billing/                  #   Lògica de facturació + Veri*factu
│   │   ├── crm/                      #   Lògica de negoci CRM
│   │   ├── access/                   #   Lògica de control d'accés
│   │   ├── jobs/                     #   🔄 Cua asíncrona (Redis/Postgres)
│   │   ├── integrations/             #   Integracions (Google, SMTP)
│   │   └── i18n/                     #   Servei de traduccions
│   │
│   ├── db/                           # 🗄️ Capa de Dades (Drizzle ORM)
│   │   ├── index.ts                  #   Instància de connexió DB
│   │   ├── schema/                   #   Esquemes de taules
│   │   │   └── auth.ts               #     companies, users, accounts, sessions
│   │   ├── migrations/               #   Migracions generades
│   │   ├── queries/                  #   Consultes reutilitzables
│   │   └── seeds/                    #   Llavors de dades inicials
│   │
│   ├── components/                   # 🎨 Components React
│   │   ├── ui/                       #   Components atòmics (Button, Input...)
│   │   ├── layout/                   #   Estructures (Header, Sidebar, Shell)
│   │   ├── modules/                  #   Components per mòdul
│   │   │   ├── sat/                  #     Components SAT
│   │   │   ├── erp/                  #     Components ERP
│   │   │   ├── billing/              #     Components Facturació
│   │   │   ├── crm/                  #     Components CRM
│   │   │   └── access/               #     Components Control d'Accés
│   │   ├── forms/                    #   Formularis amb validació Zod
│   │   ├── charts/                   #   Visualitzacions de dades
│   │   ├── pwa/                      #   Components PWA (offline, sync)
│   │   └── auth/                     #   Components d'autenticació
│   │
│   ├── hooks/                        # 🪝 React Hooks personalitzats
│   │   ├── sat/                      #   Hooks del mòdul SAT
│   │   ├── erp/                      #   Hooks del mòdul ERP
│   │   ├── billing/                  #   Hooks de facturació
│   │   ├── crm/                      #   Hooks del CRM
│   │   └── access/                   #   Hooks de control d'accés
│   │
│   ├── lib/                          # 📚 Utilitats i configuració
│   │   ├── auth/                     #   Configuració Auth.js v5
│   │   ├── utils/                    #   Funcions auxiliars (crypto, format...)
│   │   ├── validators/               #   Esquemes Zod per validació
│   │   ├── constants/                #   Constants globals (rutes, rols...)
│   │   ├── errors/                   #   Classes d'error personalitzades
│   │   └── logger/                   #   Logger estructurat
│   │
│   ├── config/                       # ⚙️ Configuració de l'aplicació
│   │
│   ├── types/                        # 📝 Definicions de tipus TypeScript
│   │   ├── index.ts                  #   Tipus globals (Role, Plan, User...)
│   │   ├── sat/                      #   Tipus del mòdul SAT
│   │   ├── erp/                      #   Tipus del mòdul ERP
│   │   ├── billing/                  #   Tipus de facturació
│   │   ├── crm/                      #   Tipus del CRM
│   │   └── access/                   #   Tipus de control d'accés
│   │
│   ├── locales/                      # 🌐 Traduccions (i18n)
│   │   ├── ca/                       #   Català
│   │   └── es/                       #   Castellà
│   │
│   └── styles/                       # 🎨 Estils globals
│       └── globals.css               #   Tailwind + variables CSS
│
├── .env.example                      # 🔑 Plantilla de variables d'entorn
├── AGENTS.md                         # 🤖 Regles per a agents IA
├── AUTH.md                           # 🔐 Documentació d'autenticació
├── INFRASTRUCTURE.md                 # 🏗️ Matriu de comportament per mode
├── PROJECT.md                        # 📋 Full de ruta de mòduls
├── TOOLING_AND_WORKFLOW.md           # 🔧 Ecosistema de qualitat
├── ARCHITECTURE.md                   # 📐 Aquest document
├── package.json                      # 📦 Dependències (pnpm)
├── tsconfig.json                     # ⚙️ Configuració TypeScript (strict)
├── next.config.ts                    # ⚙️ Configuració Next.js (standalone)
├── docker-compose.yml                # 🐋 Docker Compose (Self-Hosted)
└── Dockerfile                        # 🐋 Multi-stage build (<200MB)
```

---

## 📦 Explicació de Capes Clau

### 🛡️ `src/middleware.ts` - Seguretat i RBAC
| Responsabilitat | Detall |
|-----------------|--------|
| Intercepta rutes | Totes excepte `/login`, `/register`, `/setup`, `/api/health` |
| Verifica sessió | JWT via Auth.js → valida `companyId` + `role` |
| Filtra per rol | `TECHNICIAN` → només `/dashboard/sat` + `/dashboard/access` |
| Injecta headers | `x-user-role` + `x-company-id` per a rutes descendents |
| Redirigeix | A `/login` si no autenticat, `/unauthorized` si sense permís |

### ⚡ `src/actions/` - Server Actions (Controladors)
| Principi | Aplicació |
|----------|-----------|
| SoC | Cada mòdul té el seu directori d'accions |
| Multi-tenancy | Totes les accions filtren per `session.user.companyId` |
| Validació | Inputs validats amb Zod abans de cridar serveis |
| Errors | Errors personalitzats (`UnauthorizedError`, `ValidationError`) |

### 💼 `src/services/` - Capa de Negoci
| Característica | Detall |
|----------------|--------|
| Framework-agnostic | No depèn de Next.js ni React |
| Testable | Fàcil de mockejar per a tests unitaris |
| Reutilitzable | Cridada des de Server Actions, API routes, o jobs |
| Async jobs | Interfície `JobQueue` abstracta (Redis/Postgres) |

### 🗄️ `src/db/` - Capa de Dades
| Component | Funció |
|-----------|--------|
| `schema/` | Definició de taules Drizzle ORM amb `company_id` |
| `migrations/` | Migracions versionades generades per `drizzle-kit` |
| `queries/` | Consultes reutilitzables amb filtre multi-tenant |
| `index.ts` | Instància única de connexió amb pooling |

---

## 🔀 Flux de Dades (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
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
│  │  (negoci)   │→ │   (Zod)      │  │   (entrada)      │   │
│  └──────┬──────┘  └──────────────┘  └──────────────────┘   │
│         │                                                   │
│  ┌──────▼──────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   DB        │← │  Queries     │← │   Services       │   │
│  │  (Drizzle)  │  │ (reutilitz.) │  │ (lògica negoci)  │   │
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
│  │ ├── name: "Tècnics Girona"           │    │
│  │ └── tenant_slug: "tecnics-girona"    │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ users (tots amb company_id)          │    │
│  │ ├── user1 → company_id: fusteria     │    │
│  │ ├── user2 → company_id: fusteria     │    │
│  │ ├── user3 → company_id: tecnics      │    │
│  │ └── user4 → company_id: tecnics      │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ work_orders (totes amb company_id)   │    │
│  │ ├── wo1 → company_id: fusteria       │    │
│  │ ├── wo2 → company_id: tecnics        │    │
│  │ └── ...                              │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### Self-Hosted (Docker Single-tenant)
```
┌──────────────────────────────────────────────┐
│        PostgreSQL Dedicat (VPS Client)       │
│  ┌──────────────────────────────────────┐    │
│  │ companies                            │    │
│  │ ├── id: uuid                         │    │
│  │ ├── name: "La Meva Empresa"          │    │
│  │ └── tenant_slug: "la-meva-empresa"   │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ users (tots amb el mateix company_id)│    │
│  │ ├── user1 → company_id: la-meva      │    │
│  │ ├── user2 → company_id: la-meva      │    │
│  │ └── ...                              │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

> **Nota:** El codi és **idèntic** en ambdós modes. La diferència és el nombre de files a `companies`.

---

## 🔄 Async Jobs: Abstracció de Cua

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

// Ús:
const queue = createJobQueue(); // Detecta mode automàticament
await queue.enqueue({
  type: "send-invoice-email",
  payload: { invoiceId: "abc123" },
  companyId: "company-uuid",
});
```

---

## 🔐 Matriu de Permisos RBAC

| Ruta | OWNER | ADMIN | TECHNICIAN | OFFICE |
|------|:-----:|:-----:|:----------:|:------:|
| `/dashboard/sat` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard/erp` | ✅ | ✅ | ❌ | ✅ |
| `/dashboard/billing` | ✅ | ✅ | ❌ | ✅ |
| `/dashboard/crm` | ✅ | ✅ | ❌ | ✅ |
| `/dashboard/access` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/settings` | ✅ | ❌ | ❌ | ❌ |

---

## ⚠️ Correccions i Decisions d'Arquitectura

### 1. Multi-tenancy: Mateix Codi, Diferent Context
**Decisió:** No crear branques de codi per a Cloud vs Self-Hosted.  
**Motiu:** El filtre `company_id` funciona igual en ambdós modes. En Self-Hosted, només hi ha 1 empresa, però el codi no canvia.  
**Benefici:** Manteniment únic, menys bugs, actualitzacions simultànies.

### 2. Async Jobs: Interfície Abstracta
**Decisió:** Crear interfície `JobQueue` amb implementacions `RedisQueue` i `PostgresQueue`.  
**Motiu:** Cloud té Redis disponible; Self-Hosted pot no tenir-lo. pg-boss usa la mateixa DB Postgres.  
**Benefici:** Canvi de provider sense modificar codi de negoci.

### 3. Middleware: Headers de Request, No Response
**Correcció:** Inicialment s'estaven afegint headers a la resposta. Corregit per afegir-los a la request.  
**Motiu:** Els handlers descendents necessiten llegir `x-company-id` per filtrar consultes.

### 4. Sentry: Condicional per Mode
**Decisió:** `instrumentation.ts` verifica `NEXT_PUBLIC_APP_MODE` abans d'inicialitzar Sentry.  
**Motiu:** Self-Hosted no ha d'enviar dades a serveis externs per privacitat.

### 5. Docker: Multi-stage Build <200MB
**Decisió:** 3 stages (deps → builder → runner) amb `node:20-alpine`.  
**Motiu:** Imatge petita per a desplegaments ràpids i menor superfície d'atac.

---

## 🚀 Pròxims Passos

1. **Instal·lar dependències:** `pnpm install`
2. **Configurar env:** Copiar `.env.example` → `.env.local`
3. **Generar migracions:** `pnpm db:generate`
4. **Aplicar migracions:** `pnpm db:migrate`
5. **Iniciar desenvolupament:** `pnpm dev`

---

> **Protocol Hermes completat.** Estructura Clean Architecture generada amb èxit.  
> **Skills de context:** `.skills/` amb 4 fitxers per a agents IA.  
> **Fitxers clau:** middleware, auth, db schema, env, Docker, CI/CD.

<div align="center">

```
██████╗ ██╗██████╗  ██████╗ ████████╗███████╗██╗      ██████╗ ██╗    ██╗
██╔══██╗██║██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██║     ██╔═══██╗██║    ██║
██████╔╝██║██████╔╝██║   ██║   ██║   █████╗  ██║     ██║   ██║██║ █╗ ██║
██╔══██╗██║██╔══██╗██║   ██║   ██║   ██╔══╝  ██║     ██║   ██║██║███╗██║
██║  ██║██║██████╔╝╚██████╔╝   ██║   ██║     ███████╗╚██████╔╝╚███╔███╔╝
╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
```

**Sistema Operatiu Empresarial Proactiu · 2026**

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white&style=for-the-badge)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black&style=for-the-badge)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)](https://www.postgresql.org/)
[![Auth.js](https://img.shields.io/badge/Auth.js_v5-3B82F6?logo=auth0&logoColor=white&style=for-the-badge)](https://authjs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white&style=for-the-badge)](https://pnpm.io/)

</div>

---

## 🚀 Quick Start (5 minuts)

> **Requisits:** `Node.js >= 20`, `pnpm >= 10`, `Docker Desktop` (recomanat) o `PostgreSQL 16+` local.

```bash
# 1. Clonar i entrar
git clone https://github.com/tu-usuari/ribotflow.git
cd ribotflow

# 2. Instal·lar dependències (obligatori pnpm)
pnpm install

# 3. Copiar variables d'entorn i editar si cal
cp .env.example .env.local

# 4. Iniciar PostgreSQL (opció A: Docker Desktop — recomanada)
pnpm db:setup

#    Opció B: PostgreSQL natiu (si ja tens PostgreSQL local)
#    Edita .env.local → DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/ribotflow
#    Crea la base de dades manualment i després: pnpm db:push

# 5. Arrancar en mode desenvolupament
pnpm dev
```

Ara obre **`http://localhost:3000`** 🎉

> **Nota sobre Docker:** Si `pnpm db:setup` falla amb `dockerDesktopLinuxEngine`, assegura't que **Docker Desktop està obert i corrent**.

---

## 🧠 Què és RIBOTFLOW?

No construïm un programari de gestió passiu. Creem un **sistema operatiu empresarial proactiu**.

L'objectiu és reduir les hores de treball administratiu un **80%** mitjançant automatitzacions, integracions natives i una interfície hiper-eficient.

- **Mobile-First** per a operaris SAT al carrer.
- **Command-Center** per a oficines i gestors.
- **Multi-tenant Cloud** o **Single-tenant Self-Hosted** amb el mateix codi.
- **Legal 2026 Espanya**: Facturació electrònica, VERI\*FACTU i segellat de la AEAT.

---

## 📐 Arquitectura Dual

RIBOTFLOW s'adapta a dos modes sense canviar una sola línia de lògica de negoci:

| Mode | Cloud (SaaS) | Self-Hosted (Docker) |
|------|-------------|----------------------|
| **Target** | Multi-empresa (SaaS) | Una sola empresa |
| **Base de Dades** | PostgreSQL compartit + PgBouncer | PostgreSQL dedicat |
| **File Storage** | Supabase Storage | MinIO (S3-compatible) |
| **Queue** | BullMQ + Redis | pg-boss (PostgreSQL) |
| **Sentry** | SaaS activat | Desactivat / local |
| **Billing** | Stripe integrat | Llicència directa |
| **Deploy** | Vercel / Kubernetes | `docker compose up` |

> 🔑 **Variable clau:** `NEXT_PUBLIC_APP_MODE=cloud|self_hosted`

### FileStorage Abstraction
El mateix codi funciona per a Cloud i Self-Hosted gràcies a la interfície `FileStorage`:
- **Local** → `./uploads/` (dev fallback)
- **MinIO** → Self-hosted S3-compatible (Docker)
- **Supabase** → Cloud object storage

Factory: `createFileStorage()` llegeix `STORAGE_PROVIDER` de `.env.local`.

---

## 📁 Estructura del Projecte

```text
ribotflow/
├── .github/workflows/      # CI/CD (GitHub Actions)
├── .husky/                   # Pre-commit hooks
├── .skills/                  # Skills per a Agents IA
├── docker/                   # Scripts d'inicialització DB i config Redis
├── public/                   # Assets estàtics (PWA)
├── tests/
│   ├── factories/            # Factories de dades de test
│   ├── unit/                 # Tests unitaris (Vitest)
│   └── setup.ts              # Configuració d'entorn per a tests
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Route group: Login, Register, Setup
│   │   ├── (dashboard)/      # Route group: Dashboard + mòduls
│   │   └── api/              # Rutes API (Auth, Health)
│   ├── actions/              # Server Actions (controladors)
│   │   └── auth/             # Login, logout, register, setup
│   ├── services/             # Capa de negoci (framework-agnostic)
│   │   ├── auth/             # Lògica d'autenticació
│   │   └── jobs/             # Interfície de cues asíncrones
│   ├── db/
│   │   ├── schema/           # Esquemes Drizzle ORM (multi-tenant)
│   │   ├── migrations/       # Migracions versionades
│   │   └── index.ts          # Pool de connexions PostgreSQL
│   ├── components/           # Components React (encara per crear)
│   ├── hooks/                # React hooks personalitzats
│   ├── lib/
│   │   ├── auth/             # Configuració Auth.js v5 (RBAC)
│   │   ├── constants/        # Constants globals
│   │   ├── errors/           # Classes d'error custom
│   │   ├── validators/       # Esquemes Zod per validació
│   │   └── utils/            # Utilitats (crypto, helpers)
│   ├── types/                # Tipatges TypeScript globals
│   ├── locales/              # Traduccions i18n (ca/es)
│   ├── styles/
│   │   └── globals.css       # Design System (Tailwind v4 + tokens CSS)
│   ├── proxy.ts              # Proxy de seguretat + RBAC (Next.js 16)
│   └── instrumentation.ts    # Sentry (opcional)
├── .env.example              # Plantilla d'entorn
├── docker-compose.dev.yml    # PostgreSQL per a dev
├── docker-compose.yml        # Stack complet Self-Hosted
├── drizzle.config.ts         # Configuració Drizzle Kit
├── vitest.config.ts          # Configuració Vitest + coverage
└── package.json              # Scripts i dependències
```

---

## 🛠️ Comandos Disponibles

| Comand | Descripció |
|--------|------------|
| `pnpm dev` | Servidor de desenvolupament amb Turbopack |
| `pnpm build` | Build de producció (standalone) |
| `pnpm test` | Execució de tests amb Vitest |
| `pnpm test:coverage` | Tests amb cobertura (mínim 80%) |
| `pnpm typecheck` | Verificació TypeScript (`tsc --noEmit`) |
| `pnpm lint` | Linting amb ESLint |
| `pnpm format` | Formateig amb Prettier |
| `pnpm db:generate` | Generar migracions (Drizzle Kit) |
| `pnpm db:migrate` | Aplicar migracions a la base de dades |
| `pnpm db:push` | Sincronitzar esquema (dev only) |
| `pnpm db:studio` | Explorador visual de la base de dades |
| `pnpm db:up` | Aixecar PostgreSQL via Docker |
| `pnpm db:down` | Aturar PostgreSQL via Docker |
| `pnpm db:setup` | Aixecar DB + aplicar esquema (dev) |

---

## 🧩 Mòduls i Roadmap

### 🛠️ SAT (Servei d'Assistència Tècnica)
- [x] **[FREE]** Ordres de treball digitals (CRUD, estats, materials, adjunts)
- [x] **[FREE]** Signatura biomètrica genèrica (work_order/quote/invoice)
- [x] **[FREE]** Generació de PDFs professionals (pdf-lib, multi-idioma ca/es/en)
- [x] **[FREE]** FileStorage abstraction (Local, MinIO, Supabase)
- [ ] **[PLUS]** Sincronització Google Calendar & Maps
- [ ] **[PLUS]** Mode PWA Offline (IndexedDB)
- [ ] **[ENTERPRISE]** Optimitzador de rutes intel·ligent

### 🏢 ERP & Estocs
- [x] **[FREE]** Catàleg centralitzat i control d'estoc bàsic
- [ ] **[PLUS]** Multi-magatzem i estoc de furgonetes
- [ ] **[PLUS]** Alertes de reposició automàtiques
- [ ] **[ENTERPRISE]** Traçabilitat per lots i números de sèrie

### 💰 Facturació & Fiscal (Legal 2026 Espanya)
- [x] **[FREE]** Pressupostos i albarans
- [ ] **[PLUS]** Facturació electrònica B2B (FacturaE)
- [ ] **[ENTERPRISE]** VERI\*FACTU: registres encadenats, QR AEAT, signatura digital

### 🤝 CRM
- [x] **[FREE]** Fitxa de client 360°
- [ ] **[PLUS]** Sincronització de correu (Google Workspace / Outlook)
- [ ] **[PLUS]** Tauler Kanban d'oportunitats

### ⏱️ Control d'Accés i RRHH
- [x] **[FREE]** Fitxatge de jornada (compliance legal)
- [ ] **[PLUS]** Gestió d'absències (vacances, baixes)
- [ ] **[ENTERPRISE]** Fitxatge per geolocalització GPS

---

## 🔐 Seguretat i RBAC

| Rol | Permisos |
|-----|----------|
| **OWNER** | Accés total. Gestió d'empresa i facturació. |
| **ADMIN** | Gestió d'usuaris, estocs i configuració. |
| **OFFICE** | Facturació, CRM i pressupostos. |
| **TECHNICIAN** | Ordres SAT, fitxatge i estoc de furgoneta. |

> **Norma d'or:** `company_id` a **TOTES** les consultes de negoci. Mai fer SELECT sense filtre de tenant.

### OWASP Top 10 — Mesures implementades

| Risc | Mesura |
|------|--------|
| **A01: Broken Access Control** | RBAC estrict via `proxy.ts` + validació `company_id` a Server Actions |
| **A02: Cryptographic Failures** | bcrypt per passwords, JWT firmat amb `AUTH_SECRET` |
| **A03: Injection** | Drizzle ORM (consultes parametritzades), validació Zod a tots els inputs |
| **A07: Auth Failures** | Auth.js v5, sessions JWT amb `httpOnly` + `sameSite: lax` |
| **A08: Data Integrity** | Multi-tenancy lògic amb `company_id` immutable al JWT |

---

## 🐳 Docker (Self-Hosted)

```bash
# Mode self-hosted amb una sola comanda
docker compose up -d

# Això aixeca:
#   - App Next.js (port 3000)
#   - PostgreSQL 16 (port 5432)
#   - MinIO (ports 9000 API / 9001 Console)
```

Imatge final: **< 200 MB** (multi-stage build amb `output: "standalone"`).

### Desenvolupament amb Docker Compose

```bash
# Només DB + MinIO (per dev)
docker compose -f docker-compose.dev.yml up -d

# Això aixeca:
#   - PostgreSQL 16 (port 5433)
#   - MinIO API (port 9002)
#   - MinIO Console (port 9003)
#   - Redis (opcional, per a queues)
```

---

## 🧪 Testing

- **Framework:** Vitest v4 + `@vitest/coverage-v8`
- **Cobertura mínima:** 80% en serveis i accions
- **Factories:** `/tests/factories/`
- **Pre-push:** `pnpm typecheck` + `pnpm test`

### Estat actual

| Tipus | Estat | Detall |
|-------|-------|--------|
| Unitari | ✅ | `crypto.test.ts` — 5/5 passen |
| Integració | 🟡 | `auth.test.ts` — 4 tests `todo` (requereixen DB de test) |
| E2E | 🔴 | Encara no implementat |

---

## 🤖 Skills per a Agents IA

Aquest projecte inclou skills especialitzades a `.skills/` perquè els agents IA treballin amb context:

| Skill | Responsabilitat |
|-------|----------------|
| `DB_ARCHITECT` | Disseny d'esquemes, migracions Drizzle, optimització PostgreSQL |
| `UI_UX` | Next.js App Router, Tailwind v4, Radix, Mobile-First, WCAG 2.1 AA |
| `AUTH_GUARD` | Auth.js v5, RBAC, Multi-tenancy, JWT immutable |
| `SECURITY` | OWASP Top 10, proxy.ts, Zod, headers de seguretat |
| `FRONTEND_DEV` | React 19, Server Components, hooks, formularis RHF+Zod |
| `BACKEND_DEV` | Server Actions, API routes, Clean Architecture, cues asíncrones |
| `TESTING` | Vitest, factories, mocks, integració DB, coverage 80% |
| `DEVOPS_HERMES` | CI/CD, Sentry, Docker, GitHub Actions, Husky |
| `ENGRAM_MCP` | Memòria persistent de decisions, errors i patrons |

> Llegeix `AGENTS.md` per a les regles completes d'arquitectura.

---

## 🚀 Guia d'Implementació (Roadmap Actiu)

### **Fase 0: Fundació** (Completada)
- [x] Proxy RBAC (`proxy.ts`)
- [x] Auth.js v5 amb JWT + `company_id`
- [x] Drizzle ORM + PostgreSQL
- [x] Login / Register / Setup UI
- [x] Validació Zod d'entorns (`lib/env.ts`)
- [x] Design System CSS (`globals.css`)

### **Fase 1: Testing & Qualitat** (En progrés)
- [x] Vitest configurat amb coverage
- [x] Tests unitaris (crypto)
- [ ] Tests d'integració amb DB de test
- [ ] CI/CD GitHub Actions
- [ ] Pre-push hooks (lint + typecheck + test)

### **Fase 2: Mòdul SAT (FREE)** — Completada (Maig 2026)
- [x] Esquema Drizzle: `work_orders`, `clients`, `materials`, `attachments`, `signatures` (genèrica)
- [x] Server Actions: create, assign, close, status transitions, materials, attachments, signatures
- [x] Tests TDD per a serveis i accions (60 tests passant)
- [x] UI Mobile-First: llistat, detall, formulari, firma, PDF
- [x] FileStorage abstraction amb MinIO per a dev

### **Fase 2.5: Mòdul Pressupostos i Albaranes (FREE)** — Pendent
- [ ] Esquema: `quotes`, `quote_items`
- [ ] Reutilitzar `signatures` genèrica per a pressupostos
- [ ] Conversió quote → work_order → invoice

### **Fase 2.6: Personalització de PDF i Company Settings** — Pendent
- [ ] Mòdul de configuració d'empresa (logo, colors, text legal)
- [ ] PdfBuilder dinàmic amb branding per empresa

### **Fase 3: Mòdul ERP & Estocs (FREE)**
- [ ] Esquema: `products`, `warehouses`, `stock_movements`
- [ ] Server Actions + Tests TDD
- [ ] UI: catàleg i control d'estoc

### **Fase 4: Mòdul Fiscal i Facturació**
- [ ] Esquema: `invoices`, `budgets`, `delivery_notes`
- [ ] Generació de PDFs
- [ ] Tests TDD

### **Fase 5: PWA Offline i UX**
- [ ] Service Worker amb Workbox
- [ ] IndexedDB per a dades offline
- [ ] Tests d'integració offline

---

## 📜 Llicència

Projecte sota llicència privada. Tots els drets reservats.

---

<div align="center">

**RIBOTFLOW** — *Reduint el 80% del temps administratiu des del 2026.*

</div>

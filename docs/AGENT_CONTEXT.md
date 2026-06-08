# Agent Context Transfer Guide

## Purpose
This document allows any AI agent to quickly understand the full project context without reading all source files. Use this when starting work on a new machine or after a long break.

## Quick Start (Run This First!)

When you open this project on a new machine, **read this file completely** before doing anything else.

This document contains all critical context from previous development sessions including:
- Architecture decisions
- Bugs found and their solutions
- Feature implementations
- Database design choices

**After reading, save key decisions to your own local memory** (e.g., Engram) so future sessions on this machine retain context.

---

## Project Overview

**Name:** RIBOTFLOW
**Type:** Enterprise Operating System (ERP, SAT, CRM, Billing, Access Control)
**Stack:** Next.js 16 + React 19 + TypeScript + PostgreSQL + Drizzle ORM + Auth.js v5
**Language:** English code, Catalan/Spanish UI via i18n
**Branch:** `refactor/pdf-solid-architecture` (active development, 18+ commits ahead of `features/sat-work-orders`)

---

## Critical Architecture Decisions (Do Not Break These!)

### 1. Next-Auth v5 + Next.js 16 Proxy Pattern
**File:** `src/proxy.ts`
**Pattern:** `export const proxy = auth((req) => { ... })`

**CRITICAL RULES:**
- NEVER use `await auth()` without request context in proxy/middleware
- ALWAYS use the `auth()` wrapper function: `auth((req) => { ... })`
- The proxy is the SINGLE SOURCE OF TRUTH for auth redirects
- Page components should NOT call `redirect('/login')` - they should just use session data
- Removed `authorized` callback from NextAuth config (conflicts with proxy wrapper)
- Removed custom cookie config (uses Next-Auth defaults now)
- **Session strategy MUST be JWT** — database strategy causes `UnsupportedStrategy` error with CredentialsProvider
- **Session callback validates role from DB** on every request — if role changed, session is invalidated (forces re-login)
- **Manual sessions table row** inserted in jwt callback on signIn (for Active Sessions UI), since JWT strategy doesn't auto-create DB sessions
- **LoginForm uses two-step auth:** `loginAction` validates credentials server-side, then client-side `signIn("credentials")` establishes the session cookie

### 2. Multi-tenancy via `company_id`
- EVERY database query for business data MUST include `company_id` filter
- User JWT token contains: `id`, `email`, `name`, `role`, `companyId`
- Roles: OWNER, ADMIN, TECHNICIAN, OFFICE

### 3. Route Groups (Important!)
- Pages under `app/(dashboard)/` do NOT add `/dashboard` to URLs
- `/sat` NOT `/dashboard/sat`
- `/erp` NOT `/dashboard/erp`
- The `(dashboard)` folder is a route group for layout sharing only

### 4. i18n Keys (Always Use Them!)
- NEVER hardcode UI text
- Use `t("sat.workOrder.list.title")` pattern
- Files: `src/locales/ca/*.json` and `src/locales/es/*.json`
- Keys must be added to BOTH language files

### 5. Server Actions Pattern
- Server Actions are the ONLY way to mutate data
- Always validate with Zod schemas
- Always check `session.user.companyId`
- Always call `revalidatePath()` after mutations
- Client-side `signIn` from `next-auth/react` for login/registration (NOT server-side)
- After save/delete actions that modify DB config, call `clearSmtpCache(companyId)` to invalidate in-memory cache

---

## Demo Account (Official Test Account)

**DO NOT DELETE THIS ACCOUNT**

| Field | Value |
|-------|-------|
| Company | DigitAIStudios |
| User | Adrià |
| Email | dais@test.com |
| Password | 12345678 |
| Role | OWNER |
| Tenant Slug | ditaistudios |

### Demo Data Created by `pnpm db:seed:demo`
- **5 categories:** Repair, Maintenance, Installation, Assembly, Inspection
- **8 clients:** Restaurant, Gym, Dental Clinic, Hotel, School, Supermarket, Offices, Mechanic
- **10 products:** Cable 3x1.5mm, Circuit breaker 16A, PVC tube, Condensing boiler, etc.
- **12 work orders:** Various statuses (pending, scheduled, in_progress, paused, completed, closed, cancelled, waiting_parts, waiting_client)

---

## Database Connection

- **Host:** localhost:5433 (Docker container, NOT 5432)
- **User:** postgres
- **Password:** postgres
- **Database:** ribotflow
- **URL:** `postgresql://postgres:postgres@localhost:5433/ribotflow`

**Docker Compose:** `docker-compose.dev.yml`
**Start:** `pnpm db:setup` (starts container + applies migrations)
**View UI:** `pnpm db:studio` → http://localhost:4983 (use Firefox, not Chrome)

---

## SAT Module Status

### Completed
- [x] Database schema (13 tables: clients, categories, work_orders, status_history, materials, attachments, signatures, locations, products, **quotes**, **quote_items**, **quote_templates**, **quote_status_history**)
- [x] Work order service with status workflow transitions
- [x] Material service with product catalog + free-text materials
- [x] Attachment service with local file storage
- [x] Signature service (generic `signatures` table for work_order/quote/invoice)
- [x] PDF generation service (`pdf-lib`, multi-language ca/es/en, branded design)
- [x] Product service (company catalog with SKU, unitPrice, unitCost, stock)
- [x] **Quote service** (CRUD + workflow + PRE-{YYYY}-{SEQ} numbering + calculations)
- [x] **Quote item service** (line items with auto-recalculation of totals)
- [x] **Quote template service** (templates with duplicate and usage tracking)
- [x] Server Actions: createWorkOrder, updateStatus, assignTechnician, addMaterial, removeMaterial, getProducts, addAttachment, deleteAttachment, saveSignature, generatePdf, deletePdf, createCategory, updateCategory, createClient, **createQuote**, **updateQuote**, **deleteQuote**, **updateQuoteStatus**, **addQuoteItem**, **updateQuoteItem**, **removeQuoteItem**, **createQuoteTemplate**, **updateQuoteTemplate**, **deleteQuoteTemplate**, **duplicateQuoteTemplate**, **acceptQuote**, **rejectQuote**
- [x] UI pages: List (`/sat`), Detail (`/sat/[id]`), Create (`/sat/new`), Map (`/sat/map`), Routes (`/sat/routes`), Clients (`/sat/clients`), Client Detail (`/sat/clients/[id]`), Client New (`/sat/clients/new`), Categories (`/sat/categories`), Category New (`/sat/categories/new`), Category Edit (`/sat/categories/[id]`), **Quotes (`/sat/quotes`)**, **Quote Detail (`/sat/quotes/[id]`)**, **Quote New (`/sat/quotes/new`)**, **Quote Templates (`/sat/quotes/templates`)**
- [x] Client components: WorkOrderForm, WorkOrderActions, TechnicianAssigner, MaterialList, AttachmentSection, SignatureCanvas, PdfGenerator, CheckInButton, AddressAutocomplete, GoogleMapsLink, MapView, TravelCostCard, WorkOrderFilters, Pagination, WorkOrderCard, WorkOrderTable, WorkOrderKanban, CategoryIcon, StatusHistorySection, **QuoteEditor**, **QuotePdfPreview**, **QuoteList**, **QuoteStatusBadge**, **QuoteItemTable**, **QuoteActions**
- [x] i18n translations (ca/es) for all SAT strings including materials, attachments, signatures, PDF, work orders, clients, categories, **quotes**, **quote templates**
- [x] Auto-number generation: `OT-{YYYY}-{SEQ}` per company, **`PRE-{YYYY}-{SEQ}`** for quotes
- [x] Technician assignment with RBAC guard
- [x] Status history tracking
- [x] Materials management UI (catalog selector + free-text + quantity + totals)
- [x] Attachments/photos UI (upload with preview, before/after checkbox, caption, grid, lightbox, delete)
- [x] Digital signature UI (canvas with mouse/touch, SVG + PNG export, name input, only visible when status is `completed` or `closed`)
- [x] PDF generation UI (language selector ca/es/en, generate/download/regenerate/delete buttons)
- [x] Geolocation / Check-in GPS (`CheckInButton.tsx`, distance validation <100m, auto-updates status to `in_progress`)
- [x] FileStorage abstraction (`LocalFileStorage`, `MinioStorage`, `SupabaseStorage`) with factory pattern
- [x] Local file storage API (`/api/uploads/[...path]`) with mime type detection and security
- [x] 3 Views for work orders: Grid (cards), Table (sortable columns), Kanban (drag & drop with panning)
- [x] Advanced filters (search, status, category, priority, technician, date range)
- [x] Pagination (25/50/100 per page)
- [x] Routing engine agnostic (Haversine free / OpenRouteService free / Google Maps premium)
- [x] Travel billing service (distance × rate per km)
- [x] Notification service (email SMTP with lazy nodemailer import, per-company DB config with env fallback, 5-min cache)
- [x] Category CRUD with visual icon picker (~12 SVG icons) and color picker
- [x] Client CRUD (list, detail, create)
- [x] Category icon propagation — `icon` field flows from DB → Service → all 6 UI components
- [x] **Quote professional editor** with split view (editor + PDF preview)
- [x] **Quote PDF preview** simulating A4 document with professional layout
- [x] **Quote default values** (30 days validity, conditions, work description)
- [x] **Quote collapsible sections** in editor for better UX
- [x] **Quote integration with OT detail** — shows quotes list in OT detail page
- [x] **SMTP settings page** (`/settings/email`) — Per-company SMTP config with provider presets, encrypted passwords, test connection, self-signed cert option
- [x] **Company settings schema** — Migration 0010 adds `smtp_configs` table + company fields (email, website, address_*, default_tax_rate, quote_prefix)

### Work Order Statuses (All Implemented)
| Status | Catalan | Spanish |
|--------|---------|---------|
| pending | Pendent | Pendiente |
| assigned | Assignada | Asignada |
| scheduled | Programada | Programada |
| in_progress | En curs | En curso |
| paused | Pausada | Pausada |
| completed | Completada | Completada |
| closed | Tancada | Cerrada |
| cancelled | Cancel·lada | Cancelada |
| waiting_parts | Esperant peces | Esperando piezas |
| waiting_client | Esperant client | Esperando cliente |

**IMPORTANT:** Status transitions are now **FREE** — any status can transition to any other status. The `VALID_STATUS_TRANSITIONS` constant in `src/lib/constants/statusTransitions.ts` allows all transitions. No restrictive validation.

### Pending / Next Features (Priority Order)
1. **Vista pública del client** — Enllaç sense login perquè el client pugui acceptar/rebutjar
2. **Edició de Clients** (`/sat/clients/[id]/edit`)
3. **Personalització de PDF i Company Settings** (logo, colors, text legal, tarifa desplaçament)
4. **Mode PWA Offline** per a tècnics
5. **Email notifications on status changes** for work orders
6. **Calendar integration** for scheduled dates

> **SMTP Configuration** — See `docs/SMTP_SETUP.md`. The system uses DB-first config (`smtp_configs` table per company, encrypted passwords via `ENCRYPTION_KEY`). Env vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) serve as fallback only. Once a company has DB config, env vars are ignored for that company.

---

## Testing

- **Framework:** Vitest
- **Coverage target:** 80% minimum
- **Integration tests:** Use real PostgreSQL (Docker must be running)
- **Test DB seed:** `tests/db-seed.ts` creates test company + user + categories + client
- **Run tests:** `pnpm test`
- **Full CI check:** `pnpm ci:check` (typecheck + lint + format + test + build)

**Current Test Count:** 393 tests passing across 47 test files

> **IMPORTANT:** Si els tests fallen amb `column "tax_id" of relation "companies" does not exist`, vol dir que la BD no té les migracions 0008-0009. Executa: `pnpm db:migrate`.

| Test File | Tests | Description |
|-----------|-------|-------------|
| `crypto.test.ts` | 5 | Password hashing (bcryptjs) |
| `authorize.test.ts` | 3 | RBAC role checks |
| `auth.test.ts` | 4 | Registration, login, company creation |
| `workOrderService.test.ts` | 7 | CRUD + status workflow + security |
| `materialService.test.ts` | 6 | Materials CRUD + catalog + free-text + security |
| `attachmentService.test.ts` | 6 | Attachments CRUD + metadata + security |
| `signatureService.test.ts` | 6 | Signature save/update/get/remove + multi-tenant security |
| `locationService.test.ts` | 11 | GPS check-in + distance calculation + security |
| `routeOptimizer.test.ts` | 3 | TSP greedy nearest-neighbor algorithm |
| `haversineEngine.test.ts` | 4 | Haversine distance + time estimation |
| `encryption.test.ts` | 11 | AES-256-GCM encrypt/decrypt, key derivation |
| `notificationService.test.ts` | 16 | SMTP config (env vars, DB priority, fallback, TLS settings, cert errors, attachments) |
| `DashboardShell.test.tsx` | 3 | Layout rendering |
| `SidebarContext.test.tsx` | 9 | Sidebar state management |
| `SidebarNav.test.tsx` | 11 | Navigation rendering + active states |
| `ActiveSessionsList.test.tsx` | Tests for profile sessions UI |
| `sessionsActions.test.ts` | Tests for session server actions |
| `sessions.test.ts` | Tests for session service |

**Test cleanup (2026-06-02):** Each integration test file uses a **unique company slug + email** (`test-empresa-{workorder,material,signature,location,attachment}`) and calls `cleanupTestDatabase()` in `afterAll` to drop the company + cascading FKs. The dev DB stays clean — only `DigitAIStudios` should remain after `pnpm test`.

**Notification service cache:** `resolveSmtpConfig()` uses an in-memory Map cache with 5-minute TTL per company. Tests must call `clearSmtpCache()` in `beforeEach`/`afterEach` to avoid stale data between tests.

---

## Known Issues & Solutions

### Issue: "Couldn't find next-intl config file"
**Solution:** `i18n.ts` must be at project root (not in src/). Configured in `next.config.ts` with `createNextIntlPlugin()`.

### Issue: Login redirects after successful signIn
**Root Cause:** `auth()` without request context cannot read browser cookies. Must use `auth((req) => { ... })` wrapper.
**Solution Applied:** See proxy.ts pattern above.

### Issue: LoginForm silent failure (no error shown)
**Root Cause:** `signIn()` from next-auth/react can throw or return unexpected results in NextAuth v5 beta. The original LoginForm had no try/catch and only checked `result?.ok`, missing cases where `result?.url` indicates success.
**Solution Applied:** LoginForm now wraps signIn in try/catch/finally and checks both `result?.ok` and `result?.url`. Error feedback always shown to user.

### Issue: 404 when navigating to /dashboard/sat
**Root Cause:** Route group `(dashboard)` doesn't add `/dashboard` prefix.
**Solution:** All URLs are `/sat`, `/erp`, etc. (not `/dashboard/sat`).

### Issue: "Missing translation key" errors
**Root Cause:** Adding new status values but not updating locale JSON files.
**Solution:** Always update BOTH `src/locales/ca/sat.json` AND `src/locales/es/sat.json`.

### Issue: Drizzle Studio connection problems
**Root Cause:** Chrome/Chromium blocks localhost connections by default.
**Solution:** Use Firefox, or disable Chrome security flags for localhost.

### Issue: "Conflict. The container name '/ribotflow-dev-db' is already in use"
**Root Cause:** A previous Docker container exists (stopped or running) with the same name.
**Solution:** Run `docker rm -f ribotflow-dev-db` then retry `pnpm db:setup`.

### Issue: db:setup fails with "redirección de entradas" (Windows)
**Root Cause:** The `timeout` command in `package.json` fails when pnpm redirects stdin.
**Solution:** The `db:setup` script now uses `node -e "setTimeout(()=>process.exit(0), 8000)"` instead of `timeout`.

### Issue: ECONNREFUSED ::1:5432 during db:push
**Root Cause:** `.env.local` had `DATABASE_URL` pointing to port 5432, but Docker maps PostgreSQL to host port 5433.
**Solution:** Verify `.env.local` uses `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ribotflow`.

### Issue: Tests fail with "The specified bucket does not exist" (MinIO)
**Root Cause:** MinIO bucket `ribotflow` was not created.
**Solution:**
```bash
docker exec ribotflow-dev-minio mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
docker exec ribotflow-dev-minio mc mb local/ribotflow
docker exec ribotflow-dev-minio mc anonymous set public local/ribotflow
```

### Issue: Tests fail with "relation 'signatures' does not exist"
**Root Cause:** Migration `0002_eminent_blink.sql` was not applied to the database.
**Solution:** If `drizzle-kit migrate` fails because `__drizzle_migrations` table is missing, apply the migration manually:
```bash
cat src/db/migrations/0002_eminent_blink.sql | docker exec -i ribotflow-dev-db psql -U postgres -d ribotflow
```

### Issue: Category icon not updating in work order listings after edit
**Root Cause:** `workOrderService.ts` queries only selected `category.slug`, not `category.icon`. Components passed `slug` to `CategoryIcon`, which is immutable.
**Solution:** Added `icon` to all category queries in `workOrderService.ts` and updated all 6 components to use `category.icon ?? category.slug`.
**Files changed:** `workOrderService.ts`, `WorkOrderCard.tsx`, `WorkOrderTable.tsx`, `WorkOrderKanban.tsx`, `WorkOrderList.tsx`, `/sat/[id]/page.tsx`, `/sat/page.tsx`.

### Issue: "In HTML, <a> cannot be a descendant of <a>" on /sat/clients
**Root Cause:** `Link` card wrapped entire card, and inside were `<a href="tel:...">` and `<a href="mailto:...">`.
**Solution:** Restructured to `<div>` with invisible absolute `<Link>` overlay (z-0) and elevated interactive children (z-10). See Decision Log entry "Card overlay pattern".
**Files changed:** `/sat/clients/page.tsx`.

### Issue: Sidebar flash on navigation (RESOLVED — see Critical Bug section below)
**If it returns:** Verify ALL navigation uses `<Link>` from `next/link`, NEVER `<a href>`. Check `SidebarNav.tsx`, `Sidebar.tsx`, and any custom nav components.

### Issue: Quote email doesn't send (silent failure)
**Root Cause:** The service reads `SMTP_PASSWORD`, but `.env.local` had `SMTP_PASS`. When env vars were missing, the service only logged a warning to the server console and returned `success: true` to the action, showing a misleading success toast.
**Solution:**
1. Use `SMTP_PASSWORD` (not `SMTP_PASS`) in `.env.local`
2. `sendEmailWithAttachment` now returns `{success, error?}` and propagates errors to the UI toast
3. Error message lists which env vars are missing
**See:** `docs/SMTP_SETUP.md` for full guide.

### Issue: Tests fail with `column "tax_id" of relation "companies" does not exist`
**Root Cause:** Les migracions 0008 i 0009 (afegides per la feature de PDF signat + email) no estaven aplicades a la BD local. La taula `drizzle.__drizzle_migrations` estava desfasada.
**Solution:** Executar `pnpm db:migrate`. Si la taula `__drizzle_migrations` està buida o inconsistent, seguir el Protocol de Sincronitzacio de Maquina (més avall).

---

## File Structure Quick Reference

```
src/
  app/(dashboard)/         # Route group (no URL prefix)
    layout.tsx              # Dashboard layout with Sidebar + Shell
    dashboard/page.tsx      # Home dashboard template
    sat/page.tsx            # List orders (3 views) → URL: /sat
    sat/[id]/page.tsx       # Order detail (3 columns compact) → URL: /sat/:id
    sat/new/page.tsx        # Create order → URL: /sat/new
    sat/map/page.tsx        # Interactive Leaflet map → URL: /sat/map
    sat/routes/page.tsx     # Route optimizer (TSP) → URL: /sat/routes
    sat/clients/page.tsx    # Client list → URL: /sat/clients
    sat/clients/new/page.tsx # Create client → URL: /sat/clients/new
    sat/clients/[id]/page.tsx # Client detail + OTs → URL: /sat/clients/:id
    sat/categories/page.tsx # Category list → URL: /sat/categories
    sat/categories/new/page.tsx # Create category → URL: /sat/categories/new
    sat/categories/[id]/page.tsx # Edit category → URL: /sat/categories/:id
    sat/quotes/page.tsx # List quotes → URL: /sat/quotes
    sat/quotes/new/page.tsx # Create quote → URL: /sat/quotes/new
    sat/quotes/[id]/page.tsx # Quote detail → URL: /sat/quotes/:id
    sat/quotes/templates/page.tsx # Quote templates → URL: /sat/quotes/templates
    settings/email/page.tsx   # SMTP config → URL: /settings/email
    api/uploads/[...path]/route.ts  # Local file serving API
  components/layout/        # Layout Components
    SidebarContext.tsx      # React context for sidebar state
    Sidebar.tsx             # Main sidebar (collapsible, responsive)
    SidebarNav.tsx          # Navigation with sub-menus
    SidebarFooter.tsx       # Theme, language, logout
    DashboardShell.tsx      # Content wrapper that adapts to sidebar
  actions/sat/             # Server Actions (with shims for backward compat)
    # Quotes (subdomain)
    quotes/
      createQuote.ts
      updateQuote.ts
      deleteQuote.ts
      updateQuoteStatus.ts
      addQuoteItem.ts
      updateQuoteItem.ts
      removeQuoteItem.ts
      createQuoteTemplate.ts
      updateQuoteTemplate.ts
      deleteQuoteTemplate.ts
      duplicateQuoteTemplate.ts
      acceptQuote.ts        # Accept quote (client signature)
      sendQuoteEmail.ts     # Send quote by email with PDF
    # Work Orders (subdomain)
    work-orders/
      createWorkOrder.ts
      updateStatus.ts
      assignTechnician.ts
      checkIn.ts            # GPS check-in with distance validation
      saveSignature.ts      # Save digital signature (SVG + PNG)
      generatePdf.ts        # Generate PDF report
      deletePdf.ts          # Delete generated PDF
      addMaterial.ts
      removeMaterial.ts
      addAttachment.ts
      deleteAttachment.ts
      getProducts.ts
    # Clients (subdomain)
    clients/
      createClient.ts
      createCategory.ts
      updateCategory.ts
  components/sat/           # Client Components (with shims for backward compat)
    # Work Orders (subdomain)
    work-orders/
      WorkOrderForm.tsx
      WorkOrderActions.tsx
      TechnicianAssigner.tsx
      MaterialList.tsx      # Product catalog + free-text materials
      AttachmentSection.tsx # Upload 2-step (preview → confirm) + grid
      SignatureCanvas.tsx   # Canvas for digital signature
      PdfGenerator.tsx      # Generate/download/regenerate/delete PDF
      CheckInButton.tsx     # GPS check-in with distance validation
      WorkOrderFilters.tsx  # Unified filter bar (one row)
      WorkOrderList.tsx     # View wrapper: filters + pagination + switcher
      WorkOrderCard.tsx     # Grid card with category icon + distance
      WorkOrderTable.tsx    # Sortable table view
      WorkOrderKanban.tsx   # Drag & drop board with horizontal panning
      MapView.tsx           # Leaflet map with category icons
      StatusHistorySection.tsx # Audit log timeline
      RoutePlanner.tsx      # Route optimizer UI
    # Quotes (subdomain)
    quotes/
      QuoteEditor.tsx       # Professional editor with split view
      QuotePdfPreview.tsx   # A4 PDF simulation
      QuoteList.tsx         # Quote list with filters
      QuoteStatusBadge.tsx  # Quote status badge
      SendQuoteEmailModal.tsx # Email send modal
# Shared (used by both subdomains)
     shared/
       AddressAutocomplete.tsx # Nominatim geocoding autocomplete
       GoogleMapsLink.tsx    # External Google Maps link
       CategoryIcon.tsx      # SVG icon picker (~12 icons, reusable)
       WorkOrderStatusBadge.tsx # Dot indicator badge
       WorkOrderPriorityBadge.tsx # Dot + text (no background)
   components/sat/settings/   # Settings components
     SmtpSettingsForm.tsx    # Orchestrator with RBAC + inline feedback
     SmtpConnectionFields.tsx # Step 1-2: server + credentials
     SmtpSenderFields.tsx     # Step 3: sender identity
     SmtpAdvancedSection.tsx  # Step 4: self-signed certs (open by default)
     SmtpStatusBadge.tsx     # Configured/not-configured banner
     SmtpTestBanner.tsx      # Success/failure feedback + cert help
     SmtpPermissionNotice.tsx # Read-only notice for non-OWNER roles
     ProviderPresets.tsx     # Quick-select Gmail/Outlook/Yahoo/Hostinger/IONOS/Custom
     useSmtpSettingsForm.ts  # Form state + action handlers + cache invalidation
  services/sat/             # Business Logic
    workOrderService.ts
    materialService.ts
    productService.ts
    attachmentService.ts
    signatureService.ts     # Generic signature CRUD + storage
    pdfService.ts           # PdfBuilder class + PdfService
    locationService.ts      # GPS tracking + Haversine distance calculation
    clientService.ts        # SAT client CRUD
    categoryService.ts      # Work order category CRUD
    quoteService.ts         # Quote CRUD + workflow + calculations
    quoteItemService.ts     # Quote line items with auto-recalculation
    quoteTemplateService.ts # Quote templates with duplicate and usage tracking
  services/routing/         # Route Engine (agnostic)
    interface.ts            # RouteEngine contract
    haversineEngine.ts      # Free: straight-line distance
    openRouteServiceEngine.ts # Free: real driving directions
    googleMapsEngine.ts     # Premium: Google Maps API
    routeOptimizer.ts       # Greedy TSP nearest-neighbor
  services/billing/         # Billing
    travelBillingService.ts # Calculate travel cost (km × rate)
services/notifications/   # Notifications
     notificationService.ts  # Email SMTP with lazy nodemailer import + per-company DB config + 5min cache
   services/sat/company/     # Per-company settings
     smtpConfigService.ts    # SMTP config CRUD + AES-256-GCM encryption + testConnection
  services/storage/         # File Storage Abstraction
    interface.ts            # FileStorage contract
    factory.ts              # Provider selector (local/minio/supabase)
    localStorage.ts         # Local filesystem implementation
    minioStorage.ts         # MinIO (S3-compatible) implementation
    supabaseStorage.ts      # Supabase Storage implementation
    index.ts                # Re-exports
  lib/utils/storageKeys.ts  # Human-readable storage key builders
lib/auth/index.ts         # NextAuth config (JWT strategy, MUST NOT use database strategy)
   lib/auth/roles.ts          # Role hierarchy and type (OWNER > ADMIN > OFFICE/TECHNICIAN)
   lib/auth/permissions.ts     # Permission matrix + can() + canAll() + canAny()
   lib/auth/canSeePath.ts     # URL → Permission mapping (proxy + sidebar use this)
   lib/auth/currentSession.ts # User-agent + IP fingerprint for active sessions UI
   proxy.ts                  # Auth proxy (SINGLE source of truth for auth + RBAC)
  db/schema/sat.ts          # Database schema (13 tables)
  locales/ca/*.json         # Catalan translations (common + sat)
  locales/es/*.json         # Spanish translations (common + sat)
```

---

## Sidebar Architecture

### Components
| Component | Responsibility |
|-----------|----------------|
| `SidebarContext.tsx` | Global state: collapsed, mobileOpen, theme, toggle functions |
| `Sidebar.tsx` | Main sidebar with header, nav, footer; handles mobile overlay |
| `SidebarNav.tsx` | Navigation items with collapsible sub-menus; active route highlighting |
| `SidebarFooter.tsx` | Theme toggle, language switcher, user info, logout |
| `DashboardShell.tsx` | Content wrapper that adapts margin based on sidebar state |

### Features
- **Collapsible:** Width transitions between 260px (open) and 72px (collapsed)
- **Responsive:** Desktop = fixed sidebar; Mobile (<1024px) = drawer with overlay
- **Sub-menus:** Each module can have nested items (e.g., SAT → Work Orders, Clients, Categories)
- **Theme:** Light/Dark mode toggled via CSS class `.dark` on `<html>`
- **Language:** Switch between `ca` and `es` via next-intl
- **Persistence:** Sidebar state and theme saved to `localStorage`
- **Smart tooltips:** When collapsed, hovering shows full label + sub-menu items

### Adding a New Module to Sidebar
1. Edit `src/components/layout/SidebarNav.tsx`
2. Add entry to `navItems` array with `key`, `href`, `icon`, and optional `subItems`
3. Add translations to `src/locales/{ca,es}/common.json` under `sidebar.modules.{key}`

---

## Database Migration Workflow (Team Development)

**CRITICAL:** Do NOT use `db:push` in a team setting. It directly alters the database and can drop data. Use versioned migrations instead.

### Daily Developer Workflow

```bash
pnpm db:setup               # Start container + apply pending migrations (SAFE)
```

### When You Modify the Schema

1. Edit `src/db/schema/*.ts`
2. Generate a versioned migration:
   ```bash
   pnpm db:generate
   ```
3. Commit the generated SQL file in `src/db/migrations/`:
   ```bash
   git add src/db/migrations/
   git commit -m "feat: add CRM leads table"
   ```
4. Other developers pull and run:
   ```bash
   pnpm db:migrate
   ```

### Command Reference

| Command | Purpose | Safe for Data? |
|---------|---------|----------------|
| `pnpm db:setup` | Start container + apply pending migrations | Yes |
| `pnpm db:setup:fresh` | Start container + force schema push (CI only) | No |
| `pnpm db:migrate` | Apply pending versioned migrations | Yes |
| `pnpm db:generate` | Create new migration from schema changes | N/A |
| `pnpm db:push` | Directly push schema (solo dev / fresh container only) | No |
| `pnpm db:reset` | Destroy volume + recreate container (ALL DATA LOST) | No |
| `pnpm db:seed:demo` | Create DigitAIStudios demo data | N/A |

---

## Commands Reference

```bash
pnpm dev                    # Development server
pnpm build                  # Production build
pnpm test                   # Run tests
pnpm ci:check               # Full validation
pnpm db:studio              # UI for database
pnpm db:seed:demo           # Create DigitAIStudios demo data
pnpm format                 # Format code
pnpm lint                   # Check code style
pnpm typecheck              # TypeScript check
```

---

## Environment Variables Required

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ribotflow
AUTH_SECRET=your-secret-key-here (minimum 32 characters)
NEXT_PUBLIC_APP_MODE=cloud

# Encryption (AES-256-GCM for SMTP passwords, etc.)
ENCRYPTION_KEY=base64-encoded-32-byte-key

# SMTP (optional — DB config takes priority via /settings/email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=your-password
SMTP_TLS_REJECT_UNAUTHORIZED=false  # Dev only: accept self-signed certs

# MinIO (Development via docker-compose.dev.yml)
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9002
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=ribotflow
MINIO_PUBLIC_URL_BASE=http://localhost:9002/ribotflow
```

### MinIO Ports Explained

| Service | Dev Port | Used By |
|---------|----------|---------|
| MinIO API (S3) | **9002** | Next.js app uploads/downloads |
| MinIO Console (Web UI) | **9003** | You (human) browse buckets |

### Making MinIO Bucket Public (Dev Only)

After starting containers, create and make public the `ribotflow` bucket:

```bash
docker exec ribotflow-dev-minio mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
docker exec ribotflow-dev-minio mc mb local/ribotflow
docker exec ribotflow-dev-minio mc anonymous set public local/ribotflow
```

> Production uses **Signed URLs** (temporary, secure). Dev uses public bucket for simplicity.

---

## File Storage Architecture

### Abstract Interface (`src/services/storage/`)

The app uses a **framework-agnostic `FileStorage` interface** with three implementations:

| Provider | File | When Used |
|----------|------|-----------|
| `LocalFileStorage` | `localStorage.ts` | Dev fallback (no MinIO configured) |
| `MinioStorage` | `minioStorage.ts` | **Self-Hosted** (`docker-compose.yml`) |
| `SupabaseStorage` | `supabaseStorage.ts` | **Cloud** (`NEXT_PUBLIC_APP_MODE=cloud`) |

**Factory selection logic (`src/services/storage/factory.ts`):**
- `STORAGE_PROVIDER=minio` → MinIO
- `STORAGE_PROVIDER=supabase` → Supabase
- Missing / `STORAGE_PROVIDER=local` → Local filesystem (`./uploads/`)

### What Each Service Does

- **Business logic** (attachments, signatures, PDFs) → calls `FileStorage.upload()` / `delete()`
- **Binary files** (images, videos, signatures, PDFs) → go to MinIO/Supabase/Local
- **Metadata** (filename, size, mime type, dimensions) → stored in PostgreSQL

### Storage Keys Human-Readable

**Pattern:** `{module}/{companyFolder}/{entityNumber}/{fileName}-{suffix}.{ext}`

- `module`: `sat`, `quotes`, `invoices` (prefix per organitzar bucket)
- `companyFolder`: Nom sanititzat de l'empresa (self-hosted) o UUID (cloud)
- `entityNumber`: `OT-2026-0001`, `PRES-2026-0001` (human-readable)

**Examples:**
```
sat/Empresa_Test/OT-2026-0001/foto_pantalla-a1b2c3d4.jpg
sat/Empresa_Test/OT-2026-0001-report-ca.pdf
sat/Empresa_Test/OT-2026-0001-signature.png
quotes/Empresa_Test/PRES-2026-0001-signature.png
```

---

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 24/05/2026 | Use proxy.ts instead of middleware.ts | Next.js 16 renamed middleware to proxy |
| 24/05/2026 | Client-side signIn for login/register | Server Action signIn cannot set browser cookies |
| 24/05/2026 | Remove authorized callback from auth config | Conflicts with auth() wrapper in proxy |
| 24/05/2026 | Remove custom cookie config | __Secure- prefix with secure:false breaks in dev |
| 24/05/2026 | Use /sat URLs (not /dashboard/sat) | Route groups don't add URL prefixes |
| 24/05/2026 | 10 work order statuses | Added scheduled, waiting_parts, waiting_client for realism |
| 25/05/2026 | DigitAIStudios as official demo account | Permanent test data with realistic scenarios |
| 25/05/2026 | Fixed db:setup script for Windows | Replaced `timeout` with Node.js sleep to avoid stdin redirect error |
| 25/05/2026 | Fixed DATABASE_URL port mismatch | Corrected `.env.local` from 5432 to 5433 to match docker-compose mapping |
| 25/05/2026 | Adopted versioned migrations for team dev | `db:generate` + `db:migrate` replaces `db:push` for safe team schema evolution |
| 25/05/2026 | Professional sidebar with sub-menus | Collapsible, responsive, theme/language toggle, multi-module navigation |
| 26/05/2026 | Sidebar navigation uses `<Link>` not `<a>` | **CRITICAL:** `<a href>` causes full page reload, recreating DOM and causing sidebar flash/reset. `<Link>` preserves sidebar state (SPA navigation). |
| 26/05/2026 | Product catalog per company | Materials can link to catalog products or be free-text. Enables inventory tracking. |
| 26/05/2026 | Local file storage for attachments | `uploads/sat/{companyId}/{workOrderId}/` folder served via `/api/uploads/[...path]`. Gitignored. Simple, no external dependencies. |
| 26/05/2026 | Attachment metadata stored in DB | File name, size, mime type, dimensions, isBefore flag, caption. Actual file stored on disk. |
| 26/05/2026 | FileStorage abstraction layer | `FileStorage` interface with `LocalFileStorage`, `MinioStorage`, `SupabaseStorage`. Factory selects provider via `STORAGE_PROVIDER` env. Clean Architecture: business logic never knows where files live. |
| 26/05/2026 | MinIO in dev docker-compose | `docker-compose.dev.yml` now includes MinIO (ports 9002 API, 9003 Console). All dev uploads go to real S3-compatible storage, not just local folders. |
| 26/05/2026 | Bucket public policy (dev only) | `mc anonymous set public local/ribotflow` via CLI. In production, use signed URLs. |
| 26/05/2026 | Generic `signatures` table | Replaced `work_order_signatures` with generic `signatures` (entity_type + entity_id). Reusable for work orders, quotes, invoices. Validation logic lives in Server Actions, not Service. |
| 26/05/2026 | `pdf-lib` for PDF generation | Pure JS (~1MB), no Chromium binary. Generates professional PDFs with branded header, tables, photo grid 2x2, embedded signature. Multi-language (ca/es/en). |
| 27/05/2026 | Category icon stored in DB `icon` column, not inferred from `slug` | `slug` is immutable identifier; `icon` is user-editable visual. All UI components use `category.icon ?? category.slug` fallback. Prevents icon changes from breaking when slug differs. |
| 27/05/2026 | Free status transitions (any → any) | Removed restrictive transition matrix. `VALID_STATUS_TRANSITIONS` in `src/lib/constants/statusTransitions.ts` allows all transitions. Simplifies workflow and avoids user frustration. |
| 27/05/2026 | Card overlay pattern for nested interactive elements | When a card needs to be clickable AND contain inner links (tel:/mailto:), use a `<div>` with an invisible absolute `<Link>` overlay (z-0) and elevate interactive children with z-10. Avoids "<a> cannot be descendant of <a>" hydration error. |
| 27/05/2026 | Kanban reads state via `itemsRef.current` in drag handlers | Prevents stale closures in React drag & drop. `useRef` stores latest state; event handlers read from ref instead of closure-captured state. |
| 27/05/2026 | Attachment upload: 2-step process (select → preview → confirm) | Uses `FileReader.readAsDataURL` for robust preview. Allows editing filename before upload. Eliminates checkbox "Abans" and caption input from upload form (moved to display layer). |
| 28/05/2026 | Quote module: 4 tables with PRE-{YYYY}-{SEQ} numbering | `quotes`, `quote_items`, `quote_templates`, `quote_status_history`. Multi-tenant with company_id. Status workflow: draft→sent→accepted/rejected. |
| 28/05/2026 | Quote transitions: draft→sent, sent→accepted/rejected, rejected→draft | Defined in `statusTransitions.ts` with `QuoteStatus` type and `isValidQuoteTransition()` function. |
| 28/05/2026 | Professional quote editor with split view | Editor left (company+client+items), PDF preview right (A4 simulation). Collapsible sections for better UX. |
| 28/05/2026 | Quote PDF preview: A4 simulation with inline styles | 210mm×297mm proportions, 20mm/15mm margins, gray background. Matches HTML template from user for professional look. |
| 28/05/2026 | Default values for quotes: 30 days, conditions, description | Constants ready for company settings. `DEFAULT_VALIDITY_DAYS`, `DEFAULT_DESCRIPTION`, `DEFAULT_CONDITIONS`. |
| 28/05/2026 | Intelligent units: integer for unit/pack, decimal for kg/m/h | `UNITS` array includes `step` field. Prevents floating point for items that should be integers. |
| 28/05/2026 | General discount at quote level | `discountPercent` field on quotes, calculated before IVA. Shows in green (#16a34a) in preview. |
| 28/05/2026 | Company data simulated in editor | `COMPANY_DATA` constant with DigitAIStudios info. Will come from DB when company settings implemented. |
| 28/05/2026 | Single toolbar: all actions in one top bar | Removed duplicate header and footer. Title + OT badge + view buttons + total + action buttons in one line. |
| 28/05/2026 | Quote edit saves all data (client, items, conditions) | quoteService.update now handles items (delete old + insert new). Initializes selectedClientId from existingQuote.clientId. |
| 28/05/2026 | Enviar button in edit mode | Shows only for draft quotes. Toast notification for feedback. |
| 28/05/2026 | Nova OT link in editor | Uses <Link> (same tab), not <a target='_blank'>. Proper flex sizing to prevent overflow. |
| 01/06/2026 | Email enviat des de pressupost | Server Action `sendQuoteEmailAction` + modal `SendQuoteEmailModal` + mètode `notificationService.sendQuoteEmail`. Pre-replega email del client. |
| 01/06/2026 | SMTP env key MUST be `SMTP_PASSWORD` | `.env.local` tenia `SMTP_PASS` (typo). El service no ho trobava i només feia `console.warn` — sense error visible a UI. Fixat a `.env.local` i propagat error al toast. Veure `docs/SMTP_SETUP.md`. |
| 01/06/2026 | sendEmailWithAttachment returns object with success/error | Abans retornava void i els errors quedaven només al log. Ara es mostren al toast de Sonner. |
| 01/06/2026 | Quote PDF generation with email attachment | Commit b10c3a0. Migracions 0008-0009 afegeixen `pdf_url`, `accepted_by`, `signature` a quotes; `tax_id` i `phone` a companies. Storage keys jeràrquiques (tenantSlug/clientSlug). Mètode `generateSignedQuotePdf` per a la signatura del client. Accions `acceptQuote` i `rejectQuote`. |
| 01/06/2026 | pdf-lib WinAnsi encoding bug fix | Helper `sanitizeForPdf` per netejar caràcters no suportats. Important per caràcters catalans/ciríl·lics. |
| 01/06/2026 | Refactor Fases 1-2 completades | Fases 1 (monolits >500) i 2 (reestructuració directoris) del REFACTOR_GUIDE.md estan fetes. Veure `docs/REFACTOR_GUIDE.md` per detalls. Resta: Fase 2.3 components/sat, Fase 2.4 actions/sat, Fase 3 pàgines grans. |
| 01/06/2026 | Refactor Fases 2.3-2.4 completades | `src/components/sat/` i `src/actions/sat/` ara tenen subcarpetes (quotes/, work-orders/, shared/ o clients/). S'han afegit shims `.tsx`/`.ts` de re-export per backward compat. Resta: Fase 3 (pàgines grans). |
| 01/06/2026 | NO usar shims de re-export | Els shims de backward compat són deute tècnic. Cal actualitzar tots els `import` als paths nous i esborrar els shims immediatament. Refs: commit `25ca0aa` (esborrats 54 shims) i `7c895a3` (esborrats 9 shims de serveis restants). Si un agent afegeix shims, és un anti-patró. |
| 01/06/2026 | Veredict pre-CI (`pnpm veredict`) | Nou script `scripts/veredict.ts` corre 6 health checks (arquitectura, obsolets, tests, secrets, config, imports). Integrat a `ci:check`. Qualsevol agent ha de córrer `pnpm veredict` abans de commit per veure què trenca. Refs: `a86ecf3`. |
| 01/06/2026 | Self-signed SMTP cert a casa | A xarxes domèstiques amb proxy/AV interceptant TLS, l'SMTP falla amb `self-signed certificate in certificate chain`. Solucions DEV ONLY: (A) `SMTP_TLS_REJECT_UNAUTHORIZED=false` a `.env.local` (recomanada, scoped); (B) `NODE_TLS_REJECT_UNAUTHORIZED=0` (Node-level, global). Cal REINICIAR el dev server. El codi (`notificationService`) té log diagnòstic de la config SMTP per identificar si la var s'està llegint. Refs: `3396448`, sessió debug SMTP. |
| 01/06/2026 | **Principi Zero-Fricció per a l'empresa final** | L'usuari prioritza que les empreses configurin el **menys possible**. Cada variable/env var extra és una porta a errors. Direcció: modelar l'empresa com a entitat de primer nivell amb configuració via UI, no pas env vars globals. **Self-hosted**: admin configura 1 cop a la UI. **Cloud**: cada tenant la seva config. Això ja era la direcció correcta pel multi-tenancy, però ara és també un principi d'UX. |
| 01/06/2026 | **Direcció Empresa-com-a-Entitat (SMTP config per company)** | Cada empresa tindrà la seva config de correu (no env vars globals). **MVP aquesta sessió**: schema ampliat (`companies.email`, `address_*`, `default_tax_rate`, `quote_prefix`) + taula `smtp_configs` (1:1) amb `password_encrypted` (AES-256-GCM) + encryption utility + `smtpConfigService` + `notificationService` llegeix per `companyId` amb fallback a env + UI `/settings/email` amb botó "Test connection" i checkbox "Accept self-signed". **Fase 2**: `/settings/general`, `/settings/branding`, `/settings/numbering`, IMAP, plantilles PDF per empresa. |
| 08/06/2026 | **NotificationService: sendInvitationEmail added** | Nova funció `sendInvitationEmail()` que utilitza `invitationTemplate` (HTML amb botó "Acceptar invitació"). Resol SMTP de l'empresa via `resolveSmtpConfig(companyId)`. cridada per `inviteUserAction` en mode cloud. |
| 08/06/2026 | **Auth.js v5: JWT strategy obrigatori per a Credentials** | La strategy "database" provoca `UnsupportedStrategy` amb CredentialsProvider. Canvi a JWT (commit 4a8b029). Session callback valida role des de DB a cada petició — si canvia, invalida sessió. Inserció manual de fila a `sessions` al jwt callback per la UI de sessions actives. |
| 08/06/2026 | **LoginForm: try/catch + result?.url fallback** | NextAuth v5 beta pot retornar `result.url` sense `result.ok=true`. Afegit try/catch/finally i check de `result?.url` com a fallback. Si signIn llença error, l'usuari veu feedback en lloc de quedar-se "pending". |
| 08/06/2026 | **RBAC complet: roles, permissions, can(), proxy, PermissionGuard** | Matriu de permisos centralitzada (src/lib/auth/permissions.ts). `can(role, permission)` substitueix comparacions directes de role. Proxy (proxy.ts) filtra rutes amb `canSeePath()`. SidebarNav oculta mòduls segons permissions. PermissionGuard per pàgines. Camp: TECHNICIAN veu `/sat/field`, ADMIN no. |
| 08/06/2026 | **Invitation email system complet** | Template HTML d'invitació (`emailTemplates.ts`), `sendInvitationEmail()` a `notificationService`, `inviteUserAction` envia email en mode cloud. En mode dev mostra l'URL directament. Toast + auto-close al formulari. |
| 08/06/2026 | **ADMIN loses email:read** | L'E2E guide diu que ADMIN NO hauria de veure Email/SMTP (és OWNER-only). Corregit a `permissions.ts` i actualitzats 3 fitxers de test. |
| 08/06/2026 | **canSeePath: workorder:read:all implies own** | `/sat` i `/access` accepten `workorder:read:all` com a `workorder:read:own`, però `/sat/field` i `/sat/work-orders` segueixen sent només per TECHNICIAN. |
| 08/06/2026 | **acceptInvitation i18n: must be top-level in sat.json** | Les claus `acceptInvitation` i `field` estaven nidificades dins de `settings` al JSON, però els components busquen `sat.acceptInvitation.*` (nivell superior). Causava `MISSING_MESSAGE` error. Corregit a ca/es. |
| 08/06/2026 | **Team dropdown z-index + overflow** | El dropdown dels 3 punts (TeamRow) tenia `z-10` i era tallat per `overflow-hidden` del contenidor (TeamTable). Canviat a `z-50` i `overflow-visible`. |

---

## 🔴 CRITICAL BUG: Sidebar Flash on Navigation

### The Problem
When navigating between pages via the sidebar, the sidebar would "flash":
- Closed sidebar would briefly appear open then snap closed
- Open sub-menus would appear to re-open
- Active selection would jump around

### Root Cause
**The sidebar navigation used `<a href="...">` instead of Next.js `<Link>`.**

`<a href>` triggers a **full browser page reload** (HTTP request + new DOM). This destroys and recreates the entire React tree, including the sidebar. The `useEffect` hydration then reads `localStorage` and restores state, but the user sees the flash.

### Why It Took So Long to Find
Multiple agents (including this one) investigated the wrong causes:
1. **localStorage persistence** — assumed state was lost between pages
2. **`usePathname` re-renders** — thought pathname changes were resetting state
3. **`isExpanded` local state** — moved it to global `SidebarContext` (helpful but not the root cause)
4. **CSS transitions** — disabled all animations thinking that was the issue

**The real fix was trivial:** replace `<a>` with `<Link>` from `next/link`. Nothing else needed to change.

### Lesson Learned
> **Always verify the navigation mechanism first.** If a React component "resets" on every page change, check if you're using `<a>` instead of `<Link>` before touching state management, localStorage, or context.

### Files Changed
- `src/components/layout/SidebarNav.tsx` — all `<a>` → `<Link>`
- `src/components/layout/Sidebar.tsx` — header logo `<a>` → `<Link>`

---

## Session Handoff — Last Update: 08/06/2026

### What Was Done (Office Session 08/06)
1. **Diagnòstic login** — He provat el flux complet CSRF → signIn → JWT → dashboard. El backend funciona correctament. El LoginForm tenia manca d'error handling.
2. **LoginForm millorat** — Afegit try/catch/finally + check `result?.url` com a fallback per NextAuth v5 beta.
3. **SidebarNav.test.tsx corregit** — Import `vi` afegit de vitest, tipus `undefined` corregit al helper.
4. **Migracions BD** — Totes les 14 migracions ja aplicades, cap pendent.
5. **393 tests passen**, tsc net, build correcte.

### What Was Done (Home Session 06/06 - already merged)
1. **RBAC complet** — Permissions matrix + can() + canSeePath() + PermissionGuard
2. **Team page** — `/settings/team` amb invitacions i gestió d'usuaris
3. **Profile page** — `/settings/profile` amb avatar, tema, idioma, sessions actives
4. **Auth refactor** — JWT strategy (revert from database), role validation in session callback
5. **Field view** — `/sat/field` per a tècnics (mobile-first)
6. **Accept invitation** — `/accept-invitation` page pubblica

### Architecture Notes
- **SMTP config**: BD primer → fallback a env vars → error clar. Cache 5min, invalidat a save/delete.
- **acceptSelfSigned** = `rejectUnauthorized: false` (exactament `SMTP_TLS_REJECT_UNAUTHORIZED=false`)
- **next-intl format ICU**: Usa `{var}` no `{{var}}`. Doble clau = MALFORMED_ARGUMENT error.
- **Form feedback**: `saveStatus` (idle/saving/success/error) + `saveError` per feedback inline sense toast.

### Next Steps
1. **Vista pública del client** — Enllaç sense login per acceptar/rebutjar pressupostos
2. **Edició de Clients** (`/sat/clients/[id]/edit`)
3. **PWA Offline** per a tècnics
4. **Billing/Facturació** — Generació de factures des d'OTs completades

### Quick Commands for Next Session
```bash
# 1. Start everything
pnpm db:up && pnpm db:migrate

# 2. Seed demo (if needed)
pnpm db:seed:demo

# 3. Make MinIO public (if fresh container)
docker exec ribotflow-dev-minio mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
docker exec ribotflow-dev-minio mc mb local/ribotflow
docker exec ribotflow-dev-minio mc anonymous set public local/ribotflow

# 4. Verify tests
pnpm test

# 5. Start dev (AFTER editing .env.local — see docs/SMTP_SETUP.md)
pnpm dev
```

---

## Protocol de Sincronitzacio de Maquina (Machine Sync)

> **Usa aquest protocol QUAN:** Arribes a una maquina nova, despres de fer `git pull` des de casa, o si un altre agent ha modificat l'esquema de la BD.

### 1. Verifica l'Estat de les Migracions a la BD Local

**Abans de res, comprova si la taula de control existeix i esta completa:**

```bash
# Quantes migracions te registrades la BD?
docker exec ribotflow-dev-db psql -U postgres -d ribotflow -c \
  "SELECT COUNT(*) FROM drizzle.__drizzle_migrations;"
```

- Si retorna **10** → Tot correcte. Ves al pas 3.
- Si retorna **0, 3 o qualsevol altre numero** → La taula de control esta malmesa. Ves al pas 2.

### 2. Reconstruccio de la Taula de Control (NOMES si esta malmesa)

**Per que passa aixo?** Si la BD es va crear amb `db:push`, amb seed scripts, o si un altre ordinador va aplicar migracions manualment sense deixar rastre, la taula `drizzle.__drizzle_migrations` queda desfasada o buida. Aixo fa que `db:migrate` intenti reaplicar migracions antigues i falli amb `relation already exists`.

**Solucio:** Reconstrueix la taula i la omple amb els hashos correctes (SHA256 dels fitxers `.sql` + `folderMillis` del `_journal.json`):

```bash
# 1. Asegura't que el schema drizzle existeix
docker exec ribotflow-dev-db psql -U postgres -d ribotflow -c \
  "CREATE SCHEMA IF NOT EXISTS drizzle;"

# 2. Esborra i recrea la taula
docker exec ribotflow-dev-db psql -U postgres -d ribotflow -c \
  "DROP TABLE IF EXISTS drizzle.__drizzle_migrations; CREATE TABLE drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint);"

# 3. Omple-la amb totes les migracions existents (fins a 0009)
docker exec -i ribotflow-dev-db psql -U postgres -d ribotflow <<'EOF'
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
('fcdcd77092d11243d9d7867e6af494173f2dbb170810d9041d2d26e92d863109', 1779695842140),
('0090c35dfb363cce7685b9090008255925aa73dc39564db663e936c72cd5c530', 1779774463806),
('3669f5a4f59a9e3ca6bf3a0ade64f31115d3e7a2d07e3b036d8e1f19105ec32d', 1779792706330),
('51edefe1cfb98cb820ea4c53e40a66fbbf7287304fbb5aa34ebb3fe1d69b3e76', 1779818638878),
('5aac13ef107d95da1be7a687843a204ca0bd5403e162c4c331964bda5dd76c17', 1779859659031),
('72ee099e2a1e4221fc1b2a2ede4935901efc14badbcd8623eb2badf635ddc6a7', 1780119794106),
('5e031d37f05f63d326a607e206b68b3e48ba0a82bb2c8d4a1f51fa7e84e3dda6', 1780210872331),
('6dc5e378d28e98987f5bc2a0a7f56461ed0a39a2825a5d4f77b6b81916916ae0', 1780211515060),
('placeholder_hash_0008', 1780302060810),
('placeholder_hash_0009', 1780303715364);
EOF
```

> **Nota per agents:** Aquests hashos es calculen amb `SHA256(contingut del .sql)` en minuscules i el `created_at` ve de `_journal.json`. Si apareixen noves migracions (0008, 0009...), aquesta llista s'ha d'ampliar.

### 3. Aplicar Migracions Pendents

```bash
pnpm db:migrate
```

Ara hauria de dir: `[✓] migrations applied successfully!` sense errors.

### 4. Verificar Esquema

```bash
# Hauria de sortir 18 taules (incloent quotes, quote_items, quote_templates, quote_status_history)
docker exec ribotflow-dev-db psql -U postgres -d ribotflow -c "\dt"
```

### 5. Seed de Dades Demo (si cal)

```bash
pnpm db:seed:demo
```

### 6. Verificar Tests

```bash
pnpm test
```

Haurien de passar **116 tests**.

---

## For Future Agents

When you start working on this project:

1. **Read this file first** (you're doing great!)
2. **Save critical decisions to your local memory** (Engram, notes, etc.)
3. **Check the branch:** Should be `features/sat-work-orders`
4. **Start PostgreSQL + MinIO:** `pnpm db:up` (starts both containers)
5. **Sincronitza la BD:** Segueix el **Protocol de Sincronitzacio de Maquina** dalt (especialment si veus `relation already exists` o falten columnes/taules).
6. **Seed demo data:** `pnpm db:seed:demo`
7. **Configure `.env.local`** with MinIO variables (see Environment Variables section above)
8. **Make MinIO bucket public:**
   ```bash
   docker exec ribotflow-dev-minio mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
   docker exec ribotflow-dev-minio mc mb local/ribotflow
   docker exec ribotflow-dev-minio mc anonymous set public local/ribotflow
   ```
9. **Run tests:** `pnpm test` (ensure 116 tests pass)
10. **Start dev server:** `pnpm dev`
11. **Login with:** dais@test.com / 12345678
12. **IMPORTANT:** Auth uses JWT strategy (not database). If you see `UnsupportedStrategy`, check `src/lib/auth/index.ts` has `session: { strategy: "jwt" }`.

### Current Module Status (June 2026)
- **SAT (Work Orders):** ✅ Complete — CRUD, 3 views (Grid/Table/Kanban), filters, pagination
- **Pressupostos (Quotes):** ✅ Complete — CRUD, editor professional, preview A4, vinculació OT, PDF signat + email amb adjunt, accept/reject
- **Clients:** ✅ Complete — List, detail, create (edit pending)
- **Categories:** ✅ Complete — CRUD with icon/color picker
- **Geolocalització:** ✅ Complete — Check-in GPS, mapa Leaflet, routing engine
- **Facturació:** ✅ Complete — Travel billing service
- **Notificacions:** ✅ Complete — Email amb per-company DB config + 5min cache + fallback a env vars
- **SMTP Settings:** ✅ Complete — `/settings/email` amb presets, test connection, AES-256-GCM, i18n ca/es
- **Refactor Fases 1-3:** ✅ Completades — Monolits dividits, schema per entitat, serveis amb subdominis, components/pàgines dividits, SMTP settings redissenyat
- **RBAC:** ✅ Complet — Roles + permissions matrix + can() + canSeePath() + PermissionGuard + SidebarNav filtrat per rol
- **Team Management:** ✅ Complet — `/settings/team` amb invitacions, canvi de rol, activar/desactivar usuaris, última activitat
- **Profile Settings:** ✅ Complet — `/settings/profile` amb avatar, nom, password, tema, idioma, sessions actives
- **Company Settings:** ✅ Complet — `/settings/company` amb dades fiscals, logo, preferències
- **Auth:** ✅ Complet — JWT strategy, proxy amb RBAC, LoginForm millorat, accept-invitation page

> **Tip for agents:** If you see `[Storage] Environment variables missing for provider 
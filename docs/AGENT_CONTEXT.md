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
**Branch:** `features/sat-work-orders` (active development)

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
- [x] Database schema (9 tables: clients, categories, work_orders, status_history, materials, attachments, **signatures**, locations, **products**)
- [x] Work order service with status workflow transitions
- [x] Material service with product catalog + free-text materials
- [x] Attachment service with local file storage
- [x] **Signature service** (generic `signatures` table for work_order/quote/invoice)
- [x] **PDF generation service** (`pdf-lib`, multi-language ca/es/en, branded design)
- [x] Product service (company catalog with SKU, unitPrice, unitCost, stock)
- [x] Server Actions: createWorkOrder, updateStatus, assignTechnician, addMaterial, removeMaterial, getProducts, addAttachment, deleteAttachment, **saveSignature**, **generatePdf**, **deletePdf**
- [x] UI pages: List (`/sat`), Detail (`/sat/[id]`), Create (`/sat/new`)
- [x] Client components: WorkOrderForm, WorkOrderActions, TechnicianAssigner, MaterialList, AttachmentSection, **SignatureCanvas**, **PdfGenerator**
- [x] i18n translations (ca/es) for all SAT strings including materials, attachments, signatures, PDF
- [x] Auto-number generation: `OT-{YYYY}-{SEQ}` per company
- [x] Technician assignment with RBAC guard
- [x] Status history tracking
- [x] Materials management UI (catalog selector + free-text + quantity + totals)
- [x] Attachments/photos UI (upload with preview, before/after checkbox, caption, grid, lightbox, delete)
- [x] **Digital signature UI** (canvas with mouse/touch, SVG + PNG export, name input, only visible when status is `completed` or `closed`)
- [x] **PDF generation UI** (language selector ca/es/en, generate/download/regenerate/delete buttons)
- [x] FileStorage abstraction (`LocalFileStorage`, `MinioStorage`, `SupabaseStorage`) with factory pattern
- [x] Local file storage API (`/api/uploads/[...path]`) with mime type detection and security

### Work Order Statuses (All Implemented)
| Status | Catalan | Spanish | Transitions |
|--------|---------|---------|-------------|
| pending | Pendent | Pendiente | → assigned, scheduled, cancelled |
| assigned | Assignada | Asignada | → in_progress, cancelled |
| scheduled | Programada | Programada | → in_progress, cancelled |
| in_progress | En curs | En curso | → paused, completed, cancelled, waiting_parts, waiting_client |
| paused | Pausada | Pausada | → in_progress, cancelled |
| completed | Completada | Completada | → closed, in_progress |
| closed | Tancada | Cerrada | (final) |
| cancelled | Cancel·lada | Cancelada | → pending |
| waiting_parts | Esperant peces | Esperando piezas | → in_progress, cancelled |
| waiting_client | Esperant client | Esperando cliente | → in_progress, cancelled |

### Pending / Next Features (Priority Order)
1. **Geolocalització i Check-in GPS** (`work_order_locations` table exists, no UI)
   - Botó "Check-in" que valida distància <100m de l'adreça del client
   - Mapa incrustat (Leaflet / MapLibre)
   - Enllaç extern a Google Maps / Waze
   
2. **Vista Kanban** per a oficina (`/sat?view=kanban`)
   - Columnes: Pendent, Assignada, En Curs, Completada
   - Drag & drop per a canviar estat (només ADMIN/OFFICE)

3. **Mòdul Pressupostos i Albaranes** (Fase 2G)
   - Esquemes `quotes`, `quote_items`, reutilitzar `signatures` genèrica
   - Conversió quote → work_order → invoice
   - PDF de pressupost amb `pdf-lib`

4. **Personalització de PDF i Company Settings** (Fase 2H)
   - Mòdul de configuració d'empresa (logo, colors, text legal)
   - `PdfBuilder` dinàmic amb branding per empresa

5. **Mode PWA Offline** per a tècnics
   - Service Worker per treballar sense connexió
   - Sincronització en background quan recupera WiFi

6. **Email notifications** on status changes
7. **Calendar integration** for scheduled dates

---

## Testing

- **Framework:** Vitest
- **Coverage target:** 80% minimum
- **Integration tests:** Use real PostgreSQL (Docker must be running)
- **Test DB seed:** `tests/db-seed.ts` creates test company + user + categories + client
- **Run tests:** `pnpm test`
- **Full CI check:** `pnpm ci:check` (typecheck + lint + format + test + build)

**Current Test Count:** 60 tests passing across 10 test files

| Test File | Tests | Description |
|-----------|-------|-------------|
| `crypto.test.ts` | 5 | Password hashing (bcryptjs) |
| `authorize.test.ts` | 3 | RBAC role checks |
| `auth.test.ts` | 4 | Registration, login, company creation |
| `workOrderService.test.ts` | 7 | CRUD + status workflow + security |
| `materialService.test.ts` | 6 | Materials CRUD + catalog + free-text + security |
| `attachmentService.test.ts` | 6 | Attachments CRUD + metadata + security |
| `signatureService.test.ts` | 6 | Signature save/update/get/remove + multi-tenant security |
| `DashboardShell.test.tsx` | 3 | Layout rendering |
| `SidebarContext.test.tsx` | 9 | Sidebar state management |
| `SidebarNav.test.tsx` | 11 | Navigation rendering + active states |

**WARNING:** Running tests creates temporary users in the database. To clean up:
```bash
# Option A: Full reset (use with caution!)
# Delete all users except DigitAIStudios, then re-seed

# Option B: Accept extra test users (they don't affect functionality)
```

---

## Known Issues & Solutions

### Issue: "Couldn't find next-intl config file"
**Solution:** `i18n.ts` must be at project root (not in src/). Configured in `next.config.ts` with `createNextIntlPlugin()`.

### Issue: Login redirects after successful signIn
**Root Cause:** `auth()` without request context cannot read browser cookies. Must use `auth((req) => { ... })` wrapper.
**Solution Applied:** See proxy.ts pattern above.

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

---

## File Structure Quick Reference

```
src/
  app/(dashboard)/         # Route group (no URL prefix)
    layout.tsx              # Dashboard layout with Sidebar + Shell
    dashboard/page.tsx      # Home dashboard template
    sat/page.tsx            # List orders → URL: /sat
    sat/[id]/page.tsx       # Order detail → URL: /sat/:id
    sat/new/page.tsx        # Create order → URL: /sat/new
    api/uploads/[...path]/route.ts  # Local file serving API
  components/layout/        # Layout Components
    SidebarContext.tsx      # React context for sidebar state
    Sidebar.tsx             # Main sidebar (collapsible, responsive)
    SidebarNav.tsx          # Navigation with sub-menus
    SidebarFooter.tsx       # Theme, language, logout
    DashboardShell.tsx      # Content wrapper that adapts to sidebar
  actions/sat/             # Server Actions
    createWorkOrder.ts
    updateStatus.ts
    assignTechnician.ts
    addMaterial.ts
    removeMaterial.ts
    getProducts.ts
    addAttachment.ts
    deleteAttachment.ts
    saveSignature.ts        # Save digital signature (SVG + PNG)
    generatePdf.ts          # Generate PDF report
    deletePdf.ts            # Delete generated PDF
  components/sat/           # Client Components
    WorkOrderForm.tsx
    WorkOrderActions.tsx
    TechnicianAssigner.tsx
    MaterialList.tsx        # Product catalog + free-text materials
    AttachmentSection.tsx   # Upload + grid + lightbox
    SignatureCanvas.tsx     # Canvas for digital signature (mouse/touch)
    PdfGenerator.tsx        # Generate/download/regenerate/delete PDF
  services/sat/             # Business Logic
    workOrderService.ts
    materialService.ts
    productService.ts
    attachmentService.ts
    signatureService.ts     # Generic signature CRUD + storage
    pdfService.ts           # PdfBuilder class + PdfService
  services/storage/         # File Storage Abstraction
    interface.ts            # FileStorage contract
    factory.ts              # Provider selector (local/minio/supabase)
    localStorage.ts         # Local filesystem implementation
    minioStorage.ts         # MinIO (S3-compatible) implementation
    supabaseStorage.ts      # Supabase Storage implementation
    index.ts                # Re-exports
  lib/utils/storageKeys.ts  # Human-readable storage key builders
  lib/auth/index.ts         # NextAuth config (NO authorized callback!)
  proxy.ts                  # Auth proxy (SINGLE source of truth)
  db/schema/sat.ts          # Database schema (9 tables)
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

## For Future Agents

When you start working on this project:

1. **Read this file first** (you're doing great!)
2. **Save critical decisions to your local memory** (Engram, notes, etc.)
3. **Check the branch:** Should be `features/sat-work-orders`
4. **Start PostgreSQL + MinIO:** `pnpm db:up` (starts both containers)
5. **Apply pending migrations:** `pnpm db:migrate`
   - If `__drizzle_migrations` table is missing, apply manually: `cat src/db/migrations/000X_*.sql | docker exec -i ribotflow-dev-db psql -U postgres -d ribotflow`
6. **Seed demo data:** `pnpm db:seed:demo`
7. **Configure `.env.local`** with MinIO variables (see Environment Variables section above)
8. **Make MinIO bucket public:**
   ```bash
   docker exec ribotflow-dev-minio mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
   docker exec ribotflow-dev-minio mc mb local/ribotflow
   docker exec ribotflow-dev-minio mc anonymous set public local/ribotflow
   ```
9. **Run tests:** `pnpm test` (ensure 60 tests pass)
10. **Start dev server:** `pnpm dev`
11. **Login with:** dais@test.com / 12345678

> **Tip for agents:** If you see `[Storage] Environment variables missing for provider 
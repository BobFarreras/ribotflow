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
- [x] Server Actions: createWorkOrder, updateStatus, assignTechnician, addMaterial, removeMaterial, getProducts, addAttachment, deleteAttachment, saveSignature, generatePdf, deletePdf, createCategory, updateCategory, createClient, **createQuote**, **updateQuote**, **deleteQuote**, **updateQuoteStatus**, **addQuoteItem**, **updateQuoteItem**, **removeQuoteItem**, **createQuoteTemplate**, **updateQuoteTemplate**, **deleteQuoteTemplate**, **duplicateQuoteTemplate**
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
- [x] Notification service (email SMTP with lazy nodemailer import)
- [x] Category CRUD with visual icon picker (~12 SVG icons) and color picker
- [x] Client CRUD (list, detail, create)
- [x] Category icon propagation — `icon` field flows from DB → Service → all 6 UI components
- [x] **Quote professional editor** with split view (editor + PDF preview)
- [x] **Quote PDF preview** simulating A4 document with professional layout
- [x] **Quote default values** (30 days validity, conditions, work description)
- [x] **Quote collapsible sections** in editor for better UX
- [x] **Quote integration with OT detail** — shows quotes list in OT detail page

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
1. **PDF attachment to quote email** — Currently sends HTML only. Need to generate a real PDF and attach it.
2. **Vista pública del client** — Enllaç sense login perquè el client pugui acceptar/rebutjar
3. **Edició de Clients** (`/sat/clients/[id]/edit`)
4. **Personalització de PDF i Company Settings** (logo, colors, text legal, tarifa desplaçament)
5. **Mode PWA Offline** per a tècnics
6. **Email notifications on status changes** for work orders
7. **Calendar integration** for scheduled dates

> ⚠️ **SMTP Setup** — See `docs/SMTP_SETUP.md`. The system reads `SMTP_PASSWORD` (NOT `SMTP_PASS`). If env vars are missing, errors now show in the UI toast, not just server logs.

---

## Testing

- **Framework:** Vitest
- **Coverage target:** 80% minimum
- **Integration tests:** Use real PostgreSQL (Docker must be running)
- **Test DB seed:** `tests/db-seed.ts` creates test company + user + categories + client
- **Run tests:** `pnpm test`
- **Full CI check:** `pnpm ci:check` (typecheck + lint + format + test + build)

**Current Test Count:** 78 tests passing across 13 test files

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
    checkIn.ts              # GPS check-in with distance validation
    createCategory.ts       # Create work order category
    updateCategory.ts       # Update work order category
    createClient.ts         # Create SAT client
    createQuote.ts          # Create quote with items
    updateQuote.ts          # Update quote (draft only)
    deleteQuote.ts          # Delete quote (draft only)
    updateQuoteStatus.ts    # Change quote status with validation
    addQuoteItem.ts         # Add line item to quote
    updateQuoteItem.ts      # Update quote line item
    removeQuoteItem.ts      # Remove line item from quote
    createQuoteTemplate.ts  # Create quote template
    updateQuoteTemplate.ts  # Update quote template
    deleteQuoteTemplate.ts  # Delete quote template
    duplicateQuoteTemplate.ts # Duplicate quote template
  components/sat/           # Client Components
    WorkOrderForm.tsx
    WorkOrderActions.tsx
    TechnicianAssigner.tsx
    MaterialList.tsx        # Product catalog + free-text materials (stepper +/-)
    AttachmentSection.tsx   # Upload 2-step (preview → confirm) + grid
    SignatureCanvas.tsx     # Canvas for digital signature (mouse/touch)
    PdfGenerator.tsx        # Generate/download/regenerate/delete PDF
    CheckInButton.tsx       # GPS check-in with distance validation
    WorkOrderFilters.tsx    # Unified filter bar (one row)
    WorkOrderList.tsx       # View wrapper: filters + pagination + switcher
    WorkOrderCard.tsx       # Grid card with category icon + distance
    WorkOrderTable.tsx      # Sortable table view
    WorkOrderKanban.tsx     # Drag & drop board with horizontal panning
    WorkOrderStatusBadge.tsx # Dot indicator badge (Linear/Attio style)
    WorkOrderPriorityBadge.tsx # Dot + text (no background)
    CategoryIcon.tsx        # SVG icon picker (~12 icons, reusable)
    AddressAutocomplete.tsx # Nominatim geocoding autocomplete
    GoogleMapsLink.tsx      # External Google Maps link with coords
    MapView.tsx             # Leaflet map with category icons
    TravelCostCard.tsx      # Distance, time, cost display
    StatusHistorySection.tsx # Audit log timeline
    Pagination.tsx          # Page size + page number controls
    QuoteEditor.tsx         # Professional editor with split view + collapsible sections
    QuotePdfPreview.tsx     # A4 PDF simulation with professional layout
    QuoteList.tsx           # Quote list with filters
    QuoteStatusBadge.tsx    # Quote status badge with colors
    QuoteItemTable.tsx      # Quote items display table
    QuoteActions.tsx        # Quote status change buttons
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
    notificationService.ts  # Email SMTP with lazy nodemailer import
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

## Session Handoff — Last Update: 01/06/2026

### What Was Done Today
1. **Mòdul Pressupostos complet** — 4 taules + migracions 0005-0007
2. **3 Serveis CRUD** — quoteService, quoteItemService, quoteTemplateService
3. **11 Server Actions** — CRUD de pressupostos, items, plantilles
4. **Editor professional** — Split view (editor + preview A4), seccions col·lapsables
5. **Pàgina edit** — `/sat/quotes/[id]` reutilitza el mateix editor
6. **Vinculació OT** — Selector + botó "Nova OT"
7. **Enviament per email (HTML)** — Server Action `sendQuoteEmailAction` + modal `SendQuoteEmailModal` + mètode `notificationService.sendQuoteEmail`. Pre-replega email del client.
8. **Fix SMTP env var** — `.env.local` tenia `SMTP_PASS` (typo), ara `SMTP_PASSWORD`. La funció `sendEmailWithAttachment` retorna `{success, error?}` i els errors es mostren al toast (no només al log).
9. **Doc nova** — `docs/SMTP_SETUP.md` amb la configuració completa

### Next Task for Next Agent
1. **PDF attachment to quote email** — Generate real PDF and attach it to the email
2. **Vista pública del client** — Enllaç sense login perquè el client pugui acceptar/rebutjar
3. **Configuració d'empresa** — Logo, colors, text legal, tarifa desplaçament

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

- Si retorna **8** → Tot correcte. Ves al pas 3.
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

# 3. Omple-la amb totes les migracions existents (fins a 0007)
docker exec -i ribotflow-dev-db psql -U postgres -d ribotflow <<'EOF'
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
('fcdcd77092d11243d9d7867e6af494173f2dbb170810d9041d2d26e92d863109', 1779695842140),
('3b84a91bea8a8f6a9343a3a0cbcd791955b55b3324e8e1587f379a779d137fef', 1779774463806),
('ef928ac98a630e4355a24602a9b33dbe3f546a2a3b56867ea864e492ac21b79a', 1779792706330),
('b67de1692bdf8844511d236d23ad072a5243d661c9c34d47ebf63844f37ff677', 1779818638878),
('bbfa55db3628ccc525110380c7c6c7e2127ff3d6c4aef9b9350a7a37c7dfa7d4', 1779859659031),
('72e0a849a48a9625d7ffd7e0599aa49beaf0b9f9df4d505c53da58736fd43a37', 1780119794106),
('8d043230560f9da17a31facde76d96577da55ae017a94656802c730e687d64d0', 1780210872331),
('6dc5e378d28e98987f5bc2a0a7f56461ed0a39a2825a5d4f77b6b81916916ae0', 1780211515060);
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

Haurien de passar **78 tests**.

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
9. **Run tests:** `pnpm test` (ensure 78 tests pass)
10. **Start dev server:** `pnpm dev`
11. **Login with:** dais@test.com / 12345678

### Current Module Status (June 2026)
- **SAT (Work Orders):** ✅ Complete — CRUD, 3 views (Grid/Table/Kanban), filters, pagination
- **Pressupostos (Quotes):** ✅ Complete — CRUD, editor professional, preview A4, vinculació OT
- **Clients:** ✅ Complete — List, detail, create (edit pending)
- **Categories:** ✅ Complete — CRUD with icon/color picker
- **Geolocalització:** ✅ Complete — Check-in GPS, mapa Leaflet, routing engine
- **Facturació:** ✅ Complete — Travel billing service
- **Notificacions:** ✅ Complete — Email service (nodemailer lazy import)
- **Facturació de clients:** 🔲 Pending — proper mòdul a implementar

> **Tip for agents:** If you see `[Storage] Environment variables missing for provider 
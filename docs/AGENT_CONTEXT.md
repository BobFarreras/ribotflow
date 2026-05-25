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
- **12 work orders:** Various statuses (pending, scheduled, in_progress, paused, completed, closed, cancelled, waiting_parts)

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
- [x] Database schema (8 tables: clients, categories, work_orders, status_history, materials, attachments, signatures, locations)
- [x] Work order service with status workflow transitions
- [x] Server Actions: createWorkOrder, updateStatus, assignTechnician
- [x] UI pages: List (`/sat`), Detail (`/sat/[id]`), Create (`/sat/new`)
- [x] Client components: WorkOrderForm, WorkOrderActions, TechnicianAssigner
- [x] i18n translations (ca/es) for all SAT strings
- [x] Auto-number generation: `OT-{YYYY}-{SEQ}` per company
- [x] Technician assignment with RBAC guard
- [x] Status history tracking

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

### Pending / Next Features
- [ ] Materials management (work_order_materials table exists, no UI)
- [ ] Attachments/photos (work_order_attachments table exists, no UI)
- [ ] Digital signature (work_order_signatures table exists, no UI)
- [ ] Geolocation tracking (work_order_locations table exists, no UI)
- [ ] PWA offline mode for technicians
- [ ] Email notifications on status changes
- [ ] Calendar integration for scheduled dates

---

## Testing

- **Framework:** Vitest
- **Coverage target:** 80% minimum
- **Integration tests:** Use real PostgreSQL (Docker must be running)
- **Test DB seed:** `tests/db-seed.ts` creates test company + user + categories + client
- **Run tests:** `pnpm test`
- **Full CI check:** `pnpm ci:check` (typecheck + lint + format + test + build)

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
  components/sat/           # Client Components
    WorkOrderForm.tsx
    WorkOrderActions.tsx
    TechnicianAssigner.tsx
  services/sat/             # Business Logic
    workOrderService.ts
  lib/auth/index.ts         # NextAuth config (NO authorized callback!)
  proxy.ts                  # Auth proxy (SINGLE source of truth)
  db/schema/sat.ts          # Database schema
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

---

## For Future Agents

When you start working on this project:

1. **Read this file first** (you're doing great!)
2. **Save critical decisions to your local memory** (Engram, notes, etc.)
3. **Check the branch:** Should be `features/sat-work-orders`
4. **Start PostgreSQL:** `pnpm db:setup`
5. **Seed demo data:** `pnpm db:seed:demo`
6. **Run tests:** `pnpm test` (ensure 19 tests pass)
7. **Start dev server:** `pnpm dev`
8. **Login with:** dais@test.com / 12345678

If any of the above fails, check the Known Issues section above, or ask the user for clarification.

**Remember:** This project uses English for code, Catalan/Spanish for UI, and Spanish for team documentation (AGENTS.md, this file).

**Privacy note:** Do not import/export Engram memories from this project to other projects or vice versa. Each project's context should remain isolated.

---

*Last updated: 25/05/2026 by Agent OpenCode (kimi-k2.6) — Added professional sidebar, fixed db:setup script, .env.local port, adopted versioned migrations*
*Context stored in: docs/AGENT_CONTEXT.md (this file)*

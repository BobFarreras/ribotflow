# [SKILL:DB_ARCHITECT]

## Context d'Activació
Aquesta skill es desperta quan es requereix: disseny d'esquemes de base de dades, migracions, optimització de consultes, estratègies de multi-tenancy, o qualsevol operació amb Drizzle ORM i PostgreSQL.

## 🗄️ Stack de Base de Dades
- **Motor:** PostgreSQL 16+
- **ORM:** Drizzle ORM (type-safe, SQL-like, zero overhead)
- **Migracions:** `drizzle-kit generate` + `drizzle-kit migrate`
- **Pooling:** PgBouncer en producció (Cloud), connexió directa en desenvolupament

## 🏢 Multi-Tenancy (Logical Separation)
- **Estratègia:** Columna `company_id` a TOTES les taules de negoci
- **Cloud:** Multi-tenant, totes les empreses comparteixen la mateixa DB
- **Self-Hosted:** Single-tenant, una única empresa per instància (mateix codi, mateix filtre)
- **Regla d'Or:** Cap Server Action ni ruta API pot executar una consulta sense `where(eq(table.companyId, session.user.companyId))`

## 📐 Esquema Base (`/src/db/schema/`)
```
auth.ts          → companies, users, sessions, accounts
sat.ts           → workOrders, tickets, signatures, routeOptimizations
erp.ts           → products, stock, warehouses, lots, serialNumbers
billing.ts       → invoices, budgets, quotes, verifactu_records
crm.ts           → contacts, leads, opportunities, communications
access.ts        → clockEntries, absences, geolocations
integrations.ts  → calendarSync, emailSync, driveSync
```

## 🔗 Relacions i Constraints
- **Foreign Keys:** Sempre amb `onDelete: "cascade"` per a dades dependents
- **UUIDs:** `defaultRandom()` com a primary key per defecte
- **Timestamps:** `createdAt` i `updatedAt` a totes les taules
- **Índexs:** `company_id` sempre indexat per rendiment de filtrat multi-tenant

## 🔄 Migracions
- **Nom de fitxer:** `0001_create_companies.ts`, `0002_create_users.ts`, etc.
- **Ruta:** `/src/db/migrations/`
- **Comandes:**
  - `pnpm db:generate` → genera migracions des de l'esquema
  - `pnpm db:migrate` → aplica migracions pendents
  - `pnpm db:studio` → obre Drizzle Studio per inspecció visual

## 📊 Tipus de Dades Específics
- **Diners:** `numeric(10, 2)` mai `float` o `double`
- **Hashos:** `text` per a SHA-256 (Veri*factu chaining)
- **JSON:** `jsonb` per a dades flexibles (custom fields, metadata)
- **Enums:** `$type<"VALUE1" | "VALUE2">()` de Drizzle per a tipat segur

## ⚠️ Regles Crítiques
1. **Mai** text hardcoded a les taules per a estats o categories → usar claus de traducció
2. **Mai** consultar dades sense filtre de `company_id` en entorn Cloud
3. **Sempre** usar transaccions per a operacions que modifiquin múltiples taules
4. **Sempre** indexar columnes de filtrat freqüent (status, dates, company_id)

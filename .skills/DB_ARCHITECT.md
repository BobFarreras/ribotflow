# [SKILL:DB_ARCHITECT]

## Contexto de Activación
Esta skill se despierta cuando se requiere: diseño de esquemas de base de datos, migraciones, optimización de consultas, estrategias de multi-tenancy, o cualquier operación con Drizzle ORM y PostgreSQL.

## 🗄️ Stack de Base de Datos
- **Motor:** PostgreSQL 16+
- **ORM:** Drizzle ORM (type-safe, SQL-like, zero overhead)
- **Migraciones:** `drizzle-kit generate` + `drizzle-kit migrate`
- **Pooling:** PgBouncer en producción (Cloud), conexión directa en desarrollo

## 🏢 Multi-Tenancy (Separación Lógica)
- **Estrategia:** Columna `company_id` en TODAS las tablas de negocio
- **Cloud:** Multi-tenant, todas las empresas comparten la misma DB
- **Self-Hosted:** Single-tenant, una única empresa por instancia (mismo código, mismo filtro)
- **Regla de Oro:** Ninguna Server Action ni ruta API puede ejecutar una consulta sin `where(eq(table.companyId, session.user.companyId))`

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

## 🔗 Relaciones y Constraints
- **Foreign Keys:** Siempre con `onDelete: "cascade"` para datos dependientes
- **UUIDs:** `defaultRandom()` como primary key por defecto
- **Timestamps:** `createdAt` y `updatedAt` en todas las tablas
- **Índices:** `company_id` siempre indexado para rendimiento de filtrado multi-tenant

## 🔄 Migraciones
- **Nombre de archivo:** `0001_create_companies.ts`, `0002_create_users.ts`, etc.
- **Ruta:** `/src/db/migrations/`
- **Comandos:**
  - `pnpm db:generate` → genera migraciones desde el esquema
  - `pnpm db:migrate` → aplica migraciones pendientes
  - `pnpm db:studio` → abre Drizzle Studio para inspección visual

## 📊 Tipos de Datos Específicos
- **Dinero:** `numeric(10, 2)` nunca `float` o `double`
- **Hashes:** `text` para SHA-256 (Veri*factu chaining)
- **JSON:** `jsonb` para datos flexibles (custom fields, metadata)
- **Enums:** `$type<"VALUE1" | "VALUE2">()` de Drizzle para tipado seguro

## ⚠️ Reglas Críticas
1. **Nunca** texto hardcoded en las tablas para estados o categorías → usar claves de traducción
2. **Nunca** consultar datos sin filtro de `company_id` en entorno Cloud
3. **Siempre** usar transacciones para operaciones que modifiquen múltiples tablas
4. **Siempre** indexar columnas de filtrado frecuente (status, fechas, company_id)

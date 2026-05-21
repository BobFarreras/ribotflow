# AUTH.md - Autenticación, Multi-Tenancy y Control de Roles (RBAC)

## 🏢 1. ¿Cómo sabe cada usuario a qué empresa entra en el Cloud?

Para que sea profesional, eficiente y fácil de mantener, utilizaremos la estrategia de **Multi-tenancy por identificador de columna** (Separación Lógica). Todo se guarda en la misma base de datos central, pero los datos están totalmente blindados de una empresa a otra.

### Esquema de Tablas Base (PostgreSQL vía Drizzle ORM)

```typescript
/**
 * Creation/modification date: 21/05/2026
 * Path: src/db/schema/auth.ts
 * Description: Relational data schema for Multi-tenancy and Roles (RBAC) control.
 */

import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

// 1. La tabla maestra de empresas
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  tenantSlug: text("tenant_slug").notNull().unique(), // ej: "fusteria-marcel"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. La tabla de usuarios (Trabajadores, jefes, admins)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").$type<"OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE">().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Flujo de Entrada (Login)

**En el Cloud:** Cuando un usuario va a `app.ribotflow.com/login` e introduce su correo y contraseña, Auth.js valida las credenciales en el servidor. El sistema busca al usuario en la base de datos e inyecta el `companyId` y el `role` dentro de su sesión encriptada (JWT).

A partir de ese momento, cada vez que el usuario navega o solicita datos, el servidor de Next.js lee la sesión e inyecta automáticamente un filtro invisible:

```typescript
where(eq(tickets.companyId, session.user.companyId))
```

> **Resultado:** El usuario nunca puede ver datos de otras empresas porque el código del servidor impide físicamente que se realicen consultas sin su identificador de empresa.

---

## 🐋 2. ¿Cómo se traslada esto al contenedor Docker (Self-Hosted)?

Aquí viene la magia de la separación de responsabilidades. Cuando el cliente instala el contenedor Docker en su propia VPS:

1. Al arrancar el ERP por primera vez, el sistema detecta que `NEXT_PUBLIC_APP_MODE=self_hosted`
2. La aplicación muestra una **pantalla de configuración inicial** donde el cliente escribe el nombre de su empresa y el correo del super-administrador (Owner)
3. El sistema crea una **única fila** en la tabla `companies` y el primer usuario con rol `OWNER`
4. Como el contenedor corre en su VPS, su base de datos solo tendrá sus datos
5. La lógica de código **no cambia**: filtra por `companyId`, pero solo hay un único ID de empresa

---

## 🔑 3. El Sistema de Roles (RBAC) en la Práctica

Una vez el usuario ha entrado en la app (Cloud o VPS), Next.js utiliza el campo `role` de la sesión para activar o desactivar permisos.

### Matriz de Roles

| Rol | Permisos |
|-----|----------|
| 👑 **OWNER** | Acceso absoluto. Facturación, licencias, todos los módulos, configuración de agentes IA |
| 💼 **ADMIN** | Clientes, ERP, CRM, Veri*factu, Calendario Command Center. No puede cambiar suscripción ni borrar empresa |
| 🔧 **TECHNICIAN** | Solo módulo SAT (órdenes asignadas) + Control de Acceso (fichar). No ve facturación, CRM ni stock ajeno |
| 📋 **OFFICE** | Administrativo: facturación básica, clientes, calendario. No acceso a configuración avanzada ni SAT de campo |

### Ejemplo de Protección de Pantalla (Next.js)

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BillingDashboard() {
  const session = await auth();

  // Si el técnico intenta entrar a facturación por URL, lo echamos
  if (!session || (session.user.role !== "OWNER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard/unauthorized");
  }

  return (
    <div>
      <h1>Panel de Facturación y Veri*factu</h1>
      {/* Contenido protegido */}
    </div>
  );
}
```

---

## 📝 Resumen de Arquitectura

| Concepto | Implementación |
|----------|----------------|
| **Multi-tenancy Cloud** | Lógico vía `company_id` en todas las tablas |
| **Multi-tenancy Self-Hosted** | Mismo código, 1 sola empresa en la DB |
| **Autenticación** | Auth.js v5 con JWT firmado |
| **Sesiones** | Cookie `httpOnly`, `secure`, `sameSite: "lax"` |
| **Roles** | `OWNER`, `ADMIN`, `TECHNICIAN`, `OFFICE` |
| **Filtro DB** | Obligatorio `company_id` en todas las consultas |

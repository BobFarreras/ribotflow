# AUTH.md - Autenticació, Multi-Tenancy i Control de Rols (RBAC)

## 🏢 1. Com sap cada usuari a quina empresa entra al Cloud?

Perquè sigui professional, eficient i fàcil de mantenir, utilitzarem l'estratègia de **Multi-tenancy per identificador de columna** (Logical Separation). Tot es guarda a la mateixa base de dades central, però les dades estan totalment blindades d'una empresa a una altra.

### Esquema de Taules Base (PostgreSQL via Drizzle ORM)

```typescript
/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/db/schema/auth.ts
 * Descripció: Esquema de dades relacional per al control de Multi-tenancy i Rols (RBAC).
 */

import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

// 1. La taula mestra d'empreses
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  tenantSlug: text("tenant_slug").notNull().unique(), // ex: "fusteria-marcel"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. La taula d'usuaris (Treballadors, caps, admins)
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

### Flux d'Entrada (Login)

**Al Cloud:** Quan un usuari va a `app.ribotflow.com/login` i posa el seu correu i contrasenya, Auth.js valida les credencials al servidor. El sistema busca l'usuari a la base de dades i injecta el `companyId` i el `role` dins de la seva sessió encriptada (JWT).

A partir d'aquell moment, cada vegada que l'usuari navega o demana dades, el servidor de Next.js llegeix la sessió i injecta automàticament un filtre invisible:

```typescript
where(eq(tickets.companyId, session.user.companyId))
```

> **Resultat:** L'usuari mai pot veure dades d'altres empreses perquè el codi del servidor impedeix físicament que es facin consultes sense el seu identificador d'empresa.

---

## 🐋 2. Com es trasllada això al contenidor Docker (Self-Hosted)?

Aquí ve la màgia de la separació de responsabilitats. Quan el client instal·la el contenidor Docker a la seva pròpia VPS:

1. En arrancar l'ERP per primera vegada, el sistema detecta que `NEXT_PUBLIC_APP_MODE=self_hosted`
2. L'aplicació mostra una **pantalla de configuració inicial** on el client escriu el nom de la seva empresa i el correu del super-administrador (Owner)
3. El sistema crea una **única fila** a la taula `companies` i el primer usuari amb rol `OWNER`
4. Com que el contenidor corre a la seva VPS, la seva base de dades només tindrà les seves dades
5. La lògica de codi **no canvia**: filtra per `companyId`, però només hi ha un sol ID d'empresa

---

## 🔑 3. El Sistema de Rols (RBAC) a la Pràctica

Un cop l'usuari ha entrat a l'app (Cloud o VPS), Next.js utilitza el camp `role` de la sessió per activar o desactivar permisos.

### Matriu de Rols

| Rol | Permisos |
|-----|----------|
| 👑 **OWNER** | Accés absolut. Facturació, llicències, tots els mòduls, configuració d'agents IA |
| 💼 **ADMIN** | Clients, ERP, CRM, Veri*factu, Calendari Command Center. No pot canviar subscripció ni esborrar empresa |
| 🔧 **TECHNICIAN** | Només mòdul SAT (ordres assignades) + Control d'Accés (fitxar). No veu facturació, CRM ni estoc aliè |
| 📋 **OFFICE** | Facturació bàsica, clients, calendari. No accés a configuració avançada ni SAT de camp |

### Exemple de Protecció de Pantalla (Next.js)

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BillingDashboard() {
  const session = await auth();

  // Si el tècnic intenta entrar a facturació per URL, el fem fora
  if (!session || (session.user.role !== "OWNER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard/unauthorized");
  }

  return (
    <div>
      <h1>Tauler de Facturació i Veri*factu</h1>
      {/* Contingut protegit */}
    </div>
  );
}
```

---

## 📝 Resum d'Arquitectura

| Concepte | Implementació |
|----------|---------------|
| **Multi-tenancy Cloud** | Lògic via `company_id` a totes les taules |
| **Multi-tenancy Self-Hosted** | Mateix codi, 1 sola empresa a la DB |
| **Autenticació** | Auth.js v5 amb JWT signat |
| **Sessions** | Cookie `httpOnly`, `secure`, `sameSite: "lax"` |
| **Rols** | `OWNER`, `ADMIN`, `TECHNICIAN`, `OFFICE` |
| **Filtre DB** | Obligatori `company_id` a totes les consultes |

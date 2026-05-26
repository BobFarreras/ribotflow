/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: tests/db-seed.ts
 * Descripció: Script de seed per a la base de dades de test.
 *              Crea empresa, usuari OWNER, categories SAT i client de prova.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/db";
import { companies, users } from "@/db/schema/auth";
import { clients, workOrderCategories } from "@/db/schema/sat";
import { hashPassword } from "@/lib/utils/crypto";
import { eq } from "drizzle-orm";

const TEST_COMPANY_SLUG = "test-empresa";
const TEST_EMAIL = "test@ribotflow.local";

export async function seedTestDatabase() {
  console.log("🌱 Seeding test database...");

  // 1. Create or get test company
  let [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.tenantSlug, TEST_COMPANY_SLUG))
    .limit(1);

  if (!company) {
    [company] = await db
      .insert(companies)
      .values({
        name: "Empresa de Test",
        tenantSlug: TEST_COMPANY_SLUG,
        plan: "free",
      })
      .returning();
    console.log(`   Created company: ${company.name} (${company.id})`);
  } else {
    console.log(`   Reusing company: ${company.name} (${company.id})`);
  }

  // 2. Create or get test user (OWNER)
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);

  if (!user) {
    const passwordHash = await hashPassword("TestP@ss123");
    [user] = await db
      .insert(users)
      .values({
        companyId: company.id,
        email: TEST_EMAIL,
        passwordHash,
        name: "Usuari de Test",
        role: "OWNER",
      })
      .returning();
    console.log(`   Created user: ${user.name} (${user.id})`);
  } else {
    console.log(`   Reusing user: ${user.name} (${user.id})`);
  }

  // 3. Create default SAT categories
  const existingCategories = await db
    .select()
    .from(workOrderCategories)
    .where(eq(workOrderCategories.companyId, company.id));

  if (existingCategories.length === 0) {
    await db.insert(workOrderCategories).values([
      {
        companyId: company.id,
        name: "Reparació",
        slug: "repair",
        color: "#ef4444",
        icon: "Wrench",
        isDefault: true,
        sortOrder: 0,
      },
      {
        companyId: company.id,
        name: "Manteniment",
        slug: "maintenance",
        color: "#3b82f6",
        icon: "ClipboardCheck",
        isDefault: false,
        sortOrder: 1,
      },
      {
        companyId: company.id,
        name: "Instal·lació",
        slug: "installation",
        color: "#22c55e",
        icon: "Package",
        isDefault: false,
        sortOrder: 2,
      },
      {
        companyId: company.id,
        name: "Muntatge",
        slug: "assembly",
        color: "#f59e0b",
        icon: "Hammer",
        isDefault: false,
        sortOrder: 3,
      },
      {
        companyId: company.id,
        name: "Revisió",
        slug: "inspection",
        color: "#8b5cf6",
        icon: "Search",
        isDefault: false,
        sortOrder: 4,
      },
    ]);
    console.log(`   Created 5 work order categories`);
  } else {
    console.log(`   Reusing ${existingCategories.length} categories`);
  }

  // 4. Create test client
  let [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.companyId, company.id))
    .limit(1);

  if (!client) {
    [client] = await db
      .insert(clients)
      .values({
        companyId: company.id,
        name: "Client de Prova",
        email: "client@prova.local",
        phone: "+34 600 000 000",
        address: "Carrer de Prova, 123, Barcelona",
        location: { lat: 41.3851, lng: 2.1734 },
        taxId: "B12345678",
      })
      .returning();
    console.log(`   Created client: ${client.name} (${client.id})`);
  } else {
    console.log(`   Reusing client: ${client.name} (${client.id})`);
  }

  console.log("✅ Seed complete!");
  console.log(`   Company ID: ${company.id}`);
  console.log(`   User ID:    ${user.id}`);
  console.log(`   Client ID:  ${client.id}`);

  return { company, user, client };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}

/**
 * Creation/modification date: 24/05/2026
 * Path: scripts/seed-demo.ts
 * Description: Demo data seeder for DigitAIStudios company with realistic work orders.
 */

import { db } from "../src/db";
import { companies, users } from "../src/db/schema/auth";
import {
  clients,
  workOrderCategories,
  workOrders,
  workOrderStatusHistory,
} from "../src/db/schema/sat";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "../src/lib/utils/crypto";

async function seedDemo() {
  console.log("🌱 Seeding demo data for DigitAIStudios...\n");

  // 1. Create or find company
  let company = await db
    .select()
    .from(companies)
    .where(eq(companies.tenantSlug, "ditaistudios"))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!company) {
    [company] = await db
      .insert(companies)
      .values({
        name: "DigitAIStudios",
        tenantSlug: "ditaistudios",
        plan: "plus",
      })
      .returning();
    console.log(`✅ Created company: ${company.name} (${company.id})`);
  } else {
    console.log(`♻️  Reusing company: ${company.name} (${company.id})`);
  }

  const companyId = company.id;

  // 2. Create or find user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, "dais@test.com"))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!user) {
    const passwordHash = await hashPassword("12345678");
    [user] = await db
      .insert(users)
      .values({
        companyId,
        email: "dais@test.com",
        passwordHash,
        name: "Adrià",
        role: "OWNER",
      })
      .returning();
    console.log(`✅ Created user: ${user.name} (${user.email})`);
  } else {
    console.log(`♻️  Reusing user: ${user.name} (${user.email})`);
  }

  const userId = user.id;

  // 3. Seed categories
  const defaultCategories = [
    { name: "Reparació", slug: "repair", color: "#ef4444", isDefault: true },
    { name: "Manteniment", slug: "maintenance", color: "#3b82f6", isDefault: false },
    { name: "Instal·lació", slug: "installation", color: "#10b981", isDefault: false },
    { name: "Muntatge", slug: "assembly", color: "#f59e0b", isDefault: false },
    { name: "Revisió", slug: "inspection", color: "#8b5cf6", isDefault: false },
  ];

  const existingCategories = await db
    .select()
    .from(workOrderCategories)
    .where(eq(workOrderCategories.companyId, companyId));

  if (existingCategories.length === 0) {
    await db.insert(workOrderCategories).values(
      defaultCategories.map((c, i) => ({
        companyId,
        name: c.name,
        slug: c.slug,
        color: c.color,
        isDefault: c.isDefault,
        sortOrder: i,
      }))
    );
    console.log(`✅ Created ${defaultCategories.length} work order categories`);
  } else {
    console.log(`♻️  Reusing ${existingCategories.length} categories`);
  }

  const categoryList = await db
    .select()
    .from(workOrderCategories)
    .where(eq(workOrderCategories.companyId, companyId));

  // 4. Seed clients
  const demoClients = [
    { name: "Restaurant La Taula", email: "contact@lataula.cat", phone: "933112233", address: "Carrer Major 45, Barcelona" },
    { name: "Gimnàs FitPro", email: "info@fitpro.es", phone: "934445566", address: "Avinguda Diagonal 220, Barcelona" },
    { name: "Clínica Dental Smile", email: "hola@smiledental.cat", phone: "935556677", address: "Carrer Aragó 88, Barcelona" },
    { name: "Hotel Marina", email: "recepcio@hotelmarina.com", phone: "936667788", address: "Passeig Marítim 12, Castelldefels" },
    { name: "Escola Creativa", email: "direccio@escolacreativa.cat", phone: "937778899", address: "Carrer València 156, Barcelona" },
    { name: "Supermercat Fresc", email: "admin@superfresc.es", phone: "938889900", address: "Carrer Sants 77, Barcelona" },
    { name: "Oficines Nexus", email: "contacte@oficinesnexus.com", phone: "931234567", address: "Gran Via 340, Barcelona" },
    { name: "Taller Mecànic Ràpid", email: "taller@mecanicrapid.cat", phone: "932345678", address: "Carrer Industria 12, Hospitalet" },
  ];

  const existingClients = await db
    .select()
    .from(clients)
    .where(eq(clients.companyId, companyId));

  if (existingClients.length === 0) {
    await db.insert(clients).values(
      demoClients.map((c) => ({ companyId, ...c }))
    );
    console.log(`✅ Created ${demoClients.length} clients`);
  } else {
    console.log(`♻️  Reusing ${existingClients.length} clients`);
  }

  const clientList = await db
    .select()
    .from(clients)
    .where(eq(clients.companyId, companyId));

  // 5. Seed work orders with realistic data
  const demoOrders = [
    {
      clientIdx: 0,
      categoryIdx: 0,
      title: "Reparació aire condicionat sala principal",
      description: "L'aire condicionat de la sala principal no refreda prou. Possible falta de gas o compressor defectuós.",
      priority: "urgent" as const,
      status: "in_progress" as const,
      scheduledDate: new Date(Date.now() + 86400000),
      estimatedDurationMinutes: 120,
    },
    {
      clientIdx: 1,
      categoryIdx: 1,
      title: "Manteniment mensual màquines de cardio",
      description: "Revisió i lubricació de cintes de córrer i bicicletes estàtiques. Canviar filtres d'aire.",
      priority: "medium" as const,
      status: "scheduled" as const,
      scheduledDate: new Date(Date.now() + 172800000),
      estimatedDurationMinutes: 180,
    },
    {
      clientIdx: 2,
      categoryIdx: 0,
      title: "Reparació porta d'accés clínica",
      description: "La porta automàtica d'accés no s'obre correctament. Sensor de moviment possiblement descalibrat.",
      priority: "high" as const,
      status: "pending" as const,
      scheduledDate: new Date(Date.now() + 43200000),
      estimatedDurationMinutes: 90,
    },
    {
      clientIdx: 3,
      categoryIdx: 2,
      title: "Instal·lació sistema de clau electrònica habitacions 201-210",
      description: "Substituir panys tradicionals per panys electrònics amb targeta NFC. Programar accessos per recepció.",
      priority: "medium" as const,
      status: "in_progress" as const,
      scheduledDate: new Date(Date.now() + 259200000),
      estimatedDurationMinutes: 360,
    },
    {
      clientIdx: 4,
      categoryIdx: 3,
      title: "Muntatge mobiliari nova aula de música",
      description: "Muntar taules, cadires i prestatgeries a la nova aula de música. Instal·lar suports per instruments.",
      priority: "low" as const,
      status: "completed" as const,
      scheduledDate: new Date(Date.now() - 86400000),
      estimatedDurationMinutes: 240,
    },
    {
      clientIdx: 5,
      categoryIdx: 1,
      title: "Revisió cameras de seguretat i alarmes",
      description: "Revisar funcionament de les 12 càmeres de seguretat. Comprovar connexió amb central d'alarmes.",
      priority: "high" as const,
      status: "waiting_parts" as const,
      scheduledDate: new Date(Date.now() + 64800000),
      estimatedDurationMinutes: 150,
    },
    {
      clientIdx: 6,
      categoryIdx: 4,
      title: "Revisió trimestral instal·lació elèctrica",
      description: "Inspecció de quadres elèctrics, diferencials i preses. Verificar terra i proteccions.",
      priority: "medium" as const,
      status: "scheduled" as const,
      scheduledDate: new Date(Date.now() + 345600000),
      estimatedDurationMinutes: 120,
    },
    {
      clientIdx: 7,
      categoryIdx: 0,
      title: "Reparació elevador de vehicles tallers",
      description: "L'elevador de 3 tones fa soroll estrany en pujar. Revisar bomba hidràulica i seguretat.",
      priority: "urgent" as const,
      status: "in_progress" as const,
      scheduledDate: new Date(Date.now() + 21600000),
      estimatedDurationMinutes: 180,
    },
    {
      clientIdx: 0,
      categoryIdx: 2,
      title: "Instal·lació sistema de ventilació cuina",
      description: "Instal·lar extractor nou amb filtres de carbó per a cuina industrial. Dimensionar canalització.",
      priority: "high" as const,
      status: "paused" as const,
      scheduledDate: new Date(Date.now() + 518400000),
      estimatedDurationMinutes: 480,
    },
    {
      clientIdx: 3,
      categoryIdx: 1,
      title: "Manteniment piscina i jacuzzi",
      description: "Revisar bombes de filtració, sistema de cloració i calefacció de jacuzzi. Netejar skimmers.",
      priority: "low" as const,
      status: "cancelled" as const,
      scheduledDate: new Date(Date.now() + 129600000),
      estimatedDurationMinutes: 120,
    },
    {
      clientIdx: 2,
      categoryIdx: 3,
      title: "Muntatge cadires espera nova sala",
      description: "Muntar 20 cadires i 4 taules a la nova sala d'espera. Instal·lar punt de càrrega USB.",
      priority: "medium" as const,
      status: "completed" as const,
      scheduledDate: new Date(Date.now() - 172800000),
      estimatedDurationMinutes: 180,
    },
    {
      clientIdx: 5,
      categoryIdx: 4,
      title: "Revisió anual extintors i pla d'emergència",
      description: "Revisar els 8 extintors del centre comercial. Actualitzar senyalització i pla d'evacuació.",
      priority: "medium" as const,
      status: "closed" as const,
      scheduledDate: new Date(Date.now() - 259200000),
      estimatedDurationMinutes: 120,
    },
  ];

  const existingOrders = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.companyId, companyId));

  if (existingOrders.length === 0) {
    const year = new Date().getFullYear();
    let sequence = 1;

    for (const orderData of demoOrders) {
      const number = `OT-${year}-${String(sequence).padStart(4, "0")}`;
      const client = clientList[orderData.clientIdx];
      const category = categoryList[orderData.categoryIdx];

      const [workOrder] = await db
        .insert(workOrders)
        .values({
          companyId,
          clientId: client.id,
          categoryId: category.id,
          createdBy: userId,
          number,
          title: orderData.title,
          description: orderData.description,
          status: orderData.status,
          priority: orderData.priority,
          scheduledDate: orderData.scheduledDate,
          estimatedDurationMinutes: orderData.estimatedDurationMinutes,
          startedAt: orderData.status === "in_progress" || orderData.status === "completed" || orderData.status === "closed" ? new Date() : null,
          completedAt: orderData.status === "completed" || orderData.status === "closed" ? new Date(Date.now() + 7200000) : null,
          closedAt: orderData.status === "closed" ? new Date(Date.now() + 86400000) : null,
          actualDurationMinutes: orderData.status === "completed" || orderData.status === "closed" ? 120 : null,
        })
        .returning();

      // Add status history
      await db.insert(workOrderStatusHistory).values({
        workOrderId: workOrder.id,
        statusFrom: null,
        statusTo: "pending",
        changedBy: userId,
        reason: "Work order created",
      });

      if (orderData.status !== "pending") {
        await db.insert(workOrderStatusHistory).values({
          workOrderId: workOrder.id,
          statusFrom: "pending",
          statusTo: orderData.status,
          changedBy: userId,
          reason: `Status changed to ${orderData.status}`,
        });
      }

      sequence++;
    }

    console.log(`✅ Created ${demoOrders.length} work orders`);
  } else {
    console.log(`♻️  Reusing ${existingOrders.length} work orders`);
  }

  console.log("\n🎉 Demo seed complete!");
  console.log(`   Login with: dais@test.com / 12345678`);
  console.log(`   Company: DigitAIStudios`);
  console.log(`   ${clientList.length} clients, ${demoOrders.length} work orders ready`);
}

seedDemo().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

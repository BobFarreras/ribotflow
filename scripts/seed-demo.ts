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
  products,
} from "../src/db/schema/sat";
import { eq } from "drizzle-orm";
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
        companyAddress: "Carrer Nou 15, La Bisbal d'Empordà",
        companyLocation: { lat: 41.96011156891511, lng: 3.0391116346094664 },
        travelRatePerKm: "0.40",
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

  // 4. Seed products (demo catalog)
  const demoProducts = [
    { name: "Cable elèctric H07RN-F 3x2.5mm", sku: "CAB-001", unitPrice: 3.5, unitCost: 1.8, stock: 150 },
    { name: "Disjuntor magnetotèrmic 16A", sku: "DIS-016", unitPrice: 12.9, unitCost: 6.5, stock: 45 },
    { name: "Tomada industrial 32A 3P+N+T", sku: "TOM-32A", unitPrice: 28.5, unitCost: 14.2, stock: 20 },
    { name: "Tub PVC rigit Ø32mm (3m)", sku: "TUB-032", unitPrice: 4.2, unitCost: 2.1, stock: 200 },
    { name: "Caixa de derivació estanca IP65", sku: "CAJ-IP65", unitPrice: 8.75, unitCost: 4.3, stock: 60 },
    { name: "Font d'alimentació LED 24V 100W", sku: "FON-24V", unitPrice: 35.0, unitCost: 18.5, stock: 12 },
    { name: "Règim luminós LED panel 60x60", sku: "PAN-6060", unitPrice: 45.9, unitCost: 22.0, stock: 8 },
    { name: "Interruptor horari digital", sku: "INT-HOR", unitPrice: 22.0, unitCost: 11.5, stock: 25 },
    { name: "Sonda de temperatura PT100", sku: "SON-PT100", unitPrice: 18.5, unitCost: 9.2, stock: 15 },
    { name: "Relé de nivell per cisterna", sku: "REL-NIV", unitPrice: 32.0, unitCost: 16.0, stock: 10 },
  ];

  const existingProducts = await db
    .select()
    .from(products)
    .where(eq(products.companyId, companyId));

  if (existingProducts.length === 0) {
    await db.insert(products).values(
      demoProducts.map((p) => ({
        companyId,
        name: p.name,
        sku: p.sku,
        unitPrice: String(p.unitPrice),
        unitCost: String(p.unitCost),
        stock: p.stock,
      }))
    );
    console.log(`✅ Created ${demoProducts.length} demo products`);
  } else {
    console.log(`♻️  Reusing ${existingProducts.length} products`);
  }

  // 5. Seed clients
  const demoClients = [
    { name: "Restaurant El Terrall", email: "info@elterrall.cat", phone: "972642100", address: "Carrer Major 28, La Bisbal d'Empordà", location: { lat: 41.9598, lng: 3.0378 } },
    { name: "Hotel Museum", email: "recepcio@hotelmuseum.cat", phone: "972642312", address: "Plaça Major 1, La Bisbal d'Empordà", location: { lat: 41.9591, lng: 3.0402 } },
    { name: "Escola Pia", email: "secretaria@escolapia.cat", phone: "972642455", address: "Carrer de l'Església 12, La Bisbal d'Empordà", location: { lat: 41.9605, lng: 3.0385 } },
    { name: "Can Roura - Ferreteria", email: "info@canroura.cat", phone: "972642678", address: "Avinguda de Francesc Macià 45, La Bisbal d'Empordà", location: { lat: 41.9572, lng: 3.0421 } },
    { name: "Supermercat Esclat", email: "bisbal@esclat.cat", phone: "972642789", address: "Carrer de la Mercè 8, La Bisbal d'Empordà", location: { lat: 41.9612, lng: 3.0365 } },
    { name: "Gimnàs Olymp", email: "contacte@gimnasolymp.cat", phone: "972642901", address: "Polígon Industrial, Parcel·la 12, La Bisbal d'Empordà", location: { lat: 41.9555, lng: 3.0445 } },
    { name: "Clínica Dental Bisbal", email: "hola@dentalbisbal.cat", phone: "972643012", address: "Carrer de Santa Margarida 6, La Bisbal d'Empordà", location: { lat: 41.9585, lng: 3.0398 } },
    { name: "Taller Mecànic Romagosa", email: "taller@romagosa.cat", phone: "972643123", address: "Carretera de Girona 15, La Bisbal d'Empordà", location: { lat: 41.9568, lng: 3.0412 } },
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
      assignedTo: true,
      scheduledDate: new Date(Date.now() + 86400000),
      estimatedDurationMinutes: 120,
    },
    {
      clientIdx: 1,
      categoryIdx: 1,
      title: "Manteniment mensual màquines de cardio",
      description: "Revisió i lubricació de cintes de córrer i bicicletes estàtiques. Canviar filtres d'aire.",
      priority: "medium" as const,
      status: "assigned" as const,
      assignedTo: true,
      scheduledDate: new Date(Date.now() + 172800000),
      estimatedDurationMinutes: 180,
    },
    {
      clientIdx: 2,
      categoryIdx: 0,
      title: "Reparació porta d'accés clínica",
      description: "La porta automàtica d'accés no s'obre correctament. Sensor de moviment possiblement descalibrat.",
      priority: "high" as const,
      status: "assigned" as const,
      assignedTo: true,
      scheduledDate: new Date(Date.now() + 43200000),
      estimatedDurationMinutes: 90,
    },
    {
      clientIdx: 3,
      categoryIdx: 2,
      title: "Instal·lació sistema de clau electrònica habitacions 201-210",
      description: "Substituir panys tradicionals per panys electrònics amb targeta NFC. Programar accessos per recepció.",
      priority: "medium" as const,
      status: "assigned" as const,
      assignedTo: true,
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
      status: "assigned" as const,
      assignedTo: true,
      scheduledDate: new Date(Date.now() + 64800000),
      estimatedDurationMinutes: 150,
    },
    {
      clientIdx: 6,
      categoryIdx: 4,
      title: "Revisió trimestral instal·lació elèctrica",
      description: "Inspecció de quadres elèctrics, diferencials i preses. Verificar terra i proteccions.",
      priority: "medium" as const,
      status: "assigned" as const,
      assignedTo: true,
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
      assignedTo: true,
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
      assignedTo: true,
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
          assignedTo: orderData.assignedTo ? userId : null,
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

      if ((orderData.status as string) !== "pending") {
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

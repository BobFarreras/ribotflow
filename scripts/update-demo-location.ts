/**
 * Data de creació/modificació: 27/05/2026
 * Ruta: scripts/update-demo-location.ts
 * Descripció: Actualitza la seu i els clients de demo a La Bisbal d'Empordà.
 */

import { db } from "../src/db";
import { companies } from "../src/db/schema/auth";
import { clients } from "../src/db/schema/sat";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔄 Updating demo locations to La Bisbal d'Empordà...\n");

  // Update company HQ
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.tenantSlug, "ditaistudios"))
    .limit(1);

  if (company) {
    await db
      .update(companies)
      .set({
        companyAddress: "Carrer Nou 15, La Bisbal d'Empordà",
        companyLocation: { lat: 41.96011156891511, lng: 3.0391116346094664 },
        travelRatePerKm: "0.40",
      })
      .where(eq(companies.id, company.id));
    console.log("✅ Updated company HQ to Carrer Nou 15, La Bisbal d'Empordà");
  }

  // Update clients
  const clientUpdates = [
    { name: "Restaurant El Terrall", address: "Carrer Major 28, La Bisbal d'Empordà", location: { lat: 41.9598, lng: 3.0378 } },
    { name: "Hotel Museum", address: "Plaça Major 1, La Bisbal d'Empordà", location: { lat: 41.9591, lng: 3.0402 } },
    { name: "Escola Pia", address: "Carrer de l'Església 12, La Bisbal d'Empordà", location: { lat: 41.9605, lng: 3.0385 } },
    { name: "Can Roura - Ferreteria", address: "Avinguda de Francesc Macià 45, La Bisbal d'Empordà", location: { lat: 41.9572, lng: 3.0421 } },
    { name: "Supermercat Esclat", address: "Carrer de la Mercè 8, La Bisbal d'Empordà", location: { lat: 41.9612, lng: 3.0365 } },
    { name: "Gimnàs Olymp", address: "Polígon Industrial, Parcel·la 12, La Bisbal d'Empordà", location: { lat: 41.9555, lng: 3.0445 } },
    { name: "Clínica Dental Bisbal", address: "Carrer de Santa Margarida 6, La Bisbal d'Empordà", location: { lat: 41.9585, lng: 3.0398 } },
    { name: "Taller Mecànic Romagosa", address: "Carretera de Girona 15, La Bisbal d'Empordà", location: { lat: 41.9568, lng: 3.0412 } },
  ];

  for (const update of clientUpdates) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.name, update.name))
      .limit(1);

    if (client) {
      await db
        .update(clients)
        .set({
          address: update.address,
          location: update.location,
        })
        .where(eq(clients.id, client.id));
      console.log(`✅ Updated client: ${update.name}`);
    }
  }

  console.log("\n🎉 Location update complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

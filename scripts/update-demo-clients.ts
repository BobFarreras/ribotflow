/**
 * Data de creació/modificació: 27/05/2026
 * Ruta: scripts/update-demo-clients.ts
 * Descripció: Actualitza tots els clients de DigitAIStudios a La Bisbal.
 */

import { db } from "../src/db";
import { companies } from "../src/db/schema/auth";
import { clients } from "../src/db/schema/sat";
import { eq } from "drizzle-orm";

async function main() {
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.tenantSlug, "ditaistudios"))
    .limit(1);

  if (!company) {
    console.log("❌ Company not found");
    process.exit(1);
  }

  const companyClients = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.companyId, company.id));

  const clientUpdates = [
    { address: "Carrer Major 28, La Bisbal d'Empordà", location: { lat: 41.9598, lng: 3.0378 } },
    { address: "Plaça Major 1, La Bisbal d'Empordà", location: { lat: 41.9591, lng: 3.0402 } },
    { address: "Carrer de l'Església 12, La Bisbal d'Empordà", location: { lat: 41.9605, lng: 3.0385 } },
    { address: "Avinguda de Francesc Macià 45, La Bisbal d'Empordà", location: { lat: 41.9572, lng: 3.0421 } },
    { address: "Carrer de la Mercè 8, La Bisbal d'Empordà", location: { lat: 41.9612, lng: 3.0365 } },
    { address: "Polígon Industrial, Parcel·la 12, La Bisbal d'Empordà", location: { lat: 41.9555, lng: 3.0445 } },
    { address: "Carrer de Santa Margarida 6, La Bisbal d'Empordà", location: { lat: 41.9585, lng: 3.0398 } },
    { address: "Carretera de Girona 15, La Bisbal d'Empordà", location: { lat: 41.9568, lng: 3.0412 } },
  ];

  for (let i = 0; i < companyClients.length; i++) {
    const client = companyClients[i];
    const update = clientUpdates[i];
    if (client && update) {
      await db
        .update(clients)
        .set({
          address: update.address,
          location: update.location,
        })
        .where(eq(clients.id, client.id));
      console.log(`✅ Updated: ${client.name} → ${update.address}`);
    }
  }

  console.log("\n🎉 Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

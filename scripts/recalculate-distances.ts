/**
 * Data de creació/modificació: 27/05/2026
 * Ruta: scripts/recalculate-distances.ts
 * Descripció: Recalcula les distàncies de totes les OTs existents.
 */

import { db } from "../src/db";
import { companies } from "../src/db/schema/auth";
import { workOrders, clients } from "../src/db/schema/sat";
import { eq } from "drizzle-orm";
import { createDistanceEngine } from "../src/services/routing/factory";
import { workOrderService } from "../src/services/sat/workOrderService";

async function main() {
  const [company] = await db
    .select({ id: companies.id, companyLocation: companies.companyLocation })
    .from(companies)
    .where(eq(companies.tenantSlug, "ditaistudios"))
    .limit(1);

  if (!company?.companyLocation) {
    console.log("❌ Company location not found");
    process.exit(1);
  }

  const orders = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.companyId, company.id));

  console.log(`🔄 Recalculating ${orders.length} work orders...\n`);

  const engine = createDistanceEngine();

  for (const order of orders) {
    let destination = order.location as { lat: number; lng: number } | null;

    if (!destination && order.clientId) {
      const [client] = await db
        .select({ location: clients.location })
        .from(clients)
        .where(eq(clients.id, order.clientId))
        .limit(1);
      destination = client?.location ?? null;
    }

    if (destination) {
      try {
        const route = await engine.calculateDistance(
          company.companyLocation,
          destination
        );

        await workOrderService.updateTravelMetrics(
          company.id,
          order.id,
          route.leg.distanceMeters / 1000,
          Math.round(route.leg.durationSeconds / 60)
        );

        console.log(
          `✅ OT ${order.id}: ${(route.leg.distanceMeters / 1000).toFixed(2)} km, ${Math.round(route.leg.durationSeconds / 60)} min`
        );
      } catch (err) {
        console.warn(`⚠️ OT ${order.id}: routing failed`, err);
      }
    } else {
      console.warn(`⚠️ OT ${order.id}: no destination location`);
    }
  }

  console.log("\n🎉 Distance recalculation complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/db/seeds/satCategories.ts
 * Descripció: Seed per a categories d'ordre de treball per defecte.
 *              S'executa quan es crea una nova empresa.
 */

import { db } from "@/db";
import { workOrderCategories } from "@/db/schema/sat";

export const DEFAULT_CATEGORIES = [
  {
    name: "Reparació",
    slug: "repair",
    color: "#ef4444", // vermell
    icon: "Wrench",
    isDefault: true,
    sortOrder: 0,
  },
  {
    name: "Manteniment",
    slug: "maintenance",
    color: "#3b82f6", // blau
    icon: "ClipboardCheck",
    isDefault: false,
    sortOrder: 1,
  },
  {
    name: "Instal·lació",
    slug: "installation",
    color: "#22c55e", // verd
    icon: "Package",
    isDefault: false,
    sortOrder: 2,
  },
  {
    name: "Muntatge",
    slug: "assembly",
    color: "#f59e0b", // taronja
    icon: "Hammer",
    isDefault: false,
    sortOrder: 3,
  },
  {
    name: "Revisió",
    slug: "inspection",
    color: "#8b5cf6", // lila
    icon: "Search",
    isDefault: false,
    sortOrder: 4,
  },
] as const;

export async function seedWorkOrderCategories(companyId: string) {
  const values = DEFAULT_CATEGORIES.map((cat) => ({
    companyId,
    ...cat,
  }));

  await db.insert(workOrderCategories).values(values);
}

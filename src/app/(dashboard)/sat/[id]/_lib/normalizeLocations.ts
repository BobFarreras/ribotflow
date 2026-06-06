/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(dashboard)/sat/[id]/_lib/normalizeLocations.ts
 * Description: Drizzle returns decimal columns as strings; this helper
 *              normalizes WorkOrderLocation rows to the numeric shape
 *              expected by the UI components.
 */

import type { WorkOrderLocation } from "@/types/sat";

export function normalizeLocation(
  loc: { lat: string; lng: string; accuracy: string | null; altitude: string | null } & Record<
    string,
    unknown
  >
): WorkOrderLocation {
  return {
    ...loc,
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    accuracy: loc.accuracy !== null ? Number(loc.accuracy) : null,
    altitude: loc.altitude !== null ? Number(loc.altitude) : null,
  } as WorkOrderLocation;
}

export function normalizeLocations<
  T extends { lat: string; lng: string; accuracy: string | null; altitude: string | null },
>(locations: T[]): WorkOrderLocation[] {
  return locations.map(normalizeLocation);
}

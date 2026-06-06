/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/routing/routeOptimizer.ts
 * Description: Route optimization using greedy nearest-neighbor algorithm.
 *              Time complexity: O(n^2). Good for daily routes (< 20 stops).
 *              Can be replaced with advanced TSP solver in the future.
 */

import type { GeoPoint } from "./interface";
import { calculateDistance } from "@/lib/utils/geo";

export interface RouteStop {
  workOrderId: string;
  title: string;
  clientName: string;
  address: string;
  location: GeoPoint;
  estimatedDurationMinutes: number;
  priority: string;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  estimatedTravelMinutes: number;
}

/**
 * Greedy nearest-neighbor algorithm.
 * Starts from company HQ, always visits the closest unvisited stop.
 * Does not return to HQ (open route, typical for service technicians).
 */
export function optimizeRoute(stops: RouteStop[], hq: GeoPoint): OptimizedRoute {
  if (stops.length === 0) {
    return { stops: [], totalDistanceKm: 0, totalDurationMinutes: 0, estimatedTravelMinutes: 0 };
  }

  const unvisited = [...stops];
  const ordered: RouteStop[] = [];
  let current = hq;
  let totalDistanceMeters = 0;
  let totalWorkMinutes = 0;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistance(
        current.lat,
        current.lng,
        unvisited[i].location.lat,
        unvisited[i].location.lng
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const next = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(next);
    totalDistanceMeters += nearestDist;
    totalWorkMinutes += next.estimatedDurationMinutes;
    current = next.location;
  }

  const totalDistanceKm = Math.round((totalDistanceMeters / 1000) * 10) / 10;
  const estimatedTravelMinutes = Math.round((totalDistanceMeters / 1000 / 50) * 60);
  const totalDurationMinutes = totalWorkMinutes + estimatedTravelMinutes;

  return {
    stops: ordered,
    totalDistanceKm,
    totalDurationMinutes,
    estimatedTravelMinutes,
  };
}

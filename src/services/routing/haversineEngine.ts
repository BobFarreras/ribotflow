/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/routing/haversineEngine.ts
 * Description: Free fallback distance engine using Haversine formula.
 *              Calculates straight-line distance. Good enough for MVP and
 *              fallback when external APIs are unavailable.
 */

import type { DistanceEngine, GeoPoint, RouteResult } from "./interface";

export class HaversineEngine implements DistanceEngine {
  readonly provider = "haversine";

  async calculateDistance(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
    const distanceMeters = this.haversineDistance(origin, destination);
    const durationSeconds = this.estimateDuration(distanceMeters);

    return {
      origin,
      destination,
      leg: { distanceMeters, durationSeconds },
      provider: this.provider,
    };
  }

  async calculateMatrix(origin: GeoPoint, destinations: GeoPoint[]) {
    return Promise.all(
      destinations.map((dest) => this.calculateDistance(origin, dest).then((r) => r.leg))
    );
  }

  private haversineDistance(a: GeoPoint, b: GeoPoint): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);

    const haversine =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return R * c;
  }

  /**
   * Rough duration estimate: 50km/h average speed in city/suburbs.
   * Not accurate but free and works offline.
   */
  private estimateDuration(distanceMeters: number): number {
    const avgSpeedKmh = 50;
    const hours = distanceMeters / 1000 / avgSpeedKmh;
    return Math.round(hours * 3600);
  }
}

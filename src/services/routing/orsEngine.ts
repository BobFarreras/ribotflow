/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/routing/orsEngine.ts
 * Description: OpenRouteService (OpenStreetMap) distance engine.
 *              Free tier: 500 requests/day, 40 requests/minute.
 *              Calculates real driving distance and duration.
 */

import type { DistanceEngine, GeoPoint, RouteResult } from "./interface";

export interface OrsConfig {
  apiKey?: string; // Optional: ORS allows free usage without key (lower limits)
  baseUrl?: string;
}

export class OpenRouteServiceEngine implements DistanceEngine {
  readonly provider = "openrouteservice";
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(config: OrsConfig = {}) {
    this.baseUrl = config.baseUrl ?? "https://api.openrouteservice.org";
    this.apiKey = config.apiKey;
  }

  async calculateDistance(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
    const url = `${this.baseUrl}/v2/directions/driving-car`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = this.apiKey;
    }

    const body = JSON.stringify({
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    });

    const res = await fetch(url, { method: "POST", headers, body });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ORS API error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      routes: Array<{
        summary: { distance: number; duration: number };
        geometry: string;
      }>;
    };

    const route = data.routes[0];
    if (!route) {
      throw new Error("No route found");
    }

    return {
      origin,
      destination,
      leg: {
        distanceMeters: route.summary.distance,
        durationSeconds: route.summary.duration,
        polyline: route.geometry,
      },
      provider: this.provider,
    };
  }

  async calculateMatrix(origin: GeoPoint, destinations: GeoPoint[]) {
    const url = `${this.baseUrl}/v2/matrix/driving-car`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = this.apiKey;
    }

    const body = JSON.stringify({
      locations: [
        [origin.lng, origin.lat],
        ...destinations.map((d) => [d.lng, d.lat]),
      ],
    });

    const res = await fetch(url, { method: "POST", headers, body });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ORS Matrix API error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      distances: number[][];
      durations: number[][];
    };

    return destinations.map((_, i) => ({
      distanceMeters: Math.round(data.distances[0][i + 1]),
      durationSeconds: Math.round(data.durations[0][i + 1]),
    }));
  }
}

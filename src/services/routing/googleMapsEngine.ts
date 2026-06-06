/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/routing/googleMapsEngine.ts
 * Description: Google Maps Distance Matrix API engine.
 *              Premium provider with best accuracy and high limits.
 *              Requires GOOGLE_MAPS_API_KEY environment variable.
 */

import type { DistanceEngine, GeoPoint, RouteResult } from "./interface";

export interface GoogleMapsConfig {
  apiKey: string;
}

export class GoogleMapsEngine implements DistanceEngine {
  readonly provider = "google_maps";
  private readonly apiKey: string;

  constructor(config: GoogleMapsConfig) {
    this.apiKey = config.apiKey;
  }

  async calculateDistance(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
    const params = new URLSearchParams({
      origins: `${origin.lat},${origin.lng}`,
      destinations: `${destination.lat},${destination.lng}`,
      mode: "driving",
      key: this.apiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Google Maps API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      rows: Array<{
        elements: Array<{
          status: string;
          distance: { value: number };
          duration: { value: number };
        }>;
      }>;
    };

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== "OK") {
      throw new Error(`Google Maps route not found: ${element?.status ?? "UNKNOWN"}`);
    }

    return {
      origin,
      destination,
      leg: {
        distanceMeters: element.distance.value,
        durationSeconds: element.duration.value,
      },
      provider: this.provider,
    };
  }

  async calculateMatrix(origin: GeoPoint, destinations: GeoPoint[]) {
    const destStr = destinations.map((d) => `${d.lat},${d.lng}`).join("|");

    const params = new URLSearchParams({
      origins: `${origin.lat},${origin.lng}`,
      destinations: destStr,
      mode: "driving",
      key: this.apiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Google Maps Matrix API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      rows: Array<{
        elements: Array<{
          status: string;
          distance: { value: number };
          duration: { value: number };
        }>;
      }>;
    };

    const elements = data.rows[0]?.elements ?? [];
    return elements.map((el) => ({
      distanceMeters: el.distance.value,
      durationSeconds: el.duration.value,
    }));
  }
}

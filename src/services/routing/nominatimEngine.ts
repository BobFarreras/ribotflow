/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/routing/nominatimEngine.ts
 * Description: Nominatim (OpenStreetMap) geocoding engine.
 *              Free, no API key required (with usage policy: 1 req/sec).
 *              Provides address autocomplete and reverse geocoding.
 */

import type { GeocodingEngine, GeocodedAddress } from "./interface";

export interface NominatimConfig {
  baseUrl?: string;
  countryCodes?: string[]; // e.g., ["es", "ad"]
}

export class NominatimEngine implements GeocodingEngine {
  readonly provider = "nominatim";
  private readonly baseUrl: string;
  private readonly countryCodes?: string;

  constructor(config: NominatimConfig = {}) {
    this.baseUrl = config.baseUrl ?? "https://nominatim.openstreetmap.org";
    this.countryCodes = config.countryCodes?.join(",");
  }

  async autocomplete(
    query: string,
    options?: { lat?: number; lng?: number }
  ): Promise<GeocodedAddress[]> {
    if (!query.trim() || query.trim().length < 3) return [];

    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "5",
      "accept-language": "ca,es",
    });

    if (this.countryCodes) {
      params.set("countrycodes", this.countryCodes);
    }
    if (options?.lat && options?.lng) {
      params.set("lat", String(options.lat));
      params.set("lon", String(options.lng));
    }

    const url = `${this.baseUrl}/search?${params.toString()}`;

    // Nominatim requires User-Agent header
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RIBOTFLOW/1.0 (contact@ribotflow.com)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address: {
        road?: string;
        house_number?: string;
        city?: string;
        postcode?: string;
        country?: string;
      };
    }>;

    return data.map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      addressComponents: {
        street: item.address.road,
        houseNumber: item.address.house_number,
        city: item.address.city,
        postcode: item.address.postcode,
        country: item.address.country,
      },
    }));
  }

  async reverse(lat: number, lng: number): Promise<GeocodedAddress | null> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "json",
      addressdetails: "1",
      "accept-language": "ca,es",
    });

    const url = `${this.baseUrl}/reverse?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "RIBOTFLOW/1.0 (contact@ribotflow.com)",
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      display_name: string;
      lat: string;
      lon: string;
      address: {
        road?: string;
        house_number?: string;
        city?: string;
        postcode?: string;
        country?: string;
      };
    } | null;

    if (!data) return null;

    return {
      displayName: data.display_name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      addressComponents: {
        street: data.address.road,
        houseNumber: data.address.house_number,
        city: data.address.city,
        postcode: data.address.postcode,
        country: data.address.country,
      },
    };
  }
}

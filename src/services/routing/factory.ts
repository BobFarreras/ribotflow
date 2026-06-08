/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/routing/factory.ts
 * Description: Factory to instantiate the correct DistanceEngine and
 *              GeocodingEngine based on environment variables.
 *              Agnostic: works with free or paid providers.
 */

import type { DistanceEngine, GeocodingEngine } from "./interface";
import { HaversineEngine } from "./haversineEngine";
import { OpenRouteServiceEngine } from "./orsEngine";
import { GoogleMapsEngine } from "./googleMapsEngine";
import { NominatimEngine } from "./nominatimEngine";

export type DistanceProvider = "haversine" | "openrouteservice" | "google_maps";
export type GeocodingProvider = "nominatim" | "google_places";

function getDistanceProvider(): DistanceProvider {
  const provider = process.env.ROUTING_DISTANCE_PROVIDER;
  if (provider === "openrouteservice" || provider === "google_maps" || provider === "haversine") {
    return provider;
  }
  return "haversine";
}

function getGeocodingProvider(): GeocodingProvider {
  const provider = process.env.ROUTING_GEOCODING_PROVIDER;
  if (provider === "google_places") return provider;
  return "nominatim";
}

export function createDistanceEngine(): DistanceEngine {
  const provider = getDistanceProvider();

  switch (provider) {
    case "google_maps": {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn(
          `[Routing] GOOGLE_MAPS_API_KEY missing. Falling back to Haversine. ` +
            "Set ROUTING_DISTANCE_PROVIDER=haversine to suppress this warning."
        );
        return new HaversineEngine();
      }
      return new GoogleMapsEngine({ apiKey });
    }

    case "openrouteservice": {
      const apiKey = process.env.OPENROUTESERVICE_API_KEY;
      return new OpenRouteServiceEngine({ apiKey });
    }

    case "haversine":
    default:
      return new HaversineEngine();
  }
}

export function createGeocodingEngine(): GeocodingEngine {
  const provider = getGeocodingProvider();

  switch (provider) {
    case "google_places":
      // Future: implement Google Places autocomplete
      console.warn(`[Routing] Google Places not yet implemented. Using Nominatim.`);
      return new NominatimEngine({ countryCodes: ["es", "ad"] });

    case "nominatim":
    default:
      return new NominatimEngine({ countryCodes: ["es", "ad"] });
  }
}

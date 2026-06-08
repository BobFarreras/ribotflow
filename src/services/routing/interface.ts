/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/routing/interface.ts
 * Description: Framework-agnostic interfaces for routing and geocoding.
 *              Supports multiple providers: Haversine (free), OpenRouteService (free),
 *              Google Maps (paid), Nominatim (free).
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string; // Encoded polyline for map rendering
}

export interface RouteResult {
  origin: GeoPoint;
  destination: GeoPoint;
  leg: RouteLeg;
  provider: string;
}

export interface DistanceEngine {
  /** Unique provider name for logging/debugging */
  readonly provider: string;

  /** Calculate driving distance and duration between two points */
  calculateDistance(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult>;

  /** Batch calculate distances from one origin to multiple destinations (route optimization) */
  calculateMatrix?(origin: GeoPoint, destinations: GeoPoint[]): Promise<RouteLeg[]>;
}

export interface GeocodedAddress {
  displayName: string;
  lat: number;
  lng: number;
  addressComponents?: {
    street?: string;
    houseNumber?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

export interface GeocodingEngine {
  readonly provider: string;

  /** Autocomplete addresses as user types (debounced) */
  autocomplete(query: string, options?: { lat?: number; lng?: number }): Promise<GeocodedAddress[]>;

  /** Reverse geocode: coordinates → address */
  reverse(lat: number, lng: number): Promise<GeocodedAddress | null>;
}

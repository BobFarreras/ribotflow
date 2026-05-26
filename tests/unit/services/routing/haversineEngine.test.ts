/**
 * Creation/modification date: 26/05/2026
 * Path: tests/unit/services/routing/haversineEngine.test.ts
 * Description: Unit tests for HaversineEngine (free, no external API).
 */

import { describe, it, expect } from "vitest";
import { HaversineEngine } from "@/services/routing/haversineEngine";

const engine = new HaversineEngine();

describe("HaversineEngine", () => {
  it("should calculate distance between Barcelona and Madrid", async () => {
    const result = await engine.calculateDistance(
      { lat: 41.3851, lng: 2.1734 },
      { lat: 40.4168, lng: -3.7038 }
    );

    expect(result.provider).toBe("haversine");
    expect(result.leg.distanceMeters).toBeGreaterThan(500_000);
    expect(result.leg.distanceMeters).toBeLessThan(510_000);
    expect(result.leg.durationSeconds).toBeGreaterThan(0);
  });

  it("should return 0 for same coordinates", async () => {
    const result = await engine.calculateDistance(
      { lat: 41.3851, lng: 2.1734 },
      { lat: 41.3851, lng: 2.1734 }
    );

    expect(result.leg.distanceMeters).toBe(0);
  });

  it("should calculate small distances accurately", async () => {
    const result = await engine.calculateDistance(
      { lat: 41.3851, lng: 2.1734 },
      { lat: 41.3855, lng: 2.1734 }
    );

    expect(result.leg.distanceMeters).toBeGreaterThan(40);
    expect(result.leg.distanceMeters).toBeLessThan(60);
  });

  it("should calculate matrix from origin to multiple destinations", async () => {
    const results = await engine.calculateMatrix(
      { lat: 41.3851, lng: 2.1734 },
      [
        { lat: 40.4168, lng: -3.7038 },
        { lat: 41.3855, lng: 2.1734 },
      ]
    );

    expect(results).toHaveLength(2);
    expect(results[0].distanceMeters).toBeGreaterThan(500_000);
    expect(results[1].distanceMeters).toBeLessThan(100);
  });
});

/**
 * Creation/modification date: 26/05/2026
 * Path: tests/unit/services/routing/routeOptimizer.test.ts
 * Description: Unit tests for the greedy route optimizer.
 */

import { describe, it, expect } from "vitest";
import { optimizeRoute } from "@/services/routing/routeOptimizer";
import type { RouteStop } from "@/services/routing/routeOptimizer";

const HQ = { lat: 41.3851, lng: 2.1734 }; // Barcelona center

describe("RouteOptimizer", () => {
  it("should optimize a 3-stop route (nearest neighbor)", () => {
    const stops: RouteStop[] = [
      {
        workOrderId: "1",
        title: "Far stop",
        clientName: "Client A",
        address: "Madrid",
        location: { lat: 40.4168, lng: -3.7038 },
        estimatedDurationMinutes: 60,
        priority: "medium",
      },
      {
        workOrderId: "2",
        title: "Close stop",
        clientName: "Client B",
        address: "Barcelona",
        location: { lat: 41.3900, lng: 2.1700 },
        estimatedDurationMinutes: 30,
        priority: "medium",
      },
      {
        workOrderId: "3",
        title: "Medium stop",
        clientName: "Client C",
        address: "Girona",
        location: { lat: 41.9794, lng: 2.8214 },
        estimatedDurationMinutes: 45,
        priority: "medium",
      },
    ];

    const result = optimizeRoute(stops, HQ);

    // Closest to HQ should be first (Barcelona)
    expect(result.stops[0].workOrderId).toBe("2");
    // Then Girona (closer to Barcelona than Madrid)
    expect(result.stops[1].workOrderId).toBe("3");
    // Then Madrid (farthest)
    expect(result.stops[2].workOrderId).toBe("1");

    expect(result.totalDistanceKm).toBeGreaterThan(0);
    expect(result.estimatedTravelMinutes).toBeGreaterThan(0);
    expect(result.totalDurationMinutes).toBe(135 + result.estimatedTravelMinutes);
  });

  it("should handle empty stops", () => {
    const result = optimizeRoute([], HQ);
    expect(result.stops).toHaveLength(0);
    expect(result.totalDistanceKm).toBe(0);
    expect(result.totalDurationMinutes).toBe(0);
  });

  it("should handle single stop", () => {
    const stops: RouteStop[] = [
      {
        workOrderId: "1",
        title: "Only stop",
        clientName: "Client",
        address: "Barcelona",
        location: { lat: 41.3900, lng: 2.1700 },
        estimatedDurationMinutes: 60,
        priority: "medium",
      },
    ];

    const result = optimizeRoute(stops, HQ);
    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].workOrderId).toBe("1");
    expect(result.totalDistanceKm).toBeGreaterThan(0);
  });
});

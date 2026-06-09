/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/RoutePlanner.tsx
 * Description: Client component for route planning. Selects work orders,
 *              optimizes route with nearest-neighbor, shows list + map.
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { optimizeRoute, type RouteStop } from "@/services/routing/routeOptimizer";
import type { GeoPoint } from "@/services/routing/interface";
import type { WorkOrder, Client } from "@/types/sat";
import { MapPin, Route, Clock, Check } from "lucide-react";

interface Props {
  orders: { workOrder: WorkOrder; client: Client }[];
  hq: GeoPoint;
}

export function RoutePlanner({ orders, hq }: Props) {
  const t = useTranslations("sat.routes");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [optimizedRoute, setOptimizedRoute] = useState<ReturnType<typeof optimizeRoute> | null>(
    null
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleOptimize = useCallback(() => {
    const stops: RouteStop[] = orders
      .filter((o) => selectedIds.has(o.workOrder.id))
      .map((o) => ({
        workOrderId: o.workOrder.id,
        title: o.workOrder.title,
        clientName: o.client.name,
        address: o.client.address ?? "",
        location: o.client.location ?? { lat: 0, lng: 0 },
        estimatedDurationMinutes: o.workOrder.estimatedDurationMinutes ?? 60,
        priority: o.workOrder.priority,
      }));

    if (stops.length === 0) return;
    const route = optimizeRoute(stops, hq);
    setOptimizedRoute(route);
  }, [orders, selectedIds, hq]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (orders.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <Route className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <p className="text-[var(--text-muted)]">{t("noOrders")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-2 sm:p-6">
      {/* Left column - Order list */}
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
            {t("selectOrders")} ({selectedIds.size}/{orders.length})
          </h2>
          <div className="space-y-2">
            {orders.map((order) => {
              const isSelected = selectedIds.has(order.workOrder.id);
              const hasLocation = !!order.client.location;

              return (
                <button
                  key={order.workOrder.id}
                  onClick={() => toggleSelection(order.workOrder.id)}
                  disabled={!hasLocation}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-[var(--module-sat)] bg-teal-50"
                      : "border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface)]"
                  } ${!hasLocation ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? "bg-[var(--module-sat)] border-[var(--module-sat)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        {order.workOrder.number}
                      </span>
                      {!hasLocation && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                          {t("noLocation")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-[var(--text)]">
                      {order.workOrder.title}
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{order.client.name}</p>
                  </div>
                  {order.client.location && (
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <MapPin className="h-3 w-3" />
                        {order.workOrder.travelDistanceKm ?? "—"} km
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Clock className="h-3 w-3" />
                        {formatDuration(order.workOrder.estimatedDurationMinutes ?? 60)}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleOptimize}
            disabled={selectedIds.size === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Route className="h-4 w-4" />
            {t("optimizeRoute")}
          </button>
        </div>
      </div>

      {/* Right column - Route result */}
      <div className="space-y-4">
        {optimizedRoute ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">{t("optimizedRoute")}</h2>

            {/* Summary */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-[var(--bg)] p-3 text-center">
                <div className="text-lg font-bold text-[var(--module-sat)]">
                  {optimizedRoute.stops.length}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {t("stops")}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg)] p-3 text-center">
                <div className="text-lg font-bold text-[var(--module-sat)]">
                  {optimizedRoute.totalDistanceKm} km
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {t("totalDistance")}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg)] p-3 text-center">
                <div className="text-lg font-bold text-[var(--module-sat)]">
                  {formatDuration(optimizedRoute.totalDurationMinutes)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {t("totalTime")}
                </div>
              </div>
            </div>

            {/* Stops list */}
            <div className="space-y-2">
              {optimizedRoute.stops.map((stop, index) => (
                <div
                  key={stop.workOrderId}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--module-sat)] text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{stop.title}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{stop.clientName}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-[var(--text-muted)]">
                    <div>{formatDuration(stop.estimatedDurationMinutes)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <Route className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">{t("selectAndOptimize")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

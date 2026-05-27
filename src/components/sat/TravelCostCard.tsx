/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/TravelCostCard.tsx
 * Description: Displays travel distance and cost for a work order.
 */

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Car, Route, Euro } from "lucide-react";

interface Props {
  distanceKm: string | null;
  durationMinutes: number | null;
  ratePerKm?: string | null;
}

export function TravelCostCard({ distanceKm, durationMinutes, ratePerKm }: Props) {
  const t = useTranslations("sat.workOrder");
  const [cost, setCost] = useState<number | null>(null);

  useEffect(() => {
    if (distanceKm && ratePerKm) {
      setCost(parseFloat(distanceKm) * parseFloat(ratePerKm));
    }
  }, [distanceKm, ratePerKm]);

  if (!distanceKm) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Desplaçament</h2>
        <p className="text-xs text-[var(--text-muted)]">Sense dades de desplaçament</p>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}min`;
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Desplaçament</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-[var(--module-sat)]" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Distància</p>
            <p className="text-sm font-medium">{distanceKm} km</p>
          </div>
        </div>
        {durationMinutes && (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-[var(--module-sat)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Temps</p>
              <p className="text-sm font-medium">{formatDuration(durationMinutes)}</p>
            </div>
          </div>
        )}
        {cost !== null && (
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-[var(--module-sat)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Cost</p>
              <p className="text-sm font-medium">{cost.toFixed(2)} EUR</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

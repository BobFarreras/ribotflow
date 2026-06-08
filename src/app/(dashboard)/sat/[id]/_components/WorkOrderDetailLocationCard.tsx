/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(dashboard)/sat/[id]/_components/WorkOrderDetailLocationCard.tsx
 * Description: Right-column card with technician check-in button and recent
 *              GPS location events. Only rendered when relevant.
 */

import { CheckInButton } from "@/components/sat/work-orders/CheckInButton";

interface LocationRow {
  id: string;
  eventType: string;
  createdAt: Date;
}

interface ClientLocation {
  lat: number;
  lng: number;
}

interface WorkOrderDetailLocationCardProps {
  workOrderId: string;
  clientLocation: ClientLocation | null;
  lastCheckIn: { lat: number; lng: number; createdAt: Date } | null;
  locations: LocationRow[];
  canCheckIn: boolean;
  isTechnician: boolean;
}

export function WorkOrderDetailLocationCard({
  workOrderId,
  clientLocation,
  lastCheckIn,
  locations,
  canCheckIn,
  isTechnician,
}: WorkOrderDetailLocationCardProps) {
  return (
    <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Localització
      </h2>
      {canCheckIn && isTechnician && (
        <CheckInButton
          workOrderId={workOrderId}
          clientLocation={clientLocation}
          lastCheckIn={lastCheckIn}
        />
      )}
      {locations.length > 0 && (
        <div className="mt-2 space-y-1">
          {locations.slice(0, 3).map((loc) => (
            <div key={loc.id} className="flex items-center justify-between text-sm">
              <span className="capitalize text-[var(--text)]">
                {loc.eventType.replace("_", " ")}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(loc.createdAt).toLocaleTimeString("ca-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

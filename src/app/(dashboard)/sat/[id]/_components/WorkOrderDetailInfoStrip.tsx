/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(dashboard)/sat/[id]/_components/WorkOrderDetailInfoStrip.tsx
 * Description: Horizontal info strip showing client, category, date, travel
 *              distance, cost, and address below the header.
 */

import Link from "next/link";
import { MapPin, Phone, Calendar, Route, Euro } from "lucide-react";
import { CategoryIcon } from "@/components/sat/shared/CategoryIcon";
import { GoogleMapsLink } from "@/components/sat/shared/GoogleMapsLink";

interface ClientSummary {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  location: { lat: number; lng: number } | null;
  contactPerson: string | null;
}

interface CategorySummary {
  slug: string;
  icon: string | null;
  name: string;
  color: string | null;
}

interface WorkOrderDetailInfoStripProps {
  client: ClientSummary;
  category: CategorySummary;
  scheduledDate: Date | null;
  travelDistanceKm: string | null;
  travelDurationMinutes: number | null;
  travelCost: number | null;
}

export function WorkOrderDetailInfoStrip({
  client,
  category,
  scheduledDate,
  travelDistanceKm,
  travelDurationMinutes,
  travelCost,
}: WorkOrderDetailInfoStripProps) {
  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          <Link
            href={`/sat/clients/${client.id}`}
            className="transition-colors hover:text-[var(--module-sat)] hover:underline"
          >
            {client.name}
          </Link>
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="ml-1 text-[var(--module-sat)] hover:underline"
            >
              <Phone className="inline h-3 w-3" />
            </a>
          )}
        </span>
        <span className="flex items-center gap-1">
          <CategoryIcon slug={category.icon ?? category.slug} color={category.color} size={12} />
          {category.name}
        </span>
        {scheduledDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(scheduledDate).toLocaleDateString("ca-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
        {travelDistanceKm && (
          <span className="flex items-center gap-1">
            <Route className="h-3 w-3" />
            {travelDistanceKm} km
            {travelDurationMinutes && (
              <span className="text-[10px] opacity-70">
                ({Math.floor(travelDurationMinutes / 60)}h {travelDurationMinutes % 60}m)
              </span>
            )}
          </span>
        )}
        {travelCost !== null && (
          <span className="flex items-center gap-1">
            <Euro className="h-3 w-3" />
            {travelCost.toFixed(2)} €
          </span>
        )}
        {client.address && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {client.address}
            {client.location && (
              <GoogleMapsLink lat={client.location.lat} lng={client.location.lng} label="Mapa" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

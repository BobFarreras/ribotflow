/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/ClientInfoCard.tsx
 * Description: Client information card for the work order detail page.
 */

"use client";

import { useTranslations } from "next-intl";
import { GoogleMapsLink } from "./GoogleMapsLink";
import { MapPin } from "lucide-react";

interface Props {
  client: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    location?: { lat: number; lng: number } | null;
  };
}

export function ClientInfoCard({ client }: Props) {
  const t = useTranslations("sat.workOrder");

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
        {t("list.columns.client")}
      </h2>
      <div className="text-sm text-[var(--text)]">
        <p className="font-medium">{client.name}</p>
        {client.phone && <p className="mt-1 text-[var(--text-muted)]">{client.phone}</p>}
        {client.email && <p className="text-[var(--text-muted)]">{client.email}</p>}
        {client.address && (
          <div className="mt-1 flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">{client.address}</span>
          </div>
        )}
        {client.location && (
          <div className="mt-2">
            <GoogleMapsLink
              lat={client.location.lat}
              lng={client.location.lng}
              label="Veure mapa"
            />
          </div>
        )}
      </div>
    </div>
  );
}

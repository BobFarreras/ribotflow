/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/GoogleMapsLink.tsx
 * Description: Opens Google Maps with the given coordinates in a new tab.
 */

"use client";

import { ExternalLink } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  label?: string;
}

export function GoogleMapsLink({ lat, lng, label }: Props) {
  const url = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
      title="Obrir a Google Maps"
    >
      <ExternalLink className="h-3 w-3" />
      {label ?? "Google Maps"}
    </a>
  );
}

/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/AddressAutocomplete.tsx
 * Description: Autocomplete address input using Nominatim (OpenStreetMap).
 *              Returns full address + lat/lng coordinates.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface GeocodedResult {
  displayName: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (address: string, location: { lat: number; lng: number } | null) => void;
  placeholder?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeocodedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        format: "json",
        addressdetails: "1",
        limit: "5",
        "accept-language": "ca,es",
        countrycodes: "es",
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "User-Agent": "RIBOTFLOW/1.0 (contact@ribotflow.com)",
          },
        }
      );

      if (!res.ok) throw new Error("Nominatim error");

      const data = await res.json();
      setResults(
        data.map((item: any) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }))
      );
      setIsOpen(true);
    } catch (err) {
      console.error("[AddressAutocomplete] Search failed:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val, null); // Clear coordinates while typing

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (result: GeocodedResult) => {
    setQuery(result.displayName);
    onChange(result.displayName, { lat: result.lat, lng: result.lng });
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder ?? "Cerca adreça..."}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--text-muted)]" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--bg)]"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--module-sat)]" />
              <span className="line-clamp-2 text-[var(--text)]">{result.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderForm/AddressSection.tsx
 * Description: Address input with autocomplete + coordinates + Google Maps link.
 */

"use client";

import { MapPin, Home } from "lucide-react";
import { AddressAutocomplete } from "../../shared/AddressAutocomplete";
import type { WorkOrderFormState, WorkOrderFormActions, WorkOrderLocation } from "./types";

interface AddressSectionProps {
  state: WorkOrderFormState;
  actions: WorkOrderFormActions;
  hasClient: boolean;
}

export function AddressSection({ state, actions, hasClient }: AddressSectionProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
          <MapPin className="h-4 w-4 text-[var(--module-sat)]" />
          Ubicació de l&apos;ordre
        </label>
        {hasClient && (
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={state.useClientAddress}
              onChange={(e) => actions.setUseClientAddress(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            <span className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              Usar adreça del client
            </span>
          </label>
        )}
      </div>

      <AddressAutocomplete
        value={state.address}
        onChange={(addr: string, loc: WorkOrderLocation | null) => actions.handleAddressChange(addr, loc)}
        placeholder="Cerca adreça de l'ordre..."
      />

      {state.location && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <MapPin className="h-3 w-3 text-green-500" />
          <span>
            Coordenades: {state.location.lat.toFixed(6)}, {state.location.lng.toFixed(6)}
          </span>
          <a
            href={`https://www.google.com/maps?q=${state.location.lat},${state.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--module-sat)] hover:underline"
          >
            Veure a Google Maps
          </a>
        </div>
      )}

      {!state.location && state.address && (
        <p className="mt-2 text-xs text-amber-600">
          ⚠️ Adreça sense coordenades. Cerca i selecciona una adreça per calcular la distància.
        </p>
      )}
    </div>
  );
}

/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/ClientSelector.tsx
 * Description: Company display + client selection (existing or custom).
 */

import { useState } from "react";
import type { Client } from "./types";

const COMPANY_DATA = {
  name: "DigitAIStudios",
  nif: "B12345678",
  address: "Carrer Nou 15, 17100 La Bisbal d'Emporda",
  phone: "972 642 100",
  email: "info@ditaistudios.com",
  website: "www.ditaistudios.com",
};

interface Props {
  clients: Client[];
  selectedClientId: string;
  selectedClient: Client | undefined;
  useCustomClient: boolean;
  customClient: { name: string; email: string; phone: string; address: string; taxId: string };
  onClientSelect: (clientId: string) => void;
  onToggleCustom: (v: boolean) => void;
  onCustomChange: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; address: string; taxId: string }>>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

export function ClientSelector({
  clients,
  selectedClientId,
  selectedClient,
  useCustomClient,
  customClient,
  onClientSelect,
  onToggleCustom,
  onCustomChange,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Company */}
      <Section title="Empresa">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--module-sat)]/10 text-[var(--module-sat)] font-bold text-lg">
              {COMPANY_DATA.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-[var(--text)]">{COMPANY_DATA.name}</div>
              <div className="text-xs text-[var(--text-muted)]">NIF: {COMPANY_DATA.nif}</div>
            </div>
          </div>
          <div className="text-[var(--text-muted)]">{COMPANY_DATA.address}</div>
          <div className="text-[var(--text-muted)]">{COMPANY_DATA.phone}</div>
          <div className="text-[var(--text-muted)]">{COMPANY_DATA.email}</div>
        </div>
      </Section>

      {/* Client */}
      <Section title="Client">
        <div className="space-y-3">
          <div className="flex gap-2">
            <ToggleButton active={!useCustomClient} onClick={() => onToggleCustom(false)}>
              Existents
            </ToggleButton>
            <ToggleButton active={useCustomClient} onClick={() => onToggleCustom(true)}>
              Nou
            </ToggleButton>
          </div>

          {!useCustomClient ? (
            <select
              value={selectedClientId}
              onChange={(e) => onClientSelect(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
            >
              <option value="">Seleccionar...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <CustomInput value={customClient.name} placeholder="Nom del client" onChange={(v) => onCustomChange((p) => ({ ...p, name: v }))} />
              <CustomInput value={customClient.email} placeholder="Email" onChange={(v) => onCustomChange((p) => ({ ...p, email: v }))} />
              <CustomInput value={customClient.phone} placeholder="Telefon" onChange={(v) => onCustomChange((p) => ({ ...p, phone: v }))} />
              <CustomInput value={customClient.taxId} placeholder="NIF/CIF" onChange={(v) => onCustomChange((p) => ({ ...p, taxId: v }))} />
              <CustomInput value={customClient.address} placeholder="Adreca" onChange={(v) => onCustomChange((p) => ({ ...p, address: v }))} />
            </div>
          )}

          {selectedClient && !useCustomClient && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2 text-xs text-[var(--text-muted)]">
              {selectedClient.email && <div>{selectedClient.email}</div>}
              {selectedClient.phone && <div>{selectedClient.phone}</div>}
              {selectedClient.address && <div>{selectedClient.address}</div>}
              {selectedClient.taxId && <div>NIF: {selectedClient.taxId}</div>}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
        active ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]" : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
      }`}
    >
      {children}
    </button>
  );
}

function CustomInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
    />
  );
}

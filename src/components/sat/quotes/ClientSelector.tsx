/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/ClientSelector.tsx
 * Description: Company display + client selection (existing or custom).
 */

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Client, CompanySummary } from "./types";

interface Props {
  company: CompanySummary;
  clients: Client[];
  selectedClientId: string;
  selectedClient: Client | undefined;
  useCustomClient: boolean;
  customClient: { name: string; email: string; phone: string; address: string; taxId: string };
  onClientSelect: (clientId: string) => void;
  onToggleCustom: (v: boolean) => void;
  onCustomChange: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; address: string; taxId: string }>>;
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

export function ClientSelector({
  company,
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
      <Section
        title="Empresa"
        action={
          <Link
            href="/settings/company"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--module-sat)] transition-colors hover:bg-[var(--module-sat)]/10"
            aria-label="Editar dades de l'empresa"
          >
            Editar
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>
        }
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-10 w-10 rounded-lg object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--module-sat)]/10 text-[var(--module-sat)] font-bold text-lg">
                {company.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold text-[var(--text)]">{company.name}</div>
              {company.taxId && <div className="text-xs text-[var(--text-muted)]">NIF: {company.taxId}</div>}
            </div>
          </div>
          {company.address && <div className="text-[var(--text-muted)]">{company.address}</div>}
          {company.phone && <div className="text-[var(--text-muted)]">{company.phone}</div>}
          {company.email && <div className="text-[var(--text-muted)]">{company.email}</div>}
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

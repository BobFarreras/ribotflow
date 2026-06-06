/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/clients/new/page.tsx
 * Description: Create new SAT client page.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientAction } from "@/actions/sat/clients/createClient";
import { ArrowLeft, UserPlus, Loader2, MapPin } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    lat: "",
    lng: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await createClientAction({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      taxId: formData.taxId || null,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
    });

    setIsLoading(false);

    if (result.success) {
      router.push("/sat/clients");
    } else {
      setError(result.error ?? "Error");
    }
  };

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/sat/clients"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[var(--module-sat)]" />
            <h1 className="text-lg font-semibold text-[var(--text)]">Nou Client</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
        >
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nom del client o empresa"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="client@email.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                TelÃ¨fon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+34 600 000 000"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">AdreÃ§a</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              placeholder="Carrer, nÃºmero, ciutat, CP"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">NIF / CIF</label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData((p) => ({ ...p, taxId: e.target.value }))}
              placeholder="B12345678"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
            />
          </div>

          {/* GPS coordinates */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
              <MapPin className="h-3.5 w-3.5" />
              Coordenades GPS
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData((p) => ({ ...p, lat: e.target.value }))}
                placeholder="Latitud"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData((p) => ({ ...p, lng: e.target.value }))}
                placeholder="Longitud"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Opcional. Permet calcular distàncies per als desplaçaments.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/sat/clients"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
            >
              CancelÂ·lar
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.name}
              className="flex items-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear client
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

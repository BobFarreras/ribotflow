/**
 * Creation/modification date: 24/05/2026
 * Path: src/components/sat/WorkOrderForm.tsx
 * Description: Client-side work order creation form with validation feedback.
 *              Includes address autocomplete with coordinates via Nominatim.
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createWorkOrderAction } from "@/actions/sat/createWorkOrder";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { ArrowLeft, Save, MapPin, Home } from "lucide-react";
import Link from "next/link";

interface ClientOption {
  id: string;
  name: string;
  address: string | null;
  location: { lat: number; lng: number } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  clients: ClientOption[];
  categories: CategoryOption[];
}

export function WorkOrderForm({ clients, categories }: Props) {
  const t = useTranslations("sat.workOrder.create");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useClientAddress, setUseClientAddress] = useState(true);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleClientChange = (id: string) => {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client && useClientAddress) {
      setAddress(client.address ?? "");
      setLocation(client.location);
    }
  };

  const handleUseClientAddressToggle = (checked: boolean) => {
    setUseClientAddress(checked);
    if (checked && selectedClient) {
      setAddress(selectedClient.address ?? "");
      setLocation(selectedClient.location);
    }
  };

  const handleAddressChange = useCallback(
    (newAddress: string, newLocation: { lat: number; lng: number } | null) => {
      setAddress(newAddress);
      setLocation(newLocation);
      if (!newLocation) setUseClientAddress(false);
    },
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createWorkOrderAction({
      clientId,
      categoryId,
      title,
      description: description || undefined,
      priority,
      scheduledDate: scheduledDate || undefined,
      estimatedDurationMinutes: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
      notes: notes || undefined,
      address: address || undefined,
      location: location ?? undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push("/sat");
      router.refresh();
    } else {
      setError(result.error ?? t("error"));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/sat"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-[var(--text)]">{t("title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="client" className="mb-1 block text-sm font-medium text-[var(--text)]">
              {t("clientLabel")} <span className="text-red-500">*</span>
            </label>
            <select
              id="client"
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
            >
              <option value="">— Selecciona —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-[var(--text)]">
              {t("categoryLabel")} <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-[var(--text)]">
            {t("titleLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
            placeholder="Ex: Reparació de caldera"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-[var(--text)]"
          >
            {t("descriptionLabel")}
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
          />
        </div>

        {/* Address Section */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
              <MapPin className="h-4 w-4 text-[var(--module-sat)]" />
              Ubicació de l'ordre
            </label>
            {selectedClient && (
              <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={useClientAddress}
                  onChange={(e) => handleUseClientAddressToggle(e.target.checked)}
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
            value={address}
            onChange={handleAddressChange}
            placeholder="Cerca adreça de l'ordre..."
          />

          {location && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <MapPin className="h-3 w-3 text-green-500" />
              <span>
                Coordenades: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
              <a
                href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--module-sat)] hover:underline"
              >
                Veure a Google Maps
              </a>
            </div>
          )}

          {!location && address && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Adreça sense coordenades. Cerca i selecciona una adreça per calcular la distància.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-[var(--text)]">
              {t("priorityLabel")}
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
            >
              <option value="low">Baixa / Baja</option>
              <option value="medium">Mitja / Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="scheduledDate"
              className="mb-1 block text-sm font-medium text-[var(--text)]"
            >
              {t("scheduledDateLabel")}
            </label>
            <input
              id="scheduledDate"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
            />
          </div>

          <div>
            <label
              htmlFor="estimatedDuration"
              className="mb-1 block text-sm font-medium text-[var(--text)]"
            >
              {t("estimatedDurationLabel")}
            </label>
            <input
              id="estimatedDuration"
              type="number"
              min={0}
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-[var(--text)]">
            {t("notesLabel")}
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/sat"
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
          >
            {t("cancel")}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !clientId || !title}
            className="flex items-center gap-1.5 rounded-md bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Creant..." : t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}


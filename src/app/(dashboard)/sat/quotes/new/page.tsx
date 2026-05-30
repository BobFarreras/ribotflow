/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/new/page.tsx
 * Description: Create new quote page with form.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createQuoteAction } from "@/actions/sat/createQuote";
import { ArrowLeft, FileText, Loader2, Plus, Trash2 } from "lucide-react";

interface WorkOrder {
  id: string;
  number: string;
  title: string;
}

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: string;
}

interface QuoteItemForm {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  category: "material" | "labor" | "travel" | "other";
}

interface Props {
  searchParams: Promise<{ otId?: string; templateId?: string }>;
}

export default function NewQuotePage({ searchParams }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otId, setOtId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    validUntil: "",
    taxRate: 21,
    notes: "",
    clientNotes: "",
  });

  const [items, setItems] = useState<QuoteItemForm[]>([
    {
      description: "",
      quantity: 1,
      unit: "unit",
      unitPrice: 0,
      discountPercent: 0,
      category: "material",
    },
  ]);

  useEffect(() => {
    async function load() {
      const params = await searchParams;
      if (params.otId) setOtId(params.otId);
      if (params.templateId) setTemplateId(params.templateId);
    }
    load();
  }, [searchParams]);

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unit: "unit",
        unitPrice: 0,
        discountPercent: 0,
        category: "material",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: QuoteItemForm) => {
    const subtotal = item.quantity * item.unitPrice;
    const discount = (subtotal * item.discountPercent) / 100;
    return subtotal - discount;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const taxAmount = (subtotal * formData.taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otId) {
      setError("Has d'indicar una OT");
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = await createQuoteAction({
      workOrderId: otId,
      clientId: "00000000-0000-0000-0000-000000000000", // TODO: get from OT
      title: formData.title,
      description: formData.description || null,
      validUntil: formData.validUntil || null,
      taxRate: formData.taxRate,
      notes: formData.notes || null,
      clientNotes: formData.clientNotes || null,
      templateId: templateId || null,
      items: items.filter((item) => item.description),
    });

    setIsLoading(false);

    if (result.success && result.data) {
      router.push(`/sat/quotes/${result.data.id}`);
    } else {
      setError(result.error ?? "Error");
    }
  };

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/sat/quotes"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--module-sat)]" />
            <h1 className="text-lg font-semibold text-[var(--text)]">Nou Pressupost</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="mb-4 text-sm font-semibold text-[var(--text)]">Informació bàsica</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  Títol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  Data de caducitat
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData((p) => ({ ...p, validUntil: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  IVA (%)
                </label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData((p) => ({ ...p, taxRate: Number(e.target.value) }))}
                  min="0"
                  max="100"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Línies del pressupost</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-md bg-[var(--bg)] px-2 py-1 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                <Plus className="h-3 w-3" />
                Afegir línia
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 sm:grid-cols-[1fr,auto,auto,auto,auto]"
                >
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Descripció"
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    min="0.01"
                    step="0.01"
                    className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                    min="0"
                    step="0.01"
                    placeholder="Preu"
                    className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                  />
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(index, "category", e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                  >
                    <option value="material">Material</option>
                    <option value="labor">Mà d'obra</option>
                    <option value="travel">Desplaçament</option>
                    <option value="other">Altres</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <div className="flex justify-end space-y-1">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Base imposable</span>
                    <span className="text-[var(--text)]">{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">IVA ({formData.taxRate}%)</span>
                    <span className="text-[var(--text)]">{taxAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-1 text-base font-bold">
                    <span className="text-[var(--text)]">Total</span>
                    <span className="text-[var(--module-sat)]">{total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="mb-4 text-sm font-semibold text-[var(--text)]">Notes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  Notes internes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  Notes per al client
                </label>
                <textarea
                  value={formData.clientNotes}
                  onChange={(e) => setFormData((p) => ({ ...p, clientNotes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link
              href="/sat/quotes"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
            >
              Cancel·lar
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.title || !otId}
              className="flex items-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear pressupost
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

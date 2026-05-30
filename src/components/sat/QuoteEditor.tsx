/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuoteEditor.tsx
 * Description: Professional quote editor with split view (editor + PDF preview).
 *              Features: client auto-fill, IVA calculations, material/labor selection,
 *              real-time totals, and responsive layout.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createQuoteAction } from "@/actions/sat/createQuote";
import { updateQuoteAction } from "@/actions/sat/updateQuote";
import { Search, Plus, Trash2, Loader2, FileText, Eye, Edit3, Package, Users, Car, MoreHorizontal } from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  location: { lat: number; lng: number } | null;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: string | null;
  unitCost: string | null;
  stock: number | null;
}

interface QuoteItemForm {
  id?: string;
  productId: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitCost: number | null;
  discountPercent: number;
  discountAmount: number;
  category: "material" | "labor" | "travel" | "other";
  sortOrder: number;
}

interface ExistingQuote {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  validUntil: string | null;
  taxRate: string;
  notes: string | null;
  clientNotes: string | null;
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    unitCost: string | null;
    discountPercent: string;
    discountAmount: string;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    total: string;
    category: string;
    sortOrder: number;
    productId: string | null;
  }>;
}

interface Props {
  workOrderId: string;
  clients: Client[];
  products: Product[];
  existingQuote?: ExistingQuote;
  mode?: "create" | "edit";
}

/* ============================================================
   CATEGORY CONFIG
   ============================================================ */

const CATEGORIES = [
  { value: "material", label: "Material", icon: Package, color: "text-blue-600" },
  { value: "labor", label: "Mà d'obra", icon: Users, color: "text-emerald-600" },
  { value: "travel", label: "Desplaçament", icon: Car, color: "text-amber-600" },
  { value: "other", label: "Altres", icon: MoreHorizontal, color: "text-gray-600" },
];

const UNITS = [
  { value: "unit", label: "Unitat" },
  { value: "kg", label: "kg" },
  { value: "m", label: "m" },
  { value: "m2", label: "m²" },
  { value: "m3", label: "m³" },
  { value: "l", label: "L" },
  { value: "h", label: "Hora" },
  { value: "day", label: "Dia" },
  { value: "pack", label: "Paquet" },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export function QuoteEditor({
  workOrderId,
  clients,
  products,
  existingQuote,
  mode = "create",
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"split" | "editor" | "preview">("split");

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>(
    existingQuote?.items?.[0]?.productId ? "" : ""
  );
  const [customClient, setCustomClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
  });
  const [useCustomClient, setUseCustomClient] = useState(false);

  const [formData, setFormData] = useState({
    title: existingQuote?.title ?? "",
    description: existingQuote?.description ?? "",
    validUntil: existingQuote?.validUntil?.split("T")[0] ?? "",
    taxRate: Number(existingQuote?.taxRate ?? 21),
    notes: existingQuote?.notes ?? "",
    clientNotes: existingQuote?.clientNotes ?? "",
  });

  const [items, setItems] = useState<QuoteItemForm[]>(
    existingQuote?.items?.length
      ? existingQuote.items.map((item, index) => ({
          id: item.id,
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          unitCost: item.unitCost ? Number(item.unitCost) : null,
          discountPercent: Number(item.discountPercent),
          discountAmount: Number(item.discountAmount),
          category: item.category as QuoteItemForm["category"],
          sortOrder: item.sortOrder ?? index,
        }))
      : [
          {
            productId: null,
            description: "",
            quantity: 1,
            unit: "unit",
            unitPrice: 0,
            unitCost: null,
            discountPercent: 0,
            discountAmount: 0,
            category: "material",
            sortOrder: 0,
          },
        ]
  );

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState<number | null>(null);

  /* ============================================================
     CALCULATIONS
     ============================================================ */

  const calculateItemTotal = useCallback(
    (item: QuoteItemForm) => {
      const subtotal = item.quantity * item.unitPrice;
      const discount =
        item.discountAmount > 0
          ? item.discountAmount
          : (subtotal * item.discountPercent) / 100;
      return subtotal - discount;
    },
    []
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
    [items, calculateItemTotal]
  );

  const taxAmount = useMemo(
    () => (subtotal * formData.taxRate) / 100,
    [subtotal, formData.taxRate]
  );

  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  // Category subtotals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {
      material: 0,
      labor: 0,
      travel: 0,
      other: 0,
    };
    items.forEach((item) => {
      totals[item.category] += calculateItemTotal(item);
    });
    return totals;
  }, [items, calculateItemTotal]);

  /* ============================================================
     CLIENT HANDLING
     ============================================================ */

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setUseCustomClient(false);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setCustomClient({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
        taxId: client.taxId ?? "",
      });
    }
  };

  /* ============================================================
     ITEM HANDLING
     ============================================================ */

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: null,
        description: "",
        quantity: 1,
        unit: "unit",
        unitPrice: 0,
        unitCost: null,
        discountPercent: 0,
        discountAmount: 0,
        category: "material",
        sortOrder: items.length,
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

  const selectProduct = (index: number, product: Product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      description: product.name,
      unitPrice: Number(product.unitPrice ?? 0),
      unitCost: product.unitCost ? Number(product.unitCost) : null,
    };
    setItems(newItems);
    setShowProductPicker(null);
    setProductSearch("");
  };

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku?.toLowerCase().includes(productSearch.toLowerCase())
      ),
    [products, productSearch]
  );

  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit = async () => {
    if (!formData.title) {
      setError("El títol és obligatori");
      return;
    }

    const validItems = items.filter((item) => item.description);
    if (validItems.length === 0) {
      setError("Ha d'haver almenys una línia");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      workOrderId,
      clientId: useCustomClient ? "00000000-0000-0000-0000-000000000000" : selectedClientId,
      title: formData.title,
      description: formData.description || null,
      validUntil: formData.validUntil || null,
      taxRate: formData.taxRate,
      notes: formData.notes || null,
      clientNotes: formData.clientNotes || null,
      items: validItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    };

    const result = mode === "edit" && existingQuote
      ? await updateQuoteAction(existingQuote.id, payload)
      : await createQuoteAction(payload);

    setIsLoading(false);

    if (result.success && result.data) {
      router.push(`/sat/quotes/${result.data.id}`);
    } else {
      setError(result.error ?? "Error");
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  const isLargeScreen = view === "split";

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("split")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "split"
                ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
            }`}
          >
            Dividida
          </button>
          <button
            onClick={() => setView("editor")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "editor"
                ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
            }`}
          >
            <Edit3 className="mr-1 inline h-3 w-3" />
            Editor
          </button>
          <button
            onClick={() => setView("preview")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "preview"
                ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
            }`}
          >
            <Eye className="mr-1 inline h-3 w-3" />
            Preview
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-[var(--text-muted)]">Total</div>
            <div className="text-lg font-bold text-[var(--module-sat)]">
              {total.toFixed(2)} €
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1">
        {/* Editor Panel */}
        <div
          className={`flex flex-col overflow-y-auto border-r border-[var(--border)] ${
            view === "split" ? "w-1/2" : "w-full"
          } ${view === "preview" ? "hidden" : ""}`}
        >
          <div className="space-y-4 p-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Client Selection */}
            <Section title="Client">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUseCustomClient(false)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      !useCustomClient
                        ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
                    }`}
                  >
                    Client existent
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomClient(true)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      useCustomClient
                        ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
                    }`}
                  >
                    Client nou
                  </button>
                </div>

                {!useCustomClient ? (
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                  >
                    <option value="">Seleccionar client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Nom *"
                      value={customClient.name}
                      onChange={(v) => setCustomClient((p) => ({ ...p, name: v }))}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={customClient.email}
                      onChange={(v) => setCustomClient((p) => ({ ...p, email: v }))}
                    />
                    <Input
                      label="Telèfon"
                      type="tel"
                      value={customClient.phone}
                      onChange={(v) => setCustomClient((p) => ({ ...p, phone: v }))}
                    />
                    <Input
                      label="NIF/CIF"
                      value={customClient.taxId}
                      onChange={(v) => setCustomClient((p) => ({ ...p, taxId: v }))}
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Adreça"
                        value={customClient.address}
                        onChange={(v) => setCustomClient((p) => ({ ...p, address: v }))}
                      />
                    </div>
                  </div>
                )}

                {/* Client info display */}
                {selectedClient && !useCustomClient && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedClient.email && (
                        <div>
                          <span className="text-[var(--text-muted)]">Email: </span>
                          <span className="text-[var(--text)]">{selectedClient.email}</span>
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div>
                          <span className="text-[var(--text-muted)]">Telèfon: </span>
                          <span className="text-[var(--text)]">{selectedClient.phone}</span>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="sm:col-span-2">
                          <span className="text-[var(--text-muted)]">Adreça: </span>
                          <span className="text-[var(--text)]">{selectedClient.address}</span>
                        </div>
                      )}
                      {selectedClient.taxId && (
                        <div>
                          <span className="text-[var(--text-muted)]">NIF/CIF: </span>
                          <span className="text-[var(--text)]">{selectedClient.taxId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Basic Info */}
            <Section title="Informació del pressupost">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Títol *"
                    value={formData.title}
                    onChange={(v) => setFormData((p) => ({ ...p, title: v }))}
                    placeholder="Ex: Reparació sistema elèctric"
                  />
                </div>
                <div>
                  <Input
                    label="Data de caducitat"
                    type="date"
                    value={formData.validUntil}
                    onChange={(v) => setFormData((p) => ({ ...p, validUntil: v }))}
                  />
                </div>
                <div>
                  <Input
                    label="IVA (%)"
                    type="number"
                    value={formData.taxRate}
                    onChange={(v) => setFormData((p) => ({ ...p, taxRate: Number(v) }))}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </Section>

            {/* Line Items */}
            <Section
              title={`Línies (${items.length})`}
              action={
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 rounded-md bg-[var(--bg)] px-2 py-1 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <Plus className="h-3 w-3" />
                  Afegir
                </button>
              }
            >
              <div className="space-y-2">
                {items.map((item, index) => (
                  <ItemRow
                    key={index}
                    item={item}
                    index={index}
                    products={products}
                    filteredProducts={filteredProducts}
                    productSearch={productSearch}
                    setProductSearch={setProductSearch}
                    showProductPicker={showProductPicker}
                    setShowProductPicker={setShowProductPicker}
                    onSelectProduct={(product) => selectProduct(index, product)}
                    onUpdate={(field, value) => updateItem(index, field, value)}
                    onRemove={() => removeItem(index)}
                    canRemove={items.length > 1}
                    itemTotal={calculateItemTotal(item)}
                  />
                ))}
              </div>
            </Section>

            {/* Category Summary */}
            <Section title="Resum per categories">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.value}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <cat.icon className={`h-3 w-3 ${cat.color}`} />
                      <span className="text-[11px] text-[var(--text-muted)]">{cat.label}</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                      {categoryTotals[cat.value].toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Textarea
                    label="Notes internes"
                    value={formData.notes}
                    onChange={(v) => setFormData((p) => ({ ...p, notes: v }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Textarea
                    label="Notes per al client"
                    value={formData.clientNotes}
                    onChange={(v) => setFormData((p) => ({ ...p, clientNotes: v }))}
                    rows={3}
                  />
                </div>
              </div>
            </Section>
          </div>
        </div>

        {/* PDF Preview Panel */}
        <div
          className={`flex flex-col overflow-y-auto bg-gray-100 ${
            view === "split" ? "w-1/2" : "w-full"
          } ${view === "editor" ? "hidden" : ""}`}
        >
          <div className="p-4">
            <div className="mx-auto max-w-[595px] bg-white shadow-lg">
              {/* PDF Header */}
              <div className="border-b-2 border-[var(--module-sat)] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--module-sat)]">PRESSUPOST</h1>
                    <p className="mt-1 text-sm text-gray-600">
                      {existingQuote?.number ?? "PRE-2026-0001"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>Data: {new Date().toLocaleDateString("ca-ES")}</p>
                    {formData.validUntil && (
                      <p>
                        Vallidesa:{" "}
                        {new Date(formData.validUntil).toLocaleDateString("ca-ES")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="border-b border-gray-200 p-6">
                <h2 className="mb-2 text-xs font-semibold uppercase text-gray-500">Client</h2>
                <p className="font-medium text-gray-900">
                  {useCustomClient ? customClient.name : selectedClient?.name ?? "—"}
                </p>
                {useCustomClient ? (
                  <>
                    {customClient.email && (
                      <p className="text-sm text-gray-600">{customClient.email}</p>
                    )}
                    {customClient.phone && (
                      <p className="text-sm text-gray-600">{customClient.phone}</p>
                    )}
                    {customClient.address && (
                      <p className="text-sm text-gray-600">{customClient.address}</p>
                    )}
                    {customClient.taxId && (
                      <p className="text-sm text-gray-600">NIF/CIF: {customClient.taxId}</p>
                    )}
                  </>
                ) : (
                  <>
                    {selectedClient?.email && (
                      <p className="text-sm text-gray-600">{selectedClient.email}</p>
                    )}
                    {selectedClient?.phone && (
                      <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                    )}
                    {selectedClient?.address && (
                      <p className="text-sm text-gray-600">{selectedClient.address}</p>
                    )}
                    {selectedClient?.taxId && (
                      <p className="text-sm text-gray-600">NIF/CIF: {selectedClient.taxId}</p>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              {formData.description && (
                <div className="border-b border-gray-200 p-6">
                  <h2 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    Descripció
                  </h2>
                  <p className="text-sm text-gray-700">{formData.description}</p>
                </div>
              )}

              {/* Items Table */}
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-left text-xs font-semibold text-gray-500">#</th>
                      <th className="pb-2 text-left text-xs font-semibold text-gray-500">
                        Descripció
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-500">Qtat</th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-500">Preu</th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .filter((item) => item.description)
                      .map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-gray-500">{index + 1}</td>
                          <td className="py-2 text-gray-900">{item.description}</td>
                          <td className="py-2 text-right text-gray-600">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2 text-right text-gray-600">
                            {item.unitPrice.toFixed(2)} €
                          </td>
                          <td className="py-2 text-right font-medium text-gray-900">
                            {calculateItemTotal(item).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 p-6">
                <div className="ml-auto w-48">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Base imposable</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IVA ({formData.taxRate}%)</span>
                    <span>{taxAmount.toFixed(2)} €</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {formData.clientNotes && (
                <div className="border-t border-gray-200 p-6">
                  <h2 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    Condicions
                  </h2>
                  <p className="text-sm text-gray-600">{formData.clientNotes}</p>
                </div>
              )}

              {/* Signature */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Data: ___/___/______</p>
                    <p className="mt-4 text-xs text-gray-500">Signatura: _____________</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">D'acord amb el pressupost</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
        >
          Cancel·lar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !formData.title}
          className="flex items-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Desar canvis" : "Crear pressupost"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
      />
    </div>
  );
}

function ItemRow({
  item,
  index,
  products,
  filteredProducts,
  productSearch,
  setProductSearch,
  showProductPicker,
  setShowProductPicker,
  onSelectProduct,
  onUpdate,
  onRemove,
  canRemove,
  itemTotal,
}: {
  item: QuoteItemForm;
  index: number;
  products: Product[];
  filteredProducts: Product[];
  productSearch: string;
  setProductSearch: (v: string) => void;
  showProductPicker: number | null;
  setShowProductPicker: (v: number | null) => void;
  onSelectProduct: (product: Product) => void;
  onUpdate: (field: keyof QuoteItemForm, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
  itemTotal: number;
}) {
  const categoryConfig = CATEGORIES.find((c) => c.value === item.category);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-start gap-2">
        {/* Category selector */}
        <select
          value={item.category}
          onChange={(e) => onUpdate("category", e.target.value)}
          className="w-24 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Product search / Description */}
        <div className="relative flex-1">
          <input
            type="text"
            value={item.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            placeholder="Descripció o cercar producte..."
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
            onFocus={() => setShowProductPicker(index)}
          />

          {/* Product picker dropdown */}
          {showProductPicker === index && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
              <div className="border-b border-[var(--border)] p-2">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cercar producte..."
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-center text-sm text-[var(--text-muted)]">
                    Cap producte trobat
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--bg)]"
                    >
                      <div>
                        <div className="font-medium text-[var(--text)]">{product.name}</div>
                        {product.sku && (
                          <div className="text-[11px] text-[var(--text-muted)]">SKU: {product.sku}</div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[var(--text)]">
                        {Number(product.unitPrice ?? 0).toFixed(2)} €
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-[var(--border)] p-2">
                <button
                  type="button"
                  onClick={() => setShowProductPicker(null)}
                  className="w-full rounded-md bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                >
                  Tancar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Quantity, Price, Discount row */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate("quantity", Number(e.target.value))}
            min="0.01"
            step="0.01"
            className="w-16 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-right text-sm text-[var(--text)] outline-none"
          />
          <select
            value={item.unit}
            onChange={(e) => onUpdate("unit", e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1 py-1.5 text-xs text-[var(--text)] outline-none"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[var(--text-muted)]">×</span>

        <input
          type="number"
          value={item.unitPrice}
          onChange={(e) => onUpdate("unitPrice", Number(e.target.value))}
          min="0"
          step="0.01"
          className="w-20 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-right text-sm text-[var(--text)] outline-none"
        />
        <span className="text-[var(--text-muted)]">€</span>

        <span className="text-[var(--text-muted)]">-</span>

        <input
          type="number"
          value={item.discountPercent}
          onChange={(e) => onUpdate("discountPercent", Number(e.target.value))}
          min="0"
          max="100"
          className="w-14 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-right text-sm text-[var(--text)] outline-none"
        />
        <span className="text-[var(--text-muted)]">%</span>

        <div className="ml-auto text-sm font-semibold text-[var(--text)]">
          {itemTotal.toFixed(2)} €
        </div>
      </div>
    </div>
  );
}

/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuoteEditor.tsx
 * Description: Professional quote editor with split view (editor + PDF preview).
 *              Company data left, client data right. Intelligent units.
 *              General discount. Real-time PDF preview.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createQuoteAction } from "@/actions/sat/createQuote";
import { updateQuoteAction } from "@/actions/sat/updateQuote";
import { Plus, Trash2, Loader2, Eye, Edit3, Package, Users, Car, MoreHorizontal, ChevronDown, CheckCircle } from "lucide-react";
import { QuotePdfPreview } from "./QuotePdfPreview";

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
  discountPercent: string;
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
   CONSTANTS
   ============================================================ */

const CATEGORIES = [
  { value: "material", label: "Material", icon: Package, color: "text-blue-600" },
  { value: "labor", label: "Mà d'obra", icon: Users, color: "text-emerald-600" },
  { value: "travel", label: "Desplaçament", icon: Car, color: "text-amber-600" },
  { value: "other", label: "Altres", icon: MoreHorizontal, color: "text-gray-600" },
];

// Units with step: "int" = step 1, "float" = step 0.01
const UNITS = [
  { value: "unit", label: "Unitat", step: "1" },
  { value: "kg", label: "kg", step: "0.01" },
  { value: "g", label: "g", step: "0.01" },
  { value: "m", label: "m", step: "0.01" },
  { value: "m2", label: "m²", step: "0.01" },
  { value: "m3", label: "m³", step: "0.01" },
  { value: "l", label: "L", step: "0.01" },
  { value: "h", label: "Hora", step: "0.5" },
  { value: "day", label: "Dia", step: "0.5" },
  { value: "pack", label: "Paquet", step: "1" },
];

// Simulated company data (will come from settings later)
const COMPANY_DATA = {
  name: "DigitAIStudios",
  nif: "B12345678",
  address: "Carrer Nou 15, 17100 La Bisbal d'Empordà",
  phone: "972 642 100",
  email: "info@ditaistudios.com",
  website: "www.ditaistudios.com",
};

// Default values (will come from company settings later)
const DEFAULT_VALIDITY_DAYS = 30;

const DEFAULT_DESCRIPTION = `Descripció del treball a realitzar:

• Revisió i diagnòstic de l'estat actual
• Execució de les obres segons normativa vigent
• Proves de funcionament i qualitat
• Netegja final de la zona d'intervenció
• Lliurament de documentació tècnica i garanties`;

const DEFAULT_CONDITIONS = `Condicions generals i forma de pagament:

• Forma de pagament: Transferència bancària al compte indicat.
• Mètode de pagament: 50% en efectuar la comanda com a paga i senyal, i el 50% restant al lliurament final i conformitat dels treballs.
• Preus: Aquests preus no inclouen IVA llevat que s'indiqui expressament.
• Validesa: Aquest pressupost és vàlid durant ${DEFAULT_VALIDITY_DAYS} dies a partir de la data d'emissió.
• Garantia: Els treballs disposen de garantia segons legislació vigent.
• Modificacions: Qualsevol variació respecte al pressupost inicial serà comunicada prèviament per escrit.`;

function getDefaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + DEFAULT_VALIDITY_DAYS);
  return date.toISOString().split("T")[0];
}

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
  const [success, setSuccess] = useState<string | null>(null);
  const [view, setView] = useState<"split" | "editor" | "preview">("split");

  // Client state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [customClient, setCustomClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
  });
  const [useCustomClient, setUseCustomClient] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: existingQuote?.description ?? DEFAULT_DESCRIPTION,
    validUntil: existingQuote?.validUntil?.split("T")[0] ?? getDefaultValidUntil(),
    taxRate: Number(existingQuote?.taxRate ?? 21),
    discountPercent: Number(existingQuote?.discountPercent ?? 0),
    clientNotes: existingQuote?.clientNotes ?? DEFAULT_CONDITIONS,
  });

  // Items
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

  const calculateItemTotal = useCallback((item: QuoteItemForm) => {
    const subtotal = item.quantity * item.unitPrice;
    const discount =
      item.discountAmount > 0
        ? item.discountAmount
        : (subtotal * item.discountPercent) / 100;
    return subtotal - discount;
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
    [items, calculateItemTotal]
  );

  const generalDiscount = useMemo(
    () => (subtotal * formData.discountPercent) / 100,
    [subtotal, formData.discountPercent]
  );

  const subtotalAfterDiscount = useMemo(
    () => subtotal - generalDiscount,
    [subtotal, generalDiscount]
  );

  const taxAmount = useMemo(
    () => (subtotalAfterDiscount * formData.taxRate) / 100,
    [subtotalAfterDiscount, formData.taxRate]
  );

  const total = useMemo(() => subtotalAfterDiscount + taxAmount, [subtotalAfterDiscount, taxAmount]);

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

  const getUnitStep = (unit: string) =>
    UNITS.find((u) => u.value === unit)?.step ?? "1";

  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit = async () => {
    if (!workOrderId) {
      setError("Ha d'estar vinculat a una OT");
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
      title: `${useCustomClient ? customClient.name : selectedClient?.name ?? "Pressupost"} - ${new Date().toLocaleDateString("ca-ES")}`,
      description: formData.description || null,
      validUntil: formData.validUntil || null,
      taxRate: formData.taxRate,
      discountPercent: formData.discountPercent,
      notes: null,
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
      setSuccess("Pressupost creat correctament!");
      setTimeout(() => {
        router.push(`/sat/quotes/${result.data.id}`);
      }, 1000);
    } else {
      setError(result.error ?? "Error");
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="flex h-full flex-col">
      {/* Success notification */}
      {/* Toolbar — all in one line */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
        {/* Left: Title + OT badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-[var(--text)]">Nou Pressupost</h1>
          {workOrderId && (
            <span className="rounded bg-[var(--bg)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-muted)]">
              OT
            </span>
          )}
        </div>

        {/* Center: View buttons */}
        <div className="flex items-center gap-1">
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

        {/* Right: Total + Action buttons */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-[var(--text-muted)]">Total</div>
            <div className="text-lg font-bold text-[var(--module-sat)]">
              {total.toFixed(2)} €
            </div>
          </div>
          <div className="h-6 w-px bg-[var(--border)]" />
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
          >
            Cancel·lar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--module-sat)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            {mode === "edit" ? "Desar" : "Crear"}
          </button>
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
          <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Company + Client side by side */}
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
                    <button
                      type="button"
                      onClick={() => setUseCustomClient(false)}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        !useCustomClient
                          ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
                      }`}
                    >
                      Existents
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomClient(true)}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        useCustomClient
                          ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
                      }`}
                    >
                      Nou
                    </button>
                  </div>

                  {!useCustomClient ? (
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleClientSelect(e.target.value)}
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
                      <input
                        type="text"
                        value={customClient.name}
                        onChange={(e) => setCustomClient((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Nom del client"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                      />
                      <input
                        type="email"
                        value={customClient.email}
                        onChange={(e) => setCustomClient((p) => ({ ...p, email: e.target.value }))}
                        placeholder="Email"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                      />
                      <input
                        type="tel"
                        value={customClient.phone}
                        onChange={(e) => setCustomClient((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="Telèfon"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                      />
                      <input
                        type="text"
                        value={customClient.taxId}
                        onChange={(e) => setCustomClient((p) => ({ ...p, taxId: e.target.value }))}
                        placeholder="NIF/CIF"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                      />
                      <input
                        type="text"
                        value={customClient.address}
                        onChange={(e) => setCustomClient((p) => ({ ...p, address: e.target.value }))}
                        placeholder="Adreça"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                      />
                    </div>
                  )}

                  {/* Selected client info */}
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

            {/* Quote Info */}
            <Section title="Pressupost">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Data de caducitat"
                  type="date"
                  value={formData.validUntil}
                  onChange={(v) => setFormData((p) => ({ ...p, validUntil: v }))}
                />
                <Input
                  label="IVA (%)"
                  type="number"
                  value={formData.taxRate}
                  onChange={(v) => setFormData((p) => ({ ...p, taxRate: Number(v) }))}
                  min={0}
                  max={100}
                />
                <Input
                  label="Descompte general (%)"
                  type="number"
                  value={formData.discountPercent}
                  onChange={(v) => setFormData((p) => ({ ...p, discountPercent: Number(v) }))}
                  min={0}
                  max={100}
                />
              </div>
              <div className="mt-3">
                <Textarea
                  label="Descripció del treball"
                  value={formData.description}
                  onChange={(v) => setFormData((p) => ({ ...p, description: v }))}
                  rows={2}
                />
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
                    getUnitStep={getUnitStep}
                  />
                ))}
              </div>
            </Section>

            {/* Notes */}
            <Section title="Condicions / Notes">
              <Textarea
                label="Notes visibles pel client"
                value={formData.clientNotes}
                onChange={(v) => setFormData((p) => ({ ...p, clientNotes: v }))}
                rows={3}
                placeholder="Ex: Pressupost vàlid 30 dies. Preus sense IVA. Desplaçament inclòs."
              />
            </Section>
          </div>
        </div>

        {/* PDF Preview Panel */}
        <div
          className={`flex flex-col overflow-y-auto bg-gray-100 ${
            view === "split" ? "w-1/2" : "w-full"
          } ${view === "editor" ? "hidden" : ""}`}
        >
          <QuotePdfPreview
            quoteNumber={existingQuote?.number ?? "PRE-2026-0001"}
            company={COMPANY_DATA}
            client={
              useCustomClient
                ? customClient
                : selectedClient ?? { name: "—", email: null, phone: null, address: null, taxId: null }
            }
            items={items
              .filter((item) => item.description)
              .map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                total: calculateItemTotal(item),
                category: item.category,
              }))}
            subtotal={subtotal}
            discountPercent={formData.discountPercent}
            discountAmount={generalDiscount}
            taxRate={formData.taxRate}
            taxAmount={taxAmount}
            total={total}
            validUntil={formData.validUntil}
            description={formData.description}
            clientNotes={formData.clientNotes}
          />
        </div>
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
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
        <div className="flex items-center gap-2">
          {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
          <ChevronDown
            className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
      />
    </div>
  );
}

function ItemRow({
  item,
  index,
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
  getUnitStep,
}: {
  item: QuoteItemForm;
  index: number;
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
  getUnitStep: (unit: string) => string;
}) {
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
                  <div className="p-3 text-center text-sm text-[var(--text-muted)]">Cap producte</div>
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
                  className="w-full rounded-md bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
                >
                  Tancar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Quantity, Unit, Price, Discount */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate("quantity", Number(e.target.value))}
          min={item.unit === "unit" || item.unit === "pack" ? "1" : "0.01"}
          step={getUnitStep(item.unit)}
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

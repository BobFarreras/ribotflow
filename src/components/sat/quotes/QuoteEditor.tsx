/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/QuoteEditor.tsx
 * Description: Quote editor orchestrator. Delegates all logic to useQuoteForm hook
 *              and presentation to sub-components.
 */

"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { QuotePdfPreview } from "./QuotePdfPreview";
import { SendQuoteEmailModal } from "./SendQuoteEmailModal";
import { useQuoteForm } from "./hooks/useQuoteForm";
import { QuoteEditorHeader } from "./QuoteEditorHeader";
import { ClientSelector } from "./ClientSelector";
import { ItemRow } from "./ItemRow";
import { Section, Input, Textarea } from "./ui/FormPrimitives";
import type { Props } from "./types";

export function QuoteEditor({
  workOrderId: workOrderIdProp,
  clients,
  products,
  workOrders = [],
  existingQuote,
  mode = "create",
  company,
}: Props) {
  const form = useQuoteForm({
    workOrderId: workOrderIdProp,
    clients,
    products,
    workOrders,
    existingQuote,
    mode,
  });

  return (
    <div className="flex h-full flex-col">
      <QuoteEditorHeader
        mode={mode}
        existingQuote={existingQuote}
        workOrderId={form.workOrderId}
        view={form.view}
        total={form.total}
        isLoading={form.isLoading}
        onViewChange={form.setView}
        onSubmit={form.handleSubmit}
        onEmailClick={() => form.setShowEmailModal(true)}
        onCancel={form.routerBack}
      />

      <div className="flex min-h-0 flex-1">
        {/* Editor Panel */}
        <div
          className={`flex flex-col overflow-y-auto border-r border-[var(--border)] ${
            form.view === "split" ? "w-1/2" : "w-full"
          } ${form.view === "preview" ? "hidden" : ""}`}
        >
          <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
            {form.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {form.error}
              </div>
            )}

            <ClientSelector
              company={company}
              clients={clients}
              selectedClientId={form.selectedClientId}
              selectedClient={form.selectedClient}
              useCustomClient={form.useCustomClient}
              customClient={form.customClient}
              onClientSelect={form.handleClientSelect}
              onToggleCustom={form.setUseCustomClient}
              onCustomChange={form.setCustomClient}
            />

            {/* Work Order Link */}
            <Section title="Vincular a OT" defaultOpen={!!form.workOrderId}>
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Opcional. Vincula aquest pressupost a una ordre de treball existent.
                </p>
                <div className="flex gap-2">
                  <select
                    value={form.workOrderId}
                    onChange={(e) => form.setWorkOrderId(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
                  >
                    <option value="">Sense vincular</option>
                    {workOrders.map((ot) => (
                      <option key={ot.id} value={ot.id}>
                        {ot.number} — {ot.title}
                      </option>
                    ))}
                  </select>
                  <Link
                    href="/sat/new"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
                  >
                    <Plus className="h-3 w-3" />
                    <span className="hidden sm:inline">Nova OT</span>
                  </Link>
                </div>
              </div>
            </Section>

            {/* Quote Info */}
            <Section title="Pressupost">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Data de caducitat"
                  type="date"
                  value={form.formData.validUntil}
                  onChange={(v) => form.setFormData((p) => ({ ...p, validUntil: v }))}
                />
                <Input
                  label="IVA (%)"
                  type="number"
                  value={form.formData.taxRate}
                  onChange={(v) => form.setFormData((p) => ({ ...p, taxRate: Number(v) }))}
                  min={0}
                  max={100}
                />
                <Input
                  label="Descompte general (%)"
                  type="number"
                  value={form.formData.discountPercent}
                  onChange={(v) => form.setFormData((p) => ({ ...p, discountPercent: Number(v) }))}
                  min={0}
                  max={100}
                />
              </div>
              <div className="mt-3">
                <Textarea
                  label="Descripcio del treball"
                  value={form.formData.description}
                  onChange={(v) => form.setFormData((p) => ({ ...p, description: v }))}
                  rows={2}
                />
              </div>
            </Section>

            {/* Line Items */}
            <Section
              title={`Linies (${form.items.length})`}
              action={
                <button
                  type="button"
                  onClick={form.addItem}
                  className="flex items-center gap-1 rounded-md bg-[var(--bg)] px-2 py-1 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <Plus className="h-3 w-3" />
                  Afegir
                </button>
              }
            >
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <ItemRow
                    key={index}
                    item={item}
                    index={index}
                    filteredProducts={form.filteredProducts}
                    productSearch={form.productSearch}
                    setProductSearch={form.setProductSearch}
                    showProductPicker={form.showProductPicker}
                    setShowProductPicker={form.setShowProductPicker}
                    onSelectProduct={(product) => form.selectProduct(index, product)}
                    onUpdate={(field, value) => form.updateItem(index, field, value)}
                    onRemove={() => form.removeItem(index)}
                    canRemove={form.items.length > 1}
                    itemTotal={form.calculateItemTotal(item)}
                    getUnitStep={form.getUnitStep}
                  />
                ))}
              </div>
            </Section>

            {/* Notes */}
            <Section title="Condicions / Notes">
              <Textarea
                label="Notes visibles pel client"
                value={form.formData.clientNotes}
                onChange={(v) => form.setFormData((p) => ({ ...p, clientNotes: v }))}
                rows={3}
                placeholder="Ex: Pressupost valid 30 dies. Preus sense IVA. Desplacament inclos."
              />
            </Section>
          </div>
        </div>

        {/* PDF Preview Panel */}
        <div
          className={`flex flex-col overflow-y-auto bg-gray-100 ${
            form.view === "split" ? "w-1/2" : "w-full"
          } ${form.view === "editor" ? "hidden" : ""}`}
        >
          <QuotePdfPreview
            quoteNumber={existingQuote?.number ?? "PRE-2026-0001"}
            company={{
              name: company.name,
              nif: company.taxId ?? "",
              address: company.address ?? "",
              phone: company.phone ?? "",
              email: company.email ?? "",
            }}
            client={
              form.useCustomClient
                ? form.customClient
                : form.selectedClient ?? { name: "—", email: null, phone: null, address: null, taxId: null }
            }
            items={form.items
              .filter((item) => item.description)
              .map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                total: form.calculateItemTotal(item),
                category: item.category,
              }))}
            subtotal={form.subtotal}
            discountPercent={form.formData.discountPercent}
            discountAmount={form.generalDiscount}
            taxRate={form.formData.taxRate}
            taxAmount={form.taxAmount}
            total={form.total}
            validUntil={form.formData.validUntil}
            description={form.formData.description}
            clientNotes={form.formData.clientNotes}
          />
        </div>
      </div>

      {form.showEmailModal && existingQuote && (
        <SendQuoteEmailModal
          quoteId={existingQuote.id}
          quoteNumber={existingQuote.number}
          clientEmail={form.useCustomClient ? form.customClient.email : form.selectedClient?.email ?? undefined}
          clientName={form.useCustomClient ? form.customClient.name : form.selectedClient?.name ?? undefined}
          isOpen={form.showEmailModal}
          onClose={() => form.setShowEmailModal(false)}
        />
      )}
    </div>
  );
}



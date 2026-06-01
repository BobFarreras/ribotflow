/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/ItemRow.tsx
 * Description: Single editable quote item row with product picker.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { QuoteItemForm, Product } from "./types";

const CATEGORIES = [
  { value: "material", label: "Material" },
  { value: "labor", label: "Ma d'obra" },
  { value: "travel", label: "Desplacament" },
  { value: "other", label: "Altres" },
];

const UNITS = [
  { value: "unit", label: "Unitat", step: "1" },
  { value: "kg", label: "kg", step: "0.01" },
  { value: "g", label: "g", step: "0.01" },
  { value: "m", label: "m", step: "0.01" },
  { value: "m2", label: "m2", step: "0.01" },
  { value: "m3", label: "m3", step: "0.01" },
  { value: "l", label: "L", step: "0.01" },
  { value: "h", label: "Hora", step: "0.5" },
  { value: "day", label: "Dia", step: "0.5" },
  { value: "pack", label: "Paquet", step: "1" },
];

interface ItemRowProps {
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
}

export function ItemRow({
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
}: ItemRowProps) {
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
            placeholder="Descripcio o cercar producte..."
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
                        {Number(product.unitPrice ?? 0).toFixed(2)} EUR
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

        <span className="text-[var(--text-muted)]">x</span>

        <input
          type="number"
          value={item.unitPrice}
          onChange={(e) => onUpdate("unitPrice", Number(e.target.value))}
          min="0"
          step="0.01"
          className="w-20 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-right text-sm text-[var(--text)] outline-none"
        />
        <span className="text-[var(--text-muted)]">EUR</span>

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
          {itemTotal.toFixed(2)} EUR
        </div>
      </div>
    </div>
  );
}

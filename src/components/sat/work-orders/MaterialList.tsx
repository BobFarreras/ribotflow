/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/MaterialList.tsx
 * Description: Client component for managing work order materials.
 *              Supports catalog product selection + free-text materials.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { addMaterialAction } from "@/actions/sat/addMaterial";
import { removeMaterialAction } from "@/actions/sat/removeMaterial";
import type { WorkOrderMaterial, Product } from "@/types/sat";
import { Plus, Trash2, Package, ShoppingCart, Minus } from "lucide-react";

interface Props {
  materials: WorkOrderMaterial[];
  workOrderId: string;
  products: Product[];
}

export function MaterialList({ materials: initialMaterials, workOrderId, products }: Props) {
  const t = useTranslations("sat.materials");
  const [materials, setMaterials] = useState(initialMaterials);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isFreeText, setIsFreeText] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unitPrice: "",
    unitCost: "",
  });

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    if (productId === "__free__") {
      setIsFreeText(true);
      setFormData({ name: "", quantity: "1", unitPrice: "", unitCost: "" });
    } else {
      setIsFreeText(false);
      const product = products.find((p) => p.id === productId);
      if (product) {
        setFormData({
          name: product.name,
          quantity: "1",
          unitPrice: product.unitPrice ?? "",
          unitCost: product.unitCost ?? "",
        });
      }
    }
  };

  const adjustQuantity = (delta: number) => {
    setFormData((d) => {
      const current = parseFloat(d.quantity) || 0;
      const next = Math.max(0.01, current + delta);
      return { ...d, quantity: String(next) };
    });
  };

  const handleAdd = () => {
    if (!formData.quantity) return;
    if (isFreeText && !formData.name) return;

    startTransition(async () => {
      const result = await addMaterialAction({
        workOrderId,
        productId: isFreeText ? null : selectedProductId,
        name: isFreeText ? formData.name : undefined,
        quantity: formData.quantity,
        unitPrice: isFreeText ? formData.unitPrice || null : undefined,
        unitCost: isFreeText ? formData.unitCost || null : undefined,
      });

      if (result.success && result.data) {
        setMaterials((prev) => [...prev, result.data]);
        setFormData({ name: "", quantity: "", unitPrice: "", unitCost: "" });
        setSelectedProductId("");
        setIsFreeText(false);
        setShowForm(false);
      }
    });
  };

  const handleRemove = (materialId: string) => {
    startTransition(async () => {
      const result = await removeMaterialAction(materialId, workOrderId);
      if (result.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      }
    });
  };

  const totalPrice = materials.reduce((sum, m) => {
    const price = m.unitPrice ? parseFloat(m.unitPrice) : 0;
    const qty = parseFloat(m.quantity);
    return sum + price * qty;
  }, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{t("title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={isPending}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addButton")}
        </button>
      </div>

      {showForm && (
        <div className="mb-2 space-y-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] p-2">
          {/* Product selector */}
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[var(--text-muted)]" />
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="">{t("selectProduct")}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ""}
                </option>
              ))}
              <option value="__free__">{t("freeMaterial")}</option>
            </select>
          </div>

          {/* Free text fields */}
          {isFreeText && (
            <input
              type="text"
              placeholder={t("namePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          )}

          {/* Quantity with +/- buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustQuantity(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              step="0.01"
              placeholder={t("quantityPlaceholder")}
              value={formData.quantity}
              onChange={(e) => setFormData((d) => ({ ...d, quantity: e.target.value }))}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-center text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => adjustQuantity(1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Price fields (only for free text) */}
          {isFreeText && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder={t("unitPricePlaceholder")}
                value={formData.unitPrice}
                onChange={(e) => setFormData((d) => ({ ...d, unitPrice: e.target.value }))}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
              <input
                type="number"
                step="0.01"
                placeholder={t("unitCostPlaceholder")}
                value={formData.unitCost}
                onChange={(e) => setFormData((d) => ({ ...d, unitCost: e.target.value }))}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowForm(false); setSelectedProductId(""); setIsFreeText(false); }}
              className="rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleAdd}
              disabled={isPending || !formData.quantity || (!isFreeText && !selectedProductId) || (isFreeText && !formData.name)}
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50"
            >
              {t("submit")}
            </button>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-[var(--text-muted)]">
          <Package className="mb-1 h-5 w-5 opacity-50" />
          <p className="text-xs">{t("empty")}</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
          {materials.map((m) => {
            const qty = parseFloat(m.quantity);
            const price = m.unitPrice ? parseFloat(m.unitPrice) : 0;
            const lineTotal = qty * price;

            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text)]">{m.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {m.quantity} {m.unitPrice && `× ${parseFloat(m.unitPrice).toFixed(2)} €`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.unitPrice && (
                    <span className="text-xs font-medium text-[var(--text)]">
                      {lineTotal.toFixed(2)} €
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={isPending}
                    className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {totalPrice > 0 && (
            <div className="flex justify-end border-t border-[var(--border)] pt-1">
              <span className="text-sm font-semibold text-[var(--text)]">
                {t("total")}: {totalPrice.toFixed(2)} €
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

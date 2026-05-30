/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuoteItemTable.tsx
 * Description: Table displaying quote line items with totals.
 */

"use client";

interface QuoteItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountPercent: string;
  discountAmount: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  category: string;
  sortOrder: number;
}

interface Props {
  items: QuoteItem[];
  quoteStatus: string;
  quoteId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  material: "Material",
  labor: "Mà d'obra",
  travel: "Desplaçament",
  other: "Altres",
};

export function QuoteItemTable({ items, quoteStatus, quoteId }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[var(--text-muted)]">
        No hi ha línies al pressupost
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--border)]">
          <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-muted)]">#</th>
          <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-muted)]">Descripció</th>
          <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-muted)]">Qtat</th>
          <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-muted)]">Preu</th>
          <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-muted)]">Descompte</th>
          <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-muted)]">Subtotal</th>
          <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-muted)]">IVA</th>
          <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-muted)]">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)]">
        {items
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item, index) => (
            <tr key={item.id} className="hover:bg-[var(--bg)]">
              <td className="px-2 py-2 text-[var(--text-muted)]">{index + 1}</td>
              <td className="px-2 py-2">
                <div className="text-[var(--text)]">{item.description}</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </div>
              </td>
              <td className="px-2 py-2 text-right text-[var(--text)]">
                {Number(item.quantity)} {item.unit}
              </td>
              <td className="px-2 py-2 text-right text-[var(--text)]">
                {Number(item.unitPrice).toFixed(2)} €
              </td>
              <td className="px-2 py-2 text-right text-[var(--text-muted)]">
                {Number(item.discountPercent) > 0
                  ? `${Number(item.discountPercent)}%`
                  : Number(item.discountAmount) > 0
                  ? `${Number(item.discountAmount).toFixed(2)} €`
                  : "—"}
              </td>
              <td className="px-2 py-2 text-right text-[var(--text)]">
                {Number(item.subtotal).toFixed(2)} €
              </td>
              <td className="px-2 py-2 text-right text-[var(--text-muted)]">
                {Number(item.taxAmount).toFixed(2)} €
              </td>
              <td className="px-2 py-2 text-right font-medium text-[var(--text)]">
                {Number(item.total).toFixed(2)} €
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

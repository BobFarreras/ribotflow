/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfTotals.tsx
 * Description: Right-aligned totals block (subtotal, discount, tax, total).
 */

import type { QuoteTotals } from "./types";

interface PdfTotalsProps {
  totals: QuoteTotals;
}

export function PdfTotals({ totals }: PdfTotalsProps) {
  return (
    <div style={{ display: "flex", marginBottom: "40px", pageBreakInside: "avoid" }}>
      <div style={{ flex: "0 0 60%" }} />
      <div style={{ flex: "0 0 40%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 10px", fontSize: "10pt", color: "#475569" }}>
                Base Imposable:
              </td>
              <td style={{ padding: "8px 10px", fontSize: "10pt", textAlign: "right" }}>
                {totals.subtotal.toFixed(2)} €
              </td>
            </tr>
            {totals.discountPercent > 0 && (
              <tr>
                <td style={{ padding: "8px 10px", fontSize: "10pt", color: "#16a34a" }}>
                  Descompte ({totals.discountPercent}%):
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    fontSize: "10pt",
                    textAlign: "right",
                    color: "#16a34a",
                  }}
                >
                  -{totals.discountAmount.toFixed(2)} €
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "8px 10px", fontSize: "10pt", color: "#475569" }}>
                IVA ({totals.taxRate}%):
              </td>
              <td style={{ padding: "8px 10px", fontSize: "10pt", textAlign: "right" }}>
                {totals.taxAmount.toFixed(2)} €
              </td>
            </tr>
            <tr>
              <td
                style={{
                  borderTop: "2px solid #1e293b",
                  padding: "12px 10px 8px",
                  fontSize: "12pt",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                TOTAL:
              </td>
              <td
                style={{
                  borderTop: "2px solid #1e293b",
                  padding: "12px 10px 8px",
                  fontSize: "12pt",
                  fontWeight: "bold",
                  color: "#0f172a",
                  textAlign: "right",
                }}
              >
                {totals.total.toFixed(2)} €
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

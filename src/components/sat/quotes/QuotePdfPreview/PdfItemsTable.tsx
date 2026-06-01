/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfItemsTable.tsx
 * Description: Line-items table of the quote.
 */

import { UNIT_LABELS } from "./constants";
import type { QuoteItem } from "./types";

interface PdfItemsTableProps {
  items: QuoteItem[];
}

export function PdfItemsTable({ items }: PdfItemsTableProps) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", marginBottom: "25px" }}>
      <thead>
        <tr>
          <th style={{ backgroundColor: "#1e293b", color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", fontSize: "8.5pt", letterSpacing: "0.5px", padding: "12px 10px", textAlign: "center", width: "8%" }}>
            Ref.
          </th>
          <th style={{ backgroundColor: "#1e293b", color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", fontSize: "8.5pt", letterSpacing: "0.5px", padding: "12px 10px", textAlign: "left", width: "50%" }}>
            Descripció del Concepte
          </th>
          <th style={{ backgroundColor: "#1e293b", color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", fontSize: "8.5pt", letterSpacing: "0.5px", padding: "12px 10px", textAlign: "center", width: "10%" }}>
            Unitats
          </th>
          <th style={{ backgroundColor: "#1e293b", color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", fontSize: "8.5pt", letterSpacing: "0.5px", padding: "12px 10px", textAlign: "right", width: "14%" }}>
            Preu Unitari
          </th>
          <th style={{ backgroundColor: "#1e293b", color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", fontSize: "8.5pt", letterSpacing: "0.5px", padding: "12px 10px", textAlign: "right", width: "14%" }}>
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "center", color: "#64748b", fontSize: "9.5pt" }}>
              {String(index + 1).padStart(3, "0")}
            </td>
            <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top", fontSize: "9.5pt" }}>
              <div style={{ fontWeight: "bold", color: "#1e293b", marginBottom: "4px" }}>
                {item.description}
              </div>
            </td>
            <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "center", fontSize: "9.5pt" }}>
              {item.quantity} {UNIT_LABELS[item.unit] ?? item.unit}
            </td>
            <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontSize: "9.5pt" }}>
              {item.unitPrice.toFixed(2)} €
            </td>
            <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", fontSize: "9.5pt" }}>
              {item.total.toFixed(2)} €
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

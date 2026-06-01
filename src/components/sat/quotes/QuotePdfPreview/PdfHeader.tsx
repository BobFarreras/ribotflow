/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfHeader.tsx
 * Description: Top header of the quote PDF (company name + quote title + number).
 */

import type { CompanyData } from "./types";

interface PdfHeaderProps {
  company: CompanyData;
  quoteNumber: string;
}

export function PdfHeader({ company, quoteNumber }: PdfHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom: "2px solid #e2e8f0",
        paddingBottom: "20px",
        marginBottom: "30px",
      }}
    >
      <div style={{ flex: "0 0 60%" }}>
        <div style={{ fontSize: "22pt", fontWeight: "bold", color: "#1e293b", lineHeight: 1.1 }}>
          {company.name}
        </div>
        <div style={{ fontSize: "10pt", color: "#64748b", marginTop: "5px" }}>
          NIF: {company.nif}
        </div>
      </div>
      <div style={{ flex: "0 0 35%", textAlign: "right" }}>
        <h1 style={{ fontSize: "24pt", fontWeight: 900, color: "#0f172a", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
          Pressupost
        </h1>
        <div style={{ fontSize: "12pt", color: "#475569", marginTop: "5px", fontWeight: "bold" }}>
          NÚM. {quoteNumber}
        </div>
      </div>
    </div>
  );
}

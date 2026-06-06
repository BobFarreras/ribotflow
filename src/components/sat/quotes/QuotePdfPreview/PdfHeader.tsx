/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfHeader.tsx
 * Description: Top header of the quote PDF (logo + company name + quote
 *              title + number). Logo is rendered when the company has
 *              uploaded one, otherwise the text-only fallback is used.
 */

import type { CompanyData } from "./types";

interface PdfHeaderProps {
  company: CompanyData;
  quoteNumber: string;
}

const LOGO_MAX = 64;

export function PdfHeader({ company, quoteNumber }: PdfHeaderProps) {
  const hasLogo = !!company.logoUrl;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom: "2px solid #e2e8f0",
        paddingBottom: "20px",
        marginBottom: "30px",
        gap: "16px",
      }}
    >
      <div style={{ flex: "0 0 60%", display: "flex", alignItems: "center", gap: "14px" }}>
        {hasLogo && (
          <img
            src={company.logoUrl!}
            alt={company.name}
            style={{
              maxWidth: `${LOGO_MAX}px`,
              maxHeight: `${LOGO_MAX}px`,
              width: "auto",
              height: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
        )}
        <div>
          <div style={{ fontSize: "22pt", fontWeight: "bold", color: "#1e293b", lineHeight: 1.1 }}>
            {company.name}
          </div>
          <div style={{ fontSize: "10pt", color: "#64748b", marginTop: "5px" }}>
            NIF: {company.nif}
          </div>
        </div>
      </div>
      <div style={{ flex: "0 0 35%", textAlign: "right" }}>
        <h1
          style={{
            fontSize: "24pt",
            fontWeight: 900,
            color: "#0f172a",
            textTransform: "uppercase",
            letterSpacing: "1px",
            margin: 0,
          }}
        >
          Pressupost
        </h1>
        <div style={{ fontSize: "12pt", color: "#475569", marginTop: "5px", fontWeight: "bold" }}>
          NÚM. {quoteNumber}
        </div>
      </div>
    </div>
  );
}

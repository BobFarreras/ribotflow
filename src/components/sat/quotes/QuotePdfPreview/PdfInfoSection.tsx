/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfInfoSection.tsx
 * Description: Three-column info section (issuer / recipient / dates).
 */

import type { CompanyData, ClientData } from "./types";

interface PdfInfoSectionProps {
  company: CompanyData;
  client: ClientData;
  today: string;
  validUntilDate: string | null;
  daysLeft: number | null;
}

export function PdfInfoSection({
  company,
  client,
  today,
  validUntilDate,
  daysLeft,
}: PdfInfoSectionProps) {
  return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "30px" }}>
      {/* Emissor */}
      <div style={{ flex: "0 0 30%" }}>
        <div
          style={{
            fontSize: "9pt",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#64748b",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          De:
        </div>
        <div
          style={{ fontSize: "11pt", fontWeight: "bold", color: "#1e293b", marginBottom: "5px" }}
        >
          {company.name}
        </div>
        <div style={{ fontSize: "9.5pt", color: "#475569", lineHeight: 1.4 }}>
          {company.address}
          <br />
          Tel: {company.phone}
          <br />
          {company.email}
        </div>
      </div>

      {/* Receptor */}
      <div style={{ flex: "0 0 35%" }}>
        <div
          style={{
            fontSize: "9pt",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#64748b",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          Per a:
        </div>
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f8fafc",
            borderLeft: "4px solid #3b82f6",
            borderRadius: "0 4px 4px 0",
          }}
        >
          <div
            style={{ fontSize: "11pt", fontWeight: "bold", color: "#1e293b", marginBottom: "5px" }}
          >
            {client.name}
          </div>
          <div style={{ fontSize: "9.5pt", color: "#475569", lineHeight: 1.4 }}>
            {client.taxId && (
              <>
                NIF: {client.taxId}
                <br />
              </>
            )}
            {client.address && (
              <>
                {client.address}
                <br />
              </>
            )}
            {client.email && (
              <>
                {client.email}
                <br />
              </>
            )}
            {client.phone && <>Tel: {client.phone}</>}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div style={{ flex: "0 0 30%", paddingLeft: "10px" }}>
        <div
          style={{
            fontSize: "9pt",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#64748b",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          &nbsp;
        </div>
        <div
          style={{
            backgroundColor: "#f1f5f9",
            padding: "12px",
            borderRadius: "6px",
            fontSize: "9.5pt",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 0", fontWeight: "bold", color: "#475569" }}>
                  Data emissió:
                </td>
                <td style={{ padding: "3px 0", textAlign: "right" }}>{today}</td>
              </tr>
              {validUntilDate && (
                <>
                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: "bold", color: "#475569" }}>
                      Validesa:
                    </td>
                    <td style={{ padding: "3px 0", textAlign: "right" }}>{validUntilDate}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: "bold", color: "#475569" }}>
                      Termini:
                    </td>
                    <td style={{ padding: "3px 0", textAlign: "right" }}>{daysLeft} dies</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

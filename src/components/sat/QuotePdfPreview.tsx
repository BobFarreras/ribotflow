/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuotePdfPreview.tsx
 * Description: Professional PDF preview simulating A4 document.
 *              210mm × 297mm proportions with proper margins and flow.
 */

"use client";

/* ============================================================
   TYPES
   ============================================================ */

interface CompanyData {
  name: string;
  nif: string;
  address: string;
  phone: string;
  email: string;
}

interface ClientData {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
}

interface Props {
  quoteNumber: string;
  company: CompanyData;
  client: ClientData;
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  description: string | null;
  clientNotes: string | null;
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const UNIT_LABELS: Record<string, string> = {
  unit: "Ud.",
  kg: "kg",
  g: "g",
  m: "m",
  m2: "m²",
  m3: "m³",
  l: "L",
  h: "h",
  day: "dies",
  pack: "Pq.",
};

/* ============================================================
   COMPONENT
   ============================================================ */

export function QuotePdfPreview({
  quoteNumber,
  company,
  client,
  items,
  subtotal,
  discountPercent,
  discountAmount,
  taxRate,
  taxAmount,
  total,
  validUntil,
  description,
  clientNotes,
}: Props) {
  const validItems = items.filter((item) => item.description);
  const today = new Date().toLocaleDateString("ca-ES");
  const validUntilDate = validUntil
    ? new Date(validUntil).toLocaleDateString("ca-ES")
    : null;
  const daysLeft = validUntil
    ? Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="flex justify-center bg-gray-200 p-6">
      {/* A4 Page Simulation */}
      <div
        className="bg-white shadow-2xl"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm 15mm",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: "#334155",
          fontSize: "10pt",
          lineHeight: "1.5",
        }}
      >
        {/* ── HEADER ── */}
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

        {/* ── INFO SECTION: Company + Client + Dates ── */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "30px" }}>
          {/* Emissor */}
          <div style={{ flex: "0 0 30%" }}>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}>
              De:
            </div>
            <div style={{ fontSize: "11pt", fontWeight: "bold", color: "#1e293b", marginBottom: "5px" }}>
              {company.name}
            </div>
            <div style={{ fontSize: "9.5pt", color: "#475569", lineHeight: 1.4 }}>
              {company.address}<br />
              Tel: {company.phone}<br />
              {company.email}
            </div>
          </div>

          {/* Receptor */}
          <div style={{ flex: "0 0 35%" }}>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}>
              Per a:
            </div>
            <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderLeft: "4px solid #3b82f6", borderRadius: "0 4px 4px 0" }}>
              <div style={{ fontSize: "11pt", fontWeight: "bold", color: "#1e293b", marginBottom: "5px" }}>
                {client.name}
              </div>
              <div style={{ fontSize: "9.5pt", color: "#475569", lineHeight: 1.4 }}>
                {client.taxId && <>NIF: {client.taxId}<br /></>}
                {client.address && <>{client.address}<br /></>}
                {client.email && <>{client.email}<br /></>}
                {client.phone && <>Tel: {client.phone}</>}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={{ flex: "0 0 30%", paddingLeft: "10px" }}>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}>
              &nbsp;
            </div>
            <div style={{ backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "6px", fontSize: "9.5pt" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: "bold", color: "#475569" }}>Data emissió:</td>
                    <td style={{ padding: "3px 0", textAlign: "right" }}>{today}</td>
                  </tr>
                  {validUntilDate && (
                    <>
                      <tr>
                        <td style={{ padding: "3px 0", fontWeight: "bold", color: "#475569" }}>Validesa:</td>
                        <td style={{ padding: "3px 0", textAlign: "right" }}>{validUntilDate}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "3px 0", fontWeight: "bold", color: "#475569" }}>Termini:</td>
                        <td style={{ padding: "3px 0", textAlign: "right" }}>{daysLeft} dies</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        {description && (
          <div style={{ marginBottom: "25px", padding: "15px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
            <div style={{ fontSize: "9pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", marginBottom: "8px" }}>
              Descripció del treball
            </div>
            <div style={{ fontSize: "9.5pt", color: "#475569", whiteSpace: "pre-wrap" }}>{description}</div>
          </div>
        )}

        {/* ── ITEMS TABLE ── */}
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
            {validItems.map((item, index) => (
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

        {/* ── TOTALS ── */}
        <div style={{ display: "flex", marginBottom: "40px", pageBreakInside: "avoid" }}>
          <div style={{ flex: "0 0 60%" }} />
          <div style={{ flex: "0 0 40%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "8px 10px", fontSize: "10pt", color: "#475569" }}>Base Imposable:</td>
                  <td style={{ padding: "8px 10px", fontSize: "10pt", textAlign: "right" }}>{subtotal.toFixed(2)} €</td>
                </tr>
                {discountPercent > 0 && (
                  <tr>
                    <td style={{ padding: "8px 10px", fontSize: "10pt", color: "#ef4444" }}>Descompte ({discountPercent}%):</td>
                    <td style={{ padding: "8px 10px", fontSize: "10pt", textAlign: "right", color: "#ef4444" }}>-{discountAmount.toFixed(2)} €</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: "8px 10px", fontSize: "10pt", color: "#475569" }}>IVA ({taxRate}%):</td>
                  <td style={{ padding: "8px 10px", fontSize: "10pt", textAlign: "right" }}>{taxAmount.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td style={{ borderTop: "2px solid #1e293b", padding: "12px 10px 8px", fontSize: "12pt", fontWeight: "bold", color: "#0f172a" }}>
                    TOTAL:
                  </td>
                  <td style={{ borderTop: "2px solid #1e293b", padding: "12px 10px 8px", fontSize: "12pt", fontWeight: "bold", color: "#0f172a", textAlign: "right" }}>
                    {total.toFixed(2)} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CONDITIONS ── */}
        {clientNotes && (
          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "15px", marginBottom: "40px", pageBreakInside: "avoid" }}>
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#1e293b", marginTop: 0, marginBottom: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Condicions generals i forma de pagament
            </div>
            <div style={{ fontSize: "9pt", color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {clientNotes}
            </div>
          </div>
        )}

        {/* ── SIGNATURE ── */}
        <div style={{ display: "flex", alignItems: "flex-end", marginTop: "40px", pageBreakInside: "avoid" }}>
          <div style={{ flex: "0 0 50%" }}>
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#1e293b", marginBottom: "5px", textTransform: "uppercase" }}>
              Acceptació del Pressupost
            </div>
            <div style={{ fontSize: "8.5pt", color: "#64748b", marginBottom: "45px" }}>
              Per aprovar i formalitzar la comanda, si us plau, signeu i retorneu aquest document.
            </div>
            <div style={{ width: "250px", borderTop: "1px solid #94a3b8", marginBottom: "5px" }} />
            <div style={{ fontSize: "8.5pt", color: "#64748b" }}>Signatura del client i data</div>
          </div>
          <div style={{ flex: "0 0 50%", textAlign: "right", alignSelf: "flex-end" }}>
            <div style={{ fontSize: "8.5pt", color: "#94a3b8" }}>Gràcies per la seva confiança.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

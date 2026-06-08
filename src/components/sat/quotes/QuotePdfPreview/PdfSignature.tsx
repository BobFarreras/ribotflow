/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfSignature.tsx
 * Description: Signature block at the bottom of the quote PDF.
 */

export function PdfSignature() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        marginTop: "40px",
        pageBreakInside: "avoid",
      }}
    >
      <div style={{ flex: "0 0 50%" }}>
        <div
          style={{
            fontSize: "10pt",
            fontWeight: "bold",
            color: "#1e293b",
            marginBottom: "5px",
            textTransform: "uppercase",
          }}
        >
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
  );
}

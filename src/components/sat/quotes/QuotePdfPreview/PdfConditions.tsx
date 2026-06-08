/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfConditions.tsx
 * Description: General conditions + payment terms block (only rendered when clientNotes is set).
 */

interface PdfConditionsProps {
  clientNotes: string;
}

export function PdfConditions({ clientNotes }: PdfConditionsProps) {
  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        padding: "15px",
        marginBottom: "40px",
        pageBreakInside: "avoid",
      }}
    >
      <div
        style={{
          fontSize: "10pt",
          fontWeight: "bold",
          color: "#1e293b",
          marginTop: 0,
          marginBottom: "10px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "5px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Condicions generals i forma de pagament
      </div>
      <div style={{ fontSize: "9pt", color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
        {clientNotes}
      </div>
    </div>
  );
}

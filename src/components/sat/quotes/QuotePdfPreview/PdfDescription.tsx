/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/PdfDescription.tsx
 * Description: Work description block (only rendered when description is set).
 */

interface PdfDescriptionProps {
  description: string;
}

export function PdfDescription({ description }: PdfDescriptionProps) {
  return (
    <div
      style={{
        marginBottom: "25px",
        padding: "15px",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
      }}
    >
      <div
        style={{
          fontSize: "9pt",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "#64748b",
          marginBottom: "8px",
        }}
      >
        Descripció del treball
      </div>
      <div style={{ fontSize: "9.5pt", color: "#475569", whiteSpace: "pre-wrap" }}>
        {description}
      </div>
    </div>
  );
}

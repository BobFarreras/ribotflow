/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/PdfGenerator.tsx
 * Description: Client button to generate or download a work order PDF.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { generatePdfAction } from "@/actions/sat/generatePdf";
import { FileText, Loader2 } from "lucide-react";

interface Props {
  workOrderId: string;
  pdfUrl?: string | null;
}

export function PdfGenerator({ workOrderId, pdfUrl }: Props) {
  const t = useTranslations("sat.pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(pdfUrl);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePdfAction(workOrderId);
      if (result.success && result.data?.url) {
        setCurrentUrl(result.data.url);
        window.open(result.data.url, "_blank");
      } else {
        alert(result.error ?? t("error"));
      }
    } catch {
      alert(t("error"));
    } finally {
      setIsGenerating(false);
    }
  };

  if (currentUrl) {
    return (
      <a
        href={currentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
      >
        <FileText className="h-4 w-4 text-[var(--module-sat)]" />
        {t("download")}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating}
      className="flex items-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {isGenerating ? t("generating") : t("generate")}
    </button>
  );
}

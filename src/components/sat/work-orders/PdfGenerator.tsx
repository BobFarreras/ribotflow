/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/PdfGenerator.tsx
 * Description: Client button to generate, download or delete a work order PDF
 *              with language selector.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { generatePdfAction } from "@/actions/sat/generatePdf";
import { deletePdfAction } from "@/actions/sat/deletePdf";
import { FileText, Loader2, Globe, Trash2 } from "lucide-react";

interface Props {
  workOrderId: string;
  pdfUrl?: string | null;
}

type Lang = "ca" | "es" | "en";

const LANG_LABELS: Record<Lang, string> = {
  ca: "Català",
  es: "Castellano",
  en: "English",
};

export function PdfGenerator({ workOrderId, pdfUrl }: Props) {
  const t = useTranslations("sat.workOrder.pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(pdfUrl);
  const [lang, setLang] = useState<Lang>("ca");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePdfAction(workOrderId, lang);
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

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm") ?? "Delete this PDF?")) return;
    setIsDeleting(true);
    try {
      const result = await deletePdfAction(workOrderId);
      if (result.success) {
        setCurrentUrl(null);
      } else {
        alert(result.error ?? t("error"));
      }
    } catch {
      alert(t("error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Language selector */}
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-[var(--text-muted)]" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          disabled={isGenerating || isDeleting}
          className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
        >
          {(Object.keys(LANG_LABELS) as Lang[]).map((k) => (
            <option key={k} value={k}>
              {LANG_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {currentUrl ? (
        <div className="space-y-2">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
          >
            <FileText className="h-4 w-4 text-[var(--module-sat)]" />
            {t("download")}
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || isDeleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isGenerating ? t("generating") : t("regenerate")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isGenerating || isDeleting}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              title={t("delete")}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || isDeleting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isGenerating ? t("generating") : t("generate")}
        </button>
      )}
    </div>
  );
}

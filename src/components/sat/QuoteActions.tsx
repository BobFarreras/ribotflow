/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuoteActions.tsx
 * Description: Action buttons for quote status changes.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteStatusAction } from "@/actions/sat/updateQuoteStatus";
import { deleteQuoteAction } from "@/actions/sat/deleteQuote";
import { Send, CheckCircle, XCircle, Trash2, RotateCcw, Loader2 } from "lucide-react";

interface Quote {
  id: string;
  status: string;
}

interface Props {
  quote: Quote;
}

export function QuoteActions({ quote }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (status: string, reason?: string) => {
    setIsLoading(true);
    try {
      const result = await updateQuoteStatusAction(quote.id, { status, reason });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Estàs segur que vols eliminar aquest pressupost?")) return;
    setIsLoading(true);
    try {
      const result = await deleteQuoteAction(quote.id);
      if (result.success) {
        router.push("/sat/quotes");
      } else {
        alert(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--module-sat)]" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Draft actions */}
      {quote.status === "draft" && (
        <>
          <button
            onClick={() => handleStatusChange("sent")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Send className="h-4 w-4" />
            Enviar pressupost
          </button>
          <button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </>
      )}

      {/* Sent actions */}
      {quote.status === "sent" && (
        <>
          <button
            onClick={() => handleStatusChange("accepted")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <CheckCircle className="h-4 w-4" />
            Acceptar
          </button>
          <button
            onClick={() => handleStatusChange("rejected")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Rebutjar
          </button>
        </>
      )}

      {/* Rejected/expired: can revive */}
      {(quote.status === "rejected" || quote.status === "expired") && (
        <button
          onClick={() => handleStatusChange("draft")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
        >
          <RotateCcw className="h-4 w-4" />
          Revisar i reenviar
        </button>
      )}

      {/* Cancelled: can reactivate */}
      {quote.status === "cancelled" && (
        <button
          onClick={() => handleStatusChange("draft")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
        >
          <RotateCcw className="h-4 w-4" />
          Reactivar
        </button>
      )}

      {/* Accepted: final state */}
      {quote.status === "accepted" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-700">
          Pressupost acceptat
        </div>
      )}
    </div>
  );
}

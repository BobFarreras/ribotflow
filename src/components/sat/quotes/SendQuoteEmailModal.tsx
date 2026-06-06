/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/SendQuoteEmailModal.tsx
 * Description: Modal dialog to send a quote via email.
 *              Pre-fills client email if available, allows custom subject/message.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendQuoteEmailAction } from "@/actions/sat/quotes/sendQuoteEmail";
import { X, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  quoteId: string;
  quoteNumber: string;
  clientEmail?: string;
  clientName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SendQuoteEmailModal({
  quoteId,
  quoteNumber,
  clientEmail,
  clientName,
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(clientEmail ?? "");
  const [subject, setSubject] = useState(`Pressupost ${quoteNumber}`);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMsg("Introdueix una adreÃ§a d'email");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const result = await sendQuoteEmailAction({
        quoteId,
        recipientEmail: email.trim(),
        recipientName: clientName,
        subject: subject.trim() || `Pressupost ${quoteNumber}`,
        message: message.trim() || undefined,
      });

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      } else {
        setErrorMsg(result.error ?? "Error en enviar l'email");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error de connexiÃ³");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={status === "sending" ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--module-sat)]/10">
              <Mail className="h-4 w-4 text-[var(--module-sat)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Enviar pressupost</h3>
              <p className="text-xs text-[var(--text-muted)]">{quoteNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status === "sending"}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-[var(--text)]">Email enviat correctament!</p>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Destinatari *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@exemple.com"
                  required
                  disabled={status === "sending"}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)] disabled:opacity-50"
                />
                {clientName && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Client: {clientName}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Assumpte
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`Pressupost ${quoteNumber}`}
                  disabled={status === "sending"}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)] disabled:opacity-50"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Missatge (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Afegiu un missatge personalitzat..."
                  rows={3}
                  disabled={status === "sending"}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)] disabled:opacity-50"
                />
              </div>

              {/* Error */}
              {status === "error" && errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === "sending"}
                  className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)] disabled:opacity-50"
                >
                  CancelÂ·lar
                </button>
                <button
                  type="submit"
                  disabled={status === "sending" || !email.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviant...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

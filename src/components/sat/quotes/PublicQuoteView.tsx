/**
 * Creation/modification date: 12/06/2026
 * Path: src/components/sat/quotes/PublicQuoteView.tsx
 * Description: Client component for public quote view.
 *              Shows quote details and accept/reject buttons.
 */

"use client";

import { useState } from "react";
import type { PublicQuoteData } from "@/actions/sat/quotes/publicQuote";
import { acceptQuotePublicAction, rejectQuotePublicAction } from "@/actions/sat/quotes/publicQuote";
import { FileCheck, XCircle, Clock, CheckCircle, FileText } from "lucide-react";

interface Props {
  quote: PublicQuoteData;
  token: string;
}

type ActionState = "idle" | "accept" | "reject";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  sent: { label: "Enviat", icon: Clock, color: "text-[color:var(--info)]" },
  accepted: { label: "Acceptat", icon: CheckCircle, color: "text-[color:var(--success)]" },
  rejected: { label: "Rebutjat", icon: XCircle, color: "text-[color:var(--danger)]" },
  expired: { label: "Expirat", icon: Clock, color: "text-[color:var(--warning)]" },
};

const CATEGORY_LABELS: Record<string, string> = {
  material: "Material",
  labor: "Mà d'obra",
  travel: "Desplaçament",
  other: "Altres",
};

export function PublicQuoteView({ quote, token }: Props) {
  const [action, setAction] = useState<ActionState>("idle");
  const [acceptedBy, setAcceptedBy] = useState("");
  const [acceptedByEmail, setAcceptedByEmail] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    pdfUrl?: string;
  } | null>(null);

  const statusCfg = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.sent;
  const StatusIcon = statusCfg.icon;
  const canAct = quote.status === "sent";
  const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date();

  async function handleAccept() {
    if (!acceptedBy.trim()) return;
    setLoading(true);
    const res = await acceptQuotePublicAction({
      token,
      acceptedBy: acceptedBy.trim(),
      acceptedByEmail: acceptedByEmail.trim() || undefined,
    });
    setResult(res);
    setLoading(false);
    if (res.success) setAction("idle");
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading(true);
    const res = await rejectQuotePublicAction({ token, reason: rejectReason.trim() });
    setResult(res);
    setLoading(false);
    if (res.success) setAction("idle");
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[color:var(--text)]">{quote.companyName}</h1>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">Pressupost {quote.number}</p>
        </div>

        {/* Status badge */}
        <div className="mb-6 flex justify-center">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusCfg.color} bg-[color:var(--surface)] border border-[color:var(--border)]`}
          >
            <StatusIcon className="h-4 w-4" />
            {statusCfg.label}
          </span>
        </div>

        {/* Quote card */}
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 text-lg font-semibold text-[color:var(--text)]">{quote.title}</h2>

          {quote.description && (
            <p className="mb-4 text-sm text-[color:var(--text-muted)]">{quote.description}</p>
          )}

          {/* Items table */}
          {quote.items.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border)]">
                    <th className="pb-2 font-medium text-[color:var(--text-muted)]">Descripció</th>
                    <th className="pb-2 text-right font-medium text-[color:var(--text-muted)]">
                      Qtat
                    </th>
                    <th className="pb-2 text-right font-medium text-[color:var(--text-muted)]">
                      Preu
                    </th>
                    <th className="pb-2 text-right font-medium text-[color:var(--text-muted)]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, i) => (
                    <tr key={i} className="border-b border-[color:var(--border)]/50">
                      <td className="py-2">
                        <span className="text-[color:var(--text)]">{item.description}</span>
                        <span className="ml-2 text-xs text-[color:var(--text-subtle)]">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </span>
                      </td>
                      <td className="py-2 text-right text-[color:var(--text-muted)]">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2 text-right text-[color:var(--text-muted)]">
                        {Number(item.unitPrice).toFixed(2)} €
                      </td>
                      <td className="py-2 text-right font-medium text-[color:var(--text)]">
                        {Number(item.total).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 border-t border-[color:var(--border)] pt-4">
            <div className="flex gap-8 text-sm">
              <span className="text-[color:var(--text-muted)]">Subtotal</span>
              <span className="font-medium text-[color:var(--text)]">
                {Number(quote.subtotal).toFixed(2)} €
              </span>
            </div>
            {Number(quote.discountPercent) > 0 && (
              <div className="flex gap-8 text-sm">
                <span className="text-[color:var(--text-muted)]">
                  Descompte ({quote.discountPercent}%)
                </span>
                <span className="font-medium text-[color:var(--success)]">
                  -{Number(quote.discountPercent).toFixed(2)}%
                </span>
              </div>
            )}
            <div className="flex gap-8 text-sm">
              <span className="text-[color:var(--text-muted)]">IVA ({quote.taxRate}%)</span>
              <span className="font-medium text-[color:var(--text)]">
                {Number(quote.taxAmount).toFixed(2)} €
              </span>
            </div>
            <div className="flex gap-8 text-lg font-bold">
              <span className="text-[color:var(--text)]">Total</span>
              <span className="text-[color:var(--primary)]">
                {Number(quote.total).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Validity */}
          {quote.validUntil && (
            <p className="mt-4 text-center text-xs text-[color:var(--text-subtle)]">
              Valides fins al{" "}
              {new Date(quote.validUntil).toLocaleDateString("ca-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {isExpired && <span className="ml-1 text-[color:var(--danger)]">(expirat)</span>}
            </p>
          )}

          {/* Client notes */}
          {quote.clientNotes && (
            <div className="mt-4 rounded-lg bg-[color:var(--bg)] p-3">
              <p className="text-xs font-medium text-[color:var(--text-muted)]">Notes:</p>
              <p className="mt-1 text-sm text-[color:var(--text)]">{quote.clientNotes}</p>
            </div>
          )}
        </div>

        {/* Result message */}
        {result && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              result.success
                ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5 text-[color:var(--success)]"
                : "border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5 text-[color:var(--danger)]"
            }`}
          >
            {result.success
              ? action === "accept"
                ? "Pressupost acceptat correctament!"
                : "Pressupost rebutjat."
              : result.error}
          </div>
        )}

        {/* Actions */}
        {canAct && !isExpired && !result?.success && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {action === "idle" && (
              <>
                <button
                  onClick={() => setAction("accept")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[color:var(--success)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[color:var(--success)]/90"
                >
                  <FileCheck className="h-4 w-4" />
                  Acceptar pressupost
                </button>
                <button
                  onClick={() => setAction("reject")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-medium text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-hover)]"
                >
                  <XCircle className="h-4 w-4" />
                  Rebutjar
                </button>
              </>
            )}

            {action === "accept" && (
              <div className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[color:var(--text)]">
                  Confirmar acceptació
                </h3>
                <input
                  type="text"
                  placeholder="El vostre nom *"
                  value={acceptedBy}
                  onChange={(e) => setAcceptedBy(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-subtle)] focus:border-[color:var(--primary)] focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email (opcional)"
                  value={acceptedByEmail}
                  onChange={(e) => setAcceptedByEmail(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-subtle)] focus:border-[color:var(--primary)] focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    disabled={!acceptedBy.trim() || loading}
                    className="flex-1 rounded-lg bg-[color:var(--success)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[color:var(--success)]/90 disabled:opacity-50"
                  >
                    {loading ? "Enviant..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => {
                      setAction("idle");
                      setResult(null);
                    }}
                    className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-hover)]"
                  >
                    Cancel·lar
                  </button>
                </div>
              </div>
            )}

            {action === "reject" && (
              <div className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[color:var(--text)]">
                  Motiu del rebuig
                </h3>
                <textarea
                  placeholder="Expliqueu el motiu del rebuig *"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="mb-3 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-subtle)] focus:border-[color:var(--primary)] focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || loading}
                    className="flex-1 rounded-lg bg-[color:var(--danger)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[color:var(--danger)]/90 disabled:opacity-50"
                  >
                    {loading ? "Enviant..." : "Confirmar rebuig"}
                  </button>
                  <button
                    onClick={() => {
                      setAction("idle");
                      setResult(null);
                    }}
                    className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-hover)]"
                  >
                    Cancel·lar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download PDF */}
        {(quote.status === "accepted" || quote.status === "sent") && result?.pdfUrl && (
          <div className="mt-4 text-center">
            <a
              href={result.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[color:var(--primary)] underline-offset-2 hover:underline"
            >
              Descarregar PDF signat
            </a>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[color:var(--text-subtle)]">
          {quote.companyName} — Enviat via RIBOTFLOW
        </p>
      </div>
    </div>
  );
}

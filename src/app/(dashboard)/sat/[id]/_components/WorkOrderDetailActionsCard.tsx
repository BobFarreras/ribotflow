/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(dashboard)/sat/[id]/_components/WorkOrderDetailActionsCard.tsx
 * Description: Right-column card with status actions, technician assignment,
 *              client signature, and PDF generator. Stacked vertically.
 */

"use client";

import { FileCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { WorkOrderActions } from "@/components/sat/work-orders/WorkOrderActions";
import { TechnicianAssigner } from "@/components/sat/work-orders/TechnicianAssigner";
import { SignatureCanvas } from "@/components/sat/work-orders/SignatureCanvas";
import { PdfGenerator } from "@/components/sat/work-orders/PdfGenerator";
import type { WorkOrderStatus } from "@/types/sat";

interface TechnicianOption {
  id: string;
  name: string;
  email: string | null;
}

interface SignatureSummary {
  id: string;
  signedBy: string;
  createdAt: Date;
}

interface WorkOrderDetailActionsCardProps {
  workOrderId: string;
  status: WorkOrderStatus;
  technician: TechnicianOption | null;
  technicians: TechnicianOption[];
  signature: SignatureSummary | null;
  pdfUrl: string | null;
  canSign: boolean;
  isTechnician: boolean;
}

export function WorkOrderDetailActionsCard({
  workOrderId,
  status,
  technician,
  technicians,
  signature,
  pdfUrl,
  canSign,
  isTechnician,
}: WorkOrderDetailActionsCardProps) {
  const t = useTranslations("sat.workOrder");

  return (
    <>
      <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {t("detail.actionsTitle")}
        </h2>
        <WorkOrderActions workOrderId={workOrderId} currentStatus={status} />
      </div>

      {!isTechnician && (
        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("detail.assignTitle")}
          </h2>
          <TechnicianAssigner
            workOrderId={workOrderId}
            currentTechnicianId={technician?.id ?? null}
            technicians={technicians}
          />
        </div>
      )}

      {canSign && (
        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("detail.signature")}
          </h2>
          {signature ? (
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-[var(--text)]">
                Signat per <span className="font-medium">{signature.signedBy}</span>
              </span>
            </div>
          ) : (
            <SignatureCanvas workOrderId={workOrderId} />
          )}
        </div>
      )}

      <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {t("pdf.title")}
        </h2>
        <PdfGenerator workOrderId={workOrderId} pdfUrl={pdfUrl} />
      </div>
    </>
  );
}

/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(dashboard)/sat/[id]/_components/WorkOrderDetailMainContent.tsx
 * Description: Three-column layout for the work order detail page.
 */

"use client";

import { useTranslations } from "next-intl";
import { MaterialList } from "@/components/sat/work-orders/MaterialList";
import { AttachmentSection } from "@/components/sat/work-orders/AttachmentSection";
import { StatusHistorySection } from "@/components/sat/work-orders/StatusHistorySection";
import { WorkOrderDetailActionsCard } from "./WorkOrderDetailActionsCard";
import { WorkOrderDetailQuotesCard } from "./WorkOrderDetailQuotesCard";
import { WorkOrderDetailLocationCard } from "./WorkOrderDetailLocationCard";
import type {
  WorkOrderMaterial,
  WorkOrderAttachment,
  WorkOrderLocation,
  WorkOrderStatus,
  Product,
} from "@/types/sat";

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

interface QuoteSummary {
  id: string;
  number: string;
  title: string;
  status: string;
  total: string;
}

interface WorkOrderDetailMainContentProps {
  workOrderId: string;
  description: string | null;
  history: any[];
  materials: WorkOrderMaterial[];
  products: Product[];
  attachments: WorkOrderAttachment[];
  signature: SignatureSummary | null;
  technician: TechnicianOption | null;
  technicians: TechnicianOption[];
  quotes: QuoteSummary[];
  locations: WorkOrderLocation[];
  lastCheckIn: { lat: number; lng: number; createdAt: Date } | null;
  clientLocation: { lat: number; lng: number } | null;
  pdfUrl: string | null;
  status: WorkOrderStatus;
  canSign: boolean;
  canCheckIn: boolean;
  isTechnician: boolean;
}

export function WorkOrderDetailMainContent(props: WorkOrderDetailMainContentProps) {
  const t = useTranslations("sat.workOrder");
  const {
    workOrderId,
    description,
    history,
    materials,
    products,
    attachments,
    signature,
    technician,
    technicians,
    quotes,
    locations,
    lastCheckIn,
    clientLocation,
    pdfUrl,
    status,
    canSign,
    canCheckIn,
    isTechnician,
  } = props;

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-3 px-4 py-3">
      {/* Left: Description + History */}
      <div className="flex min-h-0 w-[34%] flex-col gap-3">
        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("create.descriptionLabel")}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-[var(--text)]">{description}</p>
          ) : (
            <p className="text-sm italic text-[var(--text-muted)]">Sense descripció</p>
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("detail.statusHistory")}
          </h2>
          <div className="min-h-0 overflow-y-auto pr-1">
            <StatusHistorySection history={history} />
          </div>
        </div>
      </div>

      {/* Center: Materials + Attachments */}
      <div className="flex min-h-0 w-[33%] flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <MaterialList materials={materials} workOrderId={workOrderId} products={products} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <AttachmentSection attachments={attachments} workOrderId={workOrderId} />
        </div>
      </div>

      {/* Right: Actions + Meta + Quote + Location */}
      <div className="flex min-h-0 w-[33%] flex-col gap-3">
        <WorkOrderDetailActionsCard
          workOrderId={workOrderId}
          status={status}
          technician={technician as any}
          technicians={technicians}
          signature={signature}
          pdfUrl={pdfUrl}
          canSign={canSign}
          isTechnician={isTechnician}
        />
        <WorkOrderDetailQuotesCard workOrderId={workOrderId} quotes={quotes} />
        {(canCheckIn || locations.length > 0) && (
          <WorkOrderDetailLocationCard
            workOrderId={workOrderId}
            clientLocation={clientLocation}
            lastCheckIn={lastCheckIn}
            locations={locations as any}
            canCheckIn={canCheckIn}
            isTechnician={isTechnician}
          />
        )}
      </div>
    </main>
  );
}

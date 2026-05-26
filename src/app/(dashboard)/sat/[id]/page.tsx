/**
 * Creation/modification date: 26/05/2026
 * Path: src/app/(dashboard)/sat/[id]/page.tsx
 * Description: Work order detail page — orchestrates data fetching and delegates
 *              presentation to focused components (SoC / SOLID).
 */

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/workOrderService";
import { materialService } from "@/services/sat/materialService";
import { productService } from "@/services/sat/productService";
import { attachmentService } from "@/services/sat/attachmentService";
import { signatureService } from "@/services/sat/signatureService";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WorkOrderActions } from "@/components/sat/WorkOrderActions";
import { TechnicianAssigner } from "@/components/sat/TechnicianAssigner";
import { MaterialList } from "@/components/sat/MaterialList";
import { AttachmentSection } from "@/components/sat/AttachmentSection";
import { SignatureCanvas } from "@/components/sat/SignatureCanvas";
import { WorkOrderStatusBadge } from "@/components/sat/WorkOrderStatusBadge";
import { StatusHistorySection } from "@/components/sat/StatusHistorySection";
import { ClientInfoCard } from "@/components/sat/ClientInfoCard";
import { CategoryInfoCard } from "@/components/sat/CategoryInfoCard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return null;
  }

  const { id } = await params;
  const companyId = session.user.companyId;
  const t = await getTranslations("sat.workOrder");

  const order = await workOrderService.getByIdWithRelations(companyId, id);
  if (!order) {
    notFound();
  }

  const history = await workOrderService.getStatusHistory(id);
  const technicians = await workOrderService.getTechniciansByCompany(companyId);
  const materials = await materialService.getByWorkOrder(companyId, id);
  const products = await productService.getByCompany(companyId);
  const attachments = await attachmentService.getByWorkOrder(companyId, id);
  const signature = await signatureService.getByWorkOrder(companyId, id);
  const userRole = session.user.role;

  const { workOrder, client, category } = order;
  const canSign = workOrder.status === "completed" || workOrder.status === "closed";

  return (
    <div className="flex-1 bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sat"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {workOrder.number}
              </span>
              <h1 className="text-lg font-semibold text-[var(--text)]">{workOrder.title}</h1>
            </div>
          </div>
          <WorkOrderStatusBadge status={workOrder.status} size="md" />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main column */}
          <div className="space-y-4 lg:col-span-7">
            {/* Status history */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
                {t("detail.statusHistory")}
              </h2>
              <StatusHistorySection history={history} />
            </div>

            {/* Description */}
            {workOrder.description && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">
                  {t("create.descriptionLabel")}
                </h2>
                <p className="whitespace-pre-wrap text-sm text-[var(--text-muted)]">
                  {workOrder.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ClientInfoCard client={client} />
              <CategoryInfoCard category={category} />
            </div>

            <MaterialList materials={materials} workOrderId={workOrder.id} products={products} />

            <AttachmentSection attachments={attachments} workOrderId={workOrder.id} />

            {/* Signature */}
            {canSign && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
                  {t("detail.signature")}
                </h2>
                {signature ? (
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--text-muted)]">
                      Signed by:{" "}
                      <span className="font-medium text-[var(--text)]">{signature.signedBy}</span>
                    </p>
                    {signature.signaturePngUrl ? (
                      <img
                        src={signature.signaturePngUrl}
                        alt="Signature"
                        className="max-h-32 rounded border border-[var(--border)] bg-white"
                      />
                    ) : (
                      <div
                        className="rounded border border-[var(--border)] bg-white p-2"
                        dangerouslySetInnerHTML={{ __html: signature.signatureSvg }}
                      />
                    )}
                  </div>
                ) : (
                  <SignatureCanvas workOrderId={workOrder.id} />
                )}
              </div>
            )}

            {/* Technician assignment */}
            {userRole !== "TECHNICIAN" && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
                  {t("detail.assignTitle")}
                </h2>
                <TechnicianAssigner
                  workOrderId={workOrder.id}
                  currentTechnicianId={order.technician?.id ?? null}
                  technicians={technicians}
                />
              </div>
            )}

            {/* Actions */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
                {t("detail.actionsTitle")}
              </h2>
              <WorkOrderActions workOrderId={workOrder.id} currentStatus={workOrder.status} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

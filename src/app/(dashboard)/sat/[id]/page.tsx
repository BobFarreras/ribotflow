/**
 * Creation/modification date: 24/05/2026
 * Path: src/app/(dashboard)/sat/[id]/page.tsx
 * Description: Work order detail page with status history and actions.
 */

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/workOrderService";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WorkOrderActions } from "@/components/sat/WorkOrderActions";
import { TechnicianAssigner } from "@/components/sat/TechnicianAssigner";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
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
  const userRole = session.user.role;

  function statusBadgeColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "assigned":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "paused":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "completed":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "closed":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  const { workOrder, client, category } = order;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/sat"
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
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeColor(workOrder.status)}`}
          >
            {t(`list.status.${workOrder.status}`)}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
                {t("detail.statusHistory")}
              </h2>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--module-sat)]" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text)]">
                          {h.statusFrom ? (
                            <>
                              <span className="capitalize">{h.statusFrom}</span>{" "}
                              <span className="text-[var(--text-muted)]">→</span>{" "}
                              <span className="capitalize">{h.statusTo}</span>
                            </>
                          ) : (
                            <span className="capitalize">{h.statusTo}</span>
                          )}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(h.createdAt).toLocaleString("ca-ES")}
                        </span>
                      </div>
                      {h.reason && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{h.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)]">Sense historial</p>
                )}
              </div>
            </div>

            {workOrder.description && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">
                  {t("create.descriptionLabel")}
                </h2>
                <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                  {workOrder.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
                {t("list.columns.client")}
              </h2>
              <div className="text-sm text-[var(--text)]">
                <p className="font-medium">{client.name}</p>
                {client.phone && <p className="mt-1 text-[var(--text-muted)]">{client.phone}</p>}
                {client.email && <p className="text-[var(--text-muted)]">{client.email}</p>}
                {client.address && <p className="text-[var(--text-muted)]">{client.address}</p>}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
                {t("list.columns.category")}
              </h2>
              <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                {category.color && (
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <span>{category.name}</span>
              </div>
            </div>

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

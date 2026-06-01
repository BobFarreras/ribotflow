/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/[id]/page.tsx
 * Description: Work order detail page — compact dashboard layout that fits
 *              entirely within the viewport. No vertical scroll.
 */

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/workOrderService";
import { materialService } from "@/services/sat/materialService";
import { productService } from "@/services/sat/productService";
import { attachmentService } from "@/services/sat/attachmentService";
import { signatureService } from "@/services/sat/signatureService";
import { locationService } from "@/services/sat/locationService";
import { quoteService } from "@/services/sat/quoteService";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Calendar, FileText, FileCheck, User, Wrench, Car, Route, Euro, FilePlus } from "lucide-react";
import { WorkOrderActions } from "@/components/sat/work-orders/WorkOrderActions";
import { TechnicianAssigner } from "@/components/sat/work-orders/TechnicianAssigner";
import { MaterialList } from "@/components/sat/work-orders/MaterialList";
import { AttachmentSection } from "@/components/sat/work-orders/AttachmentSection";
import { SignatureCanvas } from "@/components/sat/work-orders/SignatureCanvas";
import { CheckInButton } from "@/components/sat/work-orders/CheckInButton";
import { WorkOrderStatusBadge } from "@/components/sat/shared/WorkOrderStatusBadge";
import { WorkOrderPriorityBadge } from "@/components/sat/shared/WorkOrderPriorityBadge";
import { StatusHistorySection } from "@/components/sat/work-orders/StatusHistorySection";
import { GoogleMapsLink } from "@/components/sat/shared/GoogleMapsLink";
import { PdfGenerator } from "@/components/sat/work-orders/PdfGenerator";
import { CategoryIcon } from "@/components/sat/shared/CategoryIcon";
import { QuoteStatusBadge } from "@/components/sat/quotes/QuoteStatusBadge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;
  const t = await getTranslations("sat.workOrder");

  const order = await workOrderService.getByIdWithRelations(companyId, id);
  if (!order) notFound();

  const history = await workOrderService.getStatusHistory(id);
  const technicians = await workOrderService.getTechniciansByCompany(companyId);
  const materials = await materialService.getByWorkOrder(companyId, id);
  const products = await productService.getByCompany(companyId);
  const attachments = await attachmentService.getByWorkOrder(companyId, id);
  const signature = await signatureService.getByEntity(companyId, "work_order", id);
  const locations = await locationService.getByWorkOrder(companyId, id);
  const lastLocation = await locationService.getLastLocation(companyId, id);
  const quotes = await quoteService.getByWorkOrder(companyId, id);
  const userRole = session.user.role;

  const { workOrder, client, category } = order;
  const canSign = workOrder.status === "completed" || workOrder.status === "closed";
  const canCheckIn = workOrder.status === "assigned" || workOrder.status === "in_progress";

  // Travel cost
  const travelCost = workOrder.travelDistanceKm && session.user.travelRatePerKm
    ? parseFloat(workOrder.travelDistanceKm) * parseFloat(session.user.travelRatePerKm)
    : null;

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sat"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-xs font-mono font-medium text-[var(--text-muted)]">
                {workOrder.number}
              </span>
              <h1 className="text-lg font-semibold text-[var(--text)]">{workOrder.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WorkOrderPriorityBadge priority={workOrder.priority} />
            <WorkOrderStatusBadge status={workOrder.status} size="sm" />
          </div>
        </div>
      </header>

      {/* ── Info strip ── */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <Link
              href={`/sat/clients/${client.id}`}
              className="transition-colors hover:text-[var(--module-sat)] hover:underline"
            >
              {client.name}
            </Link>
            {client.phone && (
              <a href={`tel:${client.phone}`} className="ml-1 text-[var(--module-sat)] hover:underline">
                <Phone className="inline h-3 w-3" />
              </a>
            )}
          </span>
          <span className="flex items-center gap-1">
            <CategoryIcon slug={category.icon ?? category.slug} color={category.color} size={12} />
            {category.name}
          </span>
          {workOrder.scheduledDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(workOrder.scheduledDate).toLocaleDateString("ca-ES", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          )}
          {workOrder.travelDistanceKm && (
            <span className="flex items-center gap-1">
              <Route className="h-3 w-3" />
              {workOrder.travelDistanceKm} km
              {workOrder.travelDurationMinutes && (
                <span className="text-[10px] opacity-70">
                  ({Math.floor(workOrder.travelDurationMinutes / 60)}h {workOrder.travelDurationMinutes % 60}m)
                </span>
              )}
            </span>
          )}
          {travelCost !== null && (
            <span className="flex items-center gap-1">
              <Euro className="h-3 w-3" />
              {travelCost.toFixed(2)} €
            </span>
          )}
          {client.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {client.address}
              {client.location && <GoogleMapsLink lat={client.location.lat} lng={client.location.lng} label="Mapa" />}
            </span>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-3 px-4 py-3">
        {/* Left: Description + History */}
        <div className="flex min-h-0 w-[34%] flex-col gap-3">
          {/* Description */}
          <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t("create.descriptionLabel")}
            </h2>
            {workOrder.description ? (
              <p className="text-sm leading-relaxed text-[var(--text)]">
                {workOrder.description}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--text-muted)]">Sense descripció</p>
            )}
          </div>

          {/* Status history */}
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
            <MaterialList materials={materials} workOrderId={workOrder.id} products={products} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <AttachmentSection attachments={attachments} workOrderId={workOrder.id} />
          </div>
        </div>

        {/* Right: Actions + Meta + Quote */}
        <div className="flex min-h-0 w-[33%] flex-col gap-3">
          {/* Actions */}
          <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t("detail.actionsTitle")}
            </h2>
            <WorkOrderActions workOrderId={workOrder.id} currentStatus={workOrder.status} />
          </div>

          {/* Technician */}
          {userRole !== "TECHNICIAN" && (
            <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t("detail.assignTitle")}
              </h2>
              <TechnicianAssigner
                workOrderId={workOrder.id}
                currentTechnicianId={order.technician?.id ?? null}
                technicians={technicians}
              />
            </div>
          )}

          {/* Signature */}
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
                <SignatureCanvas workOrderId={workOrder.id} />
              )}
            </div>
          )}

          {/* PDF */}
          <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t("pdf.title")}
            </h2>
            <PdfGenerator workOrderId={workOrder.id} pdfUrl={workOrder.pdfUrl} />
          </div>

          {/* Quotes */}
          <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Pressupostos ({quotes.length})
              </h2>
              <Link
                href={`/sat/quotes/new?otId=${workOrder.id}`}
                className="flex items-center gap-1 rounded-md bg-[var(--module-sat)]/10 px-2 py-1 text-xs font-medium text-[var(--module-sat)] transition-colors hover:bg-[var(--module-sat)]/20"
              >
                <FilePlus className="h-3 w-3" />
                Nou
              </Link>
            </div>
            {quotes.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <FileText className="h-4 w-4" />
                Sense pressupostos
              </div>
            ) : (
              <div className="space-y-2">
                {quotes.slice(0, 3).map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/sat/quotes/${quote.id}`}
                    className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 transition-colors hover:border-[var(--module-sat)]/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {quote.number}
                        </span>
                        <QuoteStatusBadge status={quote.status as any} size="sm" />
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text)] truncate">
                        {quote.title}
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-semibold text-[var(--text)]">
                      {Number(quote.total).toFixed(2)} €
                    </span>
                  </Link>
                ))}
                {quotes.length > 3 && (
                  <Link
                    href="/sat/quotes"
                    className="block text-center text-xs text-[var(--module-sat)] hover:underline"
                  >
                    Veure tots ({quotes.length})
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Check-in / Location */}
          {(canCheckIn || locations.length > 0) && (
            <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Localització
              </h2>
              {canCheckIn && userRole === "TECHNICIAN" && (
                <CheckInButton
                  workOrderId={workOrder.id}
                  clientLocation={client.location}
                  lastCheckIn={lastLocation ? { lat: Number(lastLocation.lat), lng: Number(lastLocation.lng), createdAt: lastLocation.createdAt } : null}
                />
              )}
              {locations.length > 0 && (
                <div className="mt-2 space-y-1">
                  {locations.slice(0, 3).map((loc) => (
                    <div key={loc.id} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-[var(--text)]">{loc.eventType.replace("_", " ")}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(loc.createdAt).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

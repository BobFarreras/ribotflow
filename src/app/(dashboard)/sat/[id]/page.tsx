/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/[id]/page.tsx
 * Description: Work order detail page. Orchestrator: auth, data fetch, render.
 */

import { auth } from "@/lib/auth";
import {
  workOrderService,
  materialService,
  productService,
  attachmentService,
  signatureService,
  locationService,
} from "@/services/sat/work-orders";
import { quoteService } from "@/services/sat/quotes/quoteService";
import { notFound } from "next/navigation";
import type { WorkOrderStatus } from "@/types/sat";
import { WorkOrderDetailHeader } from "./_components/WorkOrderDetailHeader";
import { WorkOrderDetailInfoStrip } from "./_components/WorkOrderDetailInfoStrip";
import { WorkOrderDetailMainContent } from "./_components/WorkOrderDetailMainContent";
import { normalizeLocations } from "./_lib/normalizeLocations";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;

  const order = await workOrderService.getByIdWithRelations(companyId, id);
  if (!order) notFound();

  const [
    history,
    technicians,
    materials,
    products,
    attachments,
    signature,
    locations,
    lastLocation,
    quotes,
  ] = await Promise.all([
    workOrderService.getStatusHistory(id),
    workOrderService.getTechniciansByCompany(companyId),
    materialService.getByWorkOrder(companyId, id),
    productService.getByCompany(companyId),
    attachmentService.getByWorkOrder(companyId, id),
    signatureService.getByEntity(companyId, "work_order", id),
    locationService.getByWorkOrder(companyId, id),
    locationService.getLastLocation(companyId, id),
    quoteService.getByWorkOrder(companyId, id),
  ]);

  const { workOrder, client, category, technician } = order;
  const isTechnician = session.user.role === "TECHNICIAN";
  const canSign = workOrder.status === "completed" || workOrder.status === "closed";
  const canCheckIn = workOrder.status === "assigned" || workOrder.status === "in_progress";
  const travelCost =
    workOrder.travelDistanceKm && session.user.travelRatePerKm
      ? Number(workOrder.travelDistanceKm) * Number(session.user.travelRatePerKm)
      : null;
  const numericClientLocation = client.location
    ? { lat: Number(client.location.lat), lng: Number(client.location.lng) }
    : null;

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      <WorkOrderDetailHeader
        number={workOrder.number}
        title={workOrder.title}
        priority={workOrder.priority}
        status={workOrder.status}
      />
      <WorkOrderDetailInfoStrip
        client={client}
        category={category}
        scheduledDate={workOrder.scheduledDate}
        travelDistanceKm={workOrder.travelDistanceKm}
        travelDurationMinutes={workOrder.travelDurationMinutes}
        travelCost={travelCost}
      />
      <WorkOrderDetailMainContent
        workOrderId={workOrder.id}
        description={workOrder.description}
        history={history}
        materials={materials}
        products={products}
        attachments={attachments}
        signature={signature}
        technician={technician ? { id: technician.id, name: technician.name, email: null } : null}
        technicians={technicians}
        quotes={quotes as any}
        locations={normalizeLocations(locations) as any}
        lastCheckIn={
          lastLocation
            ? {
                lat: Number(lastLocation.lat),
                lng: Number(lastLocation.lng),
                createdAt: lastLocation.createdAt,
              }
            : null
        }
        clientLocation={numericClientLocation}
        pdfUrl={workOrder.pdfUrl}
        status={workOrder.status as WorkOrderStatus}
        canSign={canSign}
        canCheckIn={canCheckIn}
        isTechnician={isTechnician}
      />
    </div>
  );
}

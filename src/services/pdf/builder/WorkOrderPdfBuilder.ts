/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/builder/WorkOrderPdfBuilder.ts
 * Description: Builds a work order PDF document by composing layout components.
 */

import { rgb } from "pdf-lib";
import { PdfBuilder } from "./PdfBuilder";
import { drawWorkOrderHeader } from "../layout/components/WorkOrderHeader";
import { drawMaterialsTable } from "../layout/components/MaterialsTable";
import { drawPhotoGrid } from "../layout/components/PhotoGrid";
import { drawWorkOrderSignature } from "../layout/components/WorkOrderSignature";
import { LABELS } from "../labels";
import { fmtDate } from "../utils/format";
import type { MaterialRow, PhotoRow } from "../types";

export interface WorkOrderPdfData {
  workOrderNumber: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyLegalText: string | null;
  companyWebsite: string | null;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  status: string;
  priority: string;
  categoryName: string;
  scheduledDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  description: string | null;
  materials: MaterialRow[];
  photos: PhotoRow[];
  signaturePngUrl: string | null;
  signedBy: string | null;
}

export async function buildWorkOrderPdf(builder: PdfBuilder, data: WorkOrderPdfData) {
  const t = LABELS[builder.lang];

  await drawWorkOrderHeader(builder, data.workOrderNumber, data.companyName, data.companyLogoUrl);

  // Generated date
  builder.drawText(`${t.generated}: ${new Date().toLocaleDateString("ca-ES")}`, 48, builder.y, {
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
  });
  builder.addSpace(28);

  // Client section
  builder.drawSectionTitle(t.client);
  builder.drawInfoGrid([
    { label: t.name, value: data.clientName },
    ...(data.clientPhone ? [{ label: t.phone, value: data.clientPhone }] : []),
    ...(data.clientEmail ? [{ label: t.email, value: data.clientEmail }] : []),
    ...(data.clientAddress ? [{ label: t.address, value: data.clientAddress }] : []),
  ]);
  builder.addSpace(20);

  // Work order details
  builder.drawSectionTitle(t.workOrderDetails);
  builder.drawInfoGrid([
    { label: t.status, value: data.status },
    { label: t.priority, value: data.priority },
    { label: t.category, value: data.categoryName },
    { label: t.scheduled, value: fmtDate(data.scheduledDate) },
    ...(data.startedAt ? [{ label: t.started, value: fmtDate(data.startedAt) }] : []),
    ...(data.completedAt ? [{ label: t.completed, value: fmtDate(data.completedAt) }] : []),
  ]);
  builder.addSpace(20);

  // Description
  if (data.description) {
    builder.drawSectionTitle(t.description);
    builder.drawDescription(data.description);
    builder.addSpace(20);
  }

  // Materials
  if (data.materials.length > 0) {
    builder.drawSectionTitle(t.materials);
    drawMaterialsTable(builder, data.materials);
    builder.addSpace(20);
  }

  // Photos
  if (data.photos.length > 0) {
    builder.drawSectionTitle(t.attachments);
    await drawPhotoGrid(builder, data.photos);
    builder.addSpace(20);
  }

  // Signature
  if (data.signaturePngUrl || data.signedBy) {
    builder.drawSectionTitle(t.signature);
    await drawWorkOrderSignature(builder, data.signaturePngUrl, data.signedBy);
  }

  // Legal footer (per-tenant)
  if (data.companyLegalText || data.companyWebsite) {
    const { drawLegalFooter } = await import("../layout/components/LegalFooter");
    drawLegalFooter(builder, { legalText: data.companyLegalText, website: data.companyWebsite });
  }

  // Footer on last page
  builder.drawFooter();
}

/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/addAttachment.ts
 * Description: Server Action to upload an attachment file and save metadata.
 *              Uses human-readable storage keys organized by client folder.
 */

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { attachmentService } from "@/services/sat/work-orders/attachmentService";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { buildWorkOrderAttachmentKey, type StorageContext } from "@/lib/utils/storageKeys";
import { revalidatePath } from "next/cache";

const ALLOWED_TYPES = {
  "image/jpeg": "photo",
  "image/png": "photo",
  "image/gif": "photo",
  "image/webp": "photo",
  "video/mp4": "video",
  "application/pdf": "document",
  "audio/mpeg": "audio",
} as const;

const MAX_SIZE_MB = 10;

export async function addAttachmentAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    const workOrderId = formData.get("workOrderId") as string;
    const isBefore = formData.get("isBefore") === "true";
    const caption = formData.get("caption") as string | null;
    const customFileName = formData.get("fileName") as string | null;

    if (!file || !workOrderId) {
      return { success: false, error: "Missing file or work order ID" };
    }

    const fileName = customFileName?.trim() || file.name;

    const attachmentType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!attachmentType) {
      return { success: false, error: `File type not allowed: ${file.type}` };
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { success: false, error: `File too large (max ${MAX_SIZE_MB}MB)` };
    }

    const companyId = session.user.companyId;

    // Fetch work order with relations (client info) for human-readable storage key
    const orderData = await workOrderService.getByIdWithRelations(companyId, workOrderId);
    if (!orderData) {
      return { success: false, error: "Work order not found" };
    }
    const { workOrder, client } = orderData;

    // Fetch company for tenantSlug (cloud mode folder prefix)
    const [company] = await db
      .select({ tenantSlug: companies.tenantSlug })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const ctx: StorageContext = {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self_hosted" ? "self_hosted" : "cloud",
      companyId,
      tenantSlug: company?.tenantSlug,
      clientId: client.id,
      clientName: client.name,
    };

    const storageKey = buildWorkOrderAttachmentKey(ctx, workOrder.number, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());

    let width: number | undefined;
    let height: number | undefined;
    if (attachmentType === "photo") {
      try {
        const { imageSize } = await import("image-size");
        const size = imageSize(buffer);
        width = size?.width;
        height = size?.height;
      } catch {
        // ignore if image-size fails
      }
    }

    const attachment = await attachmentService.create(companyId, {
      workOrderId,
      uploadedBy: session.user.id as string,
      type: attachmentType,
      fileName: fileName,
      mimeType: file.type,
      sizeBytes: file.size,
      width,
      height,
      isBefore,
      caption: caption || undefined,
      fileBuffer: buffer,
      storageKey,
    });

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true, data: attachment };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to upload attachment" };
  }
}

/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/addAttachment.ts
 * Description: Server Action to upload an attachment file and save metadata.
 *              Uses human-readable storage keys (workOrderNumber + fileName).
 */

"use server";

import { auth } from "@/lib/auth";
import { attachmentService } from "@/services/sat/attachmentService";
import { workOrderService } from "@/services/sat/workOrderService";
import { buildAttachmentStorageKey } from "@/lib/utils/storageKeys";
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

    if (!file || !workOrderId) {
      return { success: false, error: "Missing file or work order ID" };
    }

    const attachmentType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!attachmentType) {
      return { success: false, error: `File type not allowed: ${file.type}` };
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { success: false, error: `File too large (max ${MAX_SIZE_MB}MB)` };
    }

    const companyId = session.user.companyId;

    // Fetch work order number for human-readable storage key
    const order = await workOrderService.getById(companyId, workOrderId);
    if (!order) {
      return { success: false, error: "Work order not found" };
    }

    const storageKey = buildAttachmentStorageKey(
      "sat",
      companyId,
      order.number,
      file.name
    );

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
      fileName: file.name,
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

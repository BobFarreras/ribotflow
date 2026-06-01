/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/saveSignature.ts
 * Description: Server Action to save a digital signature for a work order.
 *              Validates work-order-specific rules before delegating to the
 *              generic SignatureService.
 */

"use server";

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { signatureService } from "@/services/sat/work-orders/signatureService";
import { revalidatePath } from "next/cache";

const MAX_SVG_LENGTH = 500_000; // 500KB max SVG string

export async function saveSignatureAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const workOrderId = formData.get("workOrderId") as string;
    const signedBy = formData.get("signedBy") as string;
    const signatureSvg = formData.get("signatureSvg") as string;
    const signaturePng = formData.get("signaturePng") as File | null;

    if (!workOrderId || !signedBy || !signatureSvg) {
      return { success: false, error: "Missing required fields" };
    }

    if (signatureSvg.length > MAX_SVG_LENGTH) {
      return { success: false, error: "Signature data too large" };
    }

    // Work-order-specific validations
    const order = await workOrderService.getById(session.user.companyId, workOrderId);
    if (!order) {
      return { success: false, error: "Work order not found or access denied" };
    }

    const allowedStatuses = ["completed", "closed"];
    if (!allowedStatuses.includes(order.status)) {
      return { success: false, error: "Signature can only be captured when work order is completed or closed" };
    }

    let pngBuffer: Buffer | undefined;
    if (signaturePng && signaturePng.size > 0) {
      pngBuffer = Buffer.from(await signaturePng.arrayBuffer());
    }

    const signature = await signatureService.save(
      session.user.companyId,
      order.number,
      {
        entityType: "work_order",
        entityId: workOrderId,
        signedBy,
        signatureSvg,
        signaturePngBuffer: pngBuffer,
      }
    );

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true, data: signature };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to save signature" };
  }
}

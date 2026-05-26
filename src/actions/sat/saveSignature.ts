/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/saveSignature.ts
 * Description: Server Action to save a digital signature (SVG + optional PNG).
 */

"use server";

import { auth } from "@/lib/auth";
import { signatureService } from "@/services/sat/signatureService";
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

    let pngBuffer: Buffer | undefined;
    if (signaturePng && signaturePng.size > 0) {
      pngBuffer = Buffer.from(await signaturePng.arrayBuffer());
    }

    const signature = await signatureService.save(session.user.companyId, {
      workOrderId,
      signedBy,
      signatureSvg,
      signaturePngBuffer: pngBuffer,
    });

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true, data: signature };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to save signature" };
  }
}

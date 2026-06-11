/**
 * Creation/modification date: 11/06/2026
 * Path: src/actions/sat/clients/updateClient.ts
 * Description: Server Action to update a SAT client. Validates with Zod, enforces company_id.
 */

"use server";

import { auth } from "@/lib/auth";
import { clientService } from "@/services/sat/clients/clientService";
import { clientSchema } from "@/lib/validators/sat/clientSchema";
import { revalidatePath } from "next/cache";

export async function updateClientAction(clientId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = clientSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const companyId = session.user.companyId;

    const location =
      parsed.data.lat != null && parsed.data.lng != null
        ? { lat: parsed.data.lat, lng: parsed.data.lng }
        : null;

    const client = await clientService.update(companyId, clientId, {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      taxId: parsed.data.taxId,
      location,
      website: parsed.data.website,
      notes: parsed.data.notes,
      fiscalData: parsed.data.fiscalData,
      categoryId: parsed.data.categoryId,
    });

    revalidatePath("/sat/clients");
    revalidatePath(`/sat/clients/${clientId}`);
    revalidatePath("/sat");

    return { success: true, data: client };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update client" };
  }
}

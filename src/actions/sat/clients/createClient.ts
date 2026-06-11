/**
 * Creation/modification date: 27/05/2026
 * Path: src/actions/sat/createClient.ts
 * Description: Server Action to create a SAT client.
 */

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema/sat";
import { clientSchema } from "@/lib/validators/sat/clientSchema";
import { revalidatePath } from "next/cache";

export async function createClientAction(input: unknown) {
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

    const [client] = await db
      .insert(clients)
      .values({
        companyId,
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
      })
      .returning();

    revalidatePath("/sat/clients");
    revalidatePath("/sat");

    return { success: true, data: client };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create client" };
  }
}

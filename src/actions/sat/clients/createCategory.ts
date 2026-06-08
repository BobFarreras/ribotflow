/**
 * Creation/modification date: 27/05/2026
 * Path: src/actions/sat/createCategory.ts
 * Description: Server Action to create a work order category.
 */

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workOrderCategories } from "@/db/schema/sat";
import { categorySchema } from "@/lib/validators/sat/categorySchema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const companyId = session.user.companyId;

    // If setting as default, unset other defaults
    if (parsed.data.isDefault) {
      await db
        .update(workOrderCategories)
        .set({ isDefault: false })
        .where(eq(workOrderCategories.companyId, companyId));
    }

    const [category] = await db
      .insert(workOrderCategories)
      .values({
        companyId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        color: parsed.data.color,
        icon: parsed.data.icon,
        isDefault: parsed.data.isDefault,
        sortOrder: parsed.data.sortOrder,
      })
      .returning();

    revalidatePath("/sat/categories");
    revalidatePath("/sat");

    return { success: true, data: category };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("unique constraint")) {
        return { success: false, error: "A category with this slug already exists" };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create category" };
  }
}

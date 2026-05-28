/**
 * Creation/modification date: 27/05/2026
 * Path: src/actions/sat/updateCategory.ts
 * Description: Server Action to update a work order category.
 */

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workOrderCategories } from "@/db/schema/sat";
import { categorySchema } from "@/lib/validators/sat/categorySchema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCategoryAction(categoryId: string, input: unknown) {
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

    // Verify the category belongs to this company
    const [existing] = await db
      .select()
      .from(workOrderCategories)
      .where(and(eq(workOrderCategories.id, categoryId), eq(workOrderCategories.companyId, companyId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Category not found" };
    }

    // If setting as default, unset other defaults
    if (parsed.data.isDefault) {
      await db
        .update(workOrderCategories)
        .set({ isDefault: false })
        .where(eq(workOrderCategories.companyId, companyId));
    }

    const [updated] = await db
      .update(workOrderCategories)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        color: parsed.data.color,
        icon: parsed.data.icon,
        isDefault: parsed.data.isDefault,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(workOrderCategories.id, categoryId))
      .returning();

    revalidatePath("/sat/categories");
    revalidatePath("/sat");
    revalidatePath(`/sat/categories/${categoryId}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("unique constraint")) {
        return { success: false, error: "A category with this slug already exists" };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update category" };
  }
}

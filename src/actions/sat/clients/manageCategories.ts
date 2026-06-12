/**
 * Creation/modification date: 11/06/2026
 * Path: src/actions/sat/clients/manageCategories.ts
 * Description: Server Actions for managing client categories (create, update, delete).
 */

"use server";

import { auth } from "@/lib/auth";
import { categoryService } from "@/services/sat/clients/categoryService";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "El nom és obligatori").max(100),
  color: z.string().max(7).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

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

    const category = await categoryService.create(session.user.companyId, parsed.data);

    revalidatePath("/sat/clients");
    return { success: true, data: category };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create category" };
  }
}

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

    const category = await categoryService.update(session.user.companyId, categoryId, parsed.data);

    revalidatePath("/sat/clients");
    return { success: true, data: category };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await categoryService.delete(session.user.companyId, categoryId);

    revalidatePath("/sat/clients");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete category" };
  }
}

/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/getProducts.ts
 * Description: Server Action to fetch product catalog for a company.
 */

"use server";

import { auth } from "@/lib/auth";
import { productService } from "@/services/sat/productService";

export async function getProductsByCompanyAction(search?: string) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const products = await productService.getByCompany(
      session.user.companyId,
      search
    );

    return { success: true, data: products };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch products" };
  }
}

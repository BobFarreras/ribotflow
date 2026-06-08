/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/categories/[id]/page.tsx
 * Description: Edit work order category page — server component fetching data,
 *              delegates to client form.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workOrderCategories } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CategoryEditForm } from "./CategoryEditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;

  const [category] = await db
    .select()
    .from(workOrderCategories)
    .where(and(eq(workOrderCategories.id, id), eq(workOrderCategories.companyId, companyId)))
    .limit(1);

  if (!category) {
    notFound();
  }

  return (
    <CategoryEditForm
      categoryId={category.id}
      initialData={{
        name: category.name,
        slug: category.slug,
        color: category.color,
        icon: category.icon,
        isDefault: category.isDefault,
      }}
    />
  );
}

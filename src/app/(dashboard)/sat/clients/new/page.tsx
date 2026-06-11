/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/clients/new/page.tsx
 * Description: Create new SAT client page using shared ClientForm component.
 */

import { auth } from "@/lib/auth";
import { categoryService } from "@/services/sat/clients/categoryService";
import { ClientForm } from "@/components/sat/clients/ClientForm";
import { createClientAction } from "@/actions/sat/clients/createClient";

export default async function NewClientPage() {
  const session = await auth();
  const categories = session?.user?.companyId
    ? await categoryService.getAll(session.user.companyId)
    : [];

  return (
    <ClientForm
      mode="create"
      categories={categories}
      onSubmit={async (data) => {
        "use server";
        return createClientAction({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          taxId: data.taxId || null,
          lat: data.lat ? parseFloat(data.lat) : null,
          lng: data.lng ? parseFloat(data.lng) : null,
          contactPerson: data.contactPerson || null,
          position: data.position || null,
          website: data.website || null,
          notes: data.notes || null,
          fiscalData:
            data.fiscalIban || data.fiscalActivityCode || data.fiscalRegistrationDate
              ? {
                  iban: data.fiscalIban || undefined,
                  activityCode: data.fiscalActivityCode || undefined,
                  registrationDate: data.fiscalRegistrationDate || undefined,
                }
              : null,
          categoryId: data.categoryId || null,
        });
      }}
      cancelHref="/sat/clients"
    />
  );
}

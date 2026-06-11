/**
 * Creation/modification date: 11/06/2026
 * Path: src/app/(dashboard)/sat/clients/[id]/edit/page.tsx
 * Description: Edit SAT client page. Fetches client + categories server-side, renders ClientForm.
 */

import { auth } from "@/lib/auth";
import { clientService } from "@/services/sat/clients/clientService";
import { categoryService } from "@/services/sat/clients/categoryService";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/sat/clients/ClientForm";
import { updateClientAction } from "@/actions/sat/clients/updateClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;

  const [client, categories] = await Promise.all([
    clientService.getById(companyId, id),
    categoryService.getAll(companyId),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <ClientForm
      mode="edit"
      clientId={id}
      categories={categories}
      initialData={{
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        taxId: client.taxId,
        location: client.location as { lat: number; lng: number } | null,
        website: client.website,
        notes: client.notes,
        fiscalData: client.fiscalData as {
          iban?: string;
          activityCode?: string;
          registrationDate?: string;
        } | null,
        categoryId: client.categoryId,
      }}
      onSubmit={async (data) => {
        "use server";
        return updateClientAction(id, {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          taxId: data.taxId || null,
          lat: data.lat ? parseFloat(data.lat) : null,
          lng: data.lng ? parseFloat(data.lng) : null,
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
      cancelHref={`/sat/clients/${id}`}
    />
  );
}

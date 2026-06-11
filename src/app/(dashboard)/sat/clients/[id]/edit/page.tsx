/**
 * Creation/modification date: 11/06/2026
 * Path: src/app/(dashboard)/sat/clients/[id]/edit/page.tsx
 * Description: Edit SAT client page. Fetches client data server-side, renders ClientForm.
 */

import { auth } from "@/lib/auth";
import { clientService } from "@/services/sat/clients/clientService";
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
  const client = await clientService.getById(session.user.companyId, id);

  if (!client) {
    notFound();
  }

  return (
    <ClientForm
      mode="edit"
      initialData={{
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        taxId: client.taxId,
        location: client.location as { lat: number; lng: number } | null,
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
        });
      }}
      cancelHref={`/sat/clients/${id}`}
    />
  );
}

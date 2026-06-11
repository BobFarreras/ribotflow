/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/clients/page.tsx
 * Description: Client management page for SAT module.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, clientCategories } from "@/db/schema/sat";
import { eq, asc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Users, Plus, Phone, MapPin, Mail, Building2 } from "lucide-react";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.clients");

  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      address: clients.address,
      location: clients.location,
      contactPerson: clients.contactPerson,
      position: clients.position,
      categoryId: clients.categoryId,
      categoryName: clientCategories.name,
      categoryColor: clientCategories.color,
    })
    .from(clients)
    .leftJoin(clientCategories, eq(clients.categoryId, clientCategories.id))
    .where(eq(clients.companyId, companyId))
    .orderBy(asc(clients.name));

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--module-sat)]/10 text-[var(--module-sat)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text)]">{t("title")}</h1>
              <p className="text-xs text-[var(--text-muted)]">{clientList.length} clients</p>
            </div>
          </div>
          <Link
            href="/sat/clients/new"
            className="flex items-center gap-1.5 rounded-md bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("newButton")}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {clientList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clientList.map((client) => (
              <div
                key={client.id}
                className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--module-sat)]/30 hover:shadow-md"
              >
                {/* Invisible overlay makes entire card clickable */}
                <Link
                  href={`/sat/clients/${client.id}`}
                  className="absolute inset-0 z-0"
                  aria-hidden="true"
                />
                <h3 className="relative z-10 text-sm font-semibold text-[var(--text)] group-hover:text-[var(--module-sat)]">
                  {client.name}
                </h3>
                {client.categoryName && (
                  <span
                    className="relative z-10 mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: client.categoryColor ? `${client.categoryColor}20` : "var(--bg)",
                      color: client.categoryColor ?? "var(--text-muted)",
                    }}
                  >
                    {client.categoryName}
                  </span>
                )}
                {client.contactPerson && (
                  <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{client.contactPerson}</span>
                    {client.position && <span>— {client.position}</span>}
                  </div>
                )}
                <div className="relative z-10 mt-3 space-y-1.5 text-xs text-[var(--text-muted)]">
                  {client.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${client.phone}`} className="hover:text-[var(--module-sat)]">
                        {client.phone}
                      </a>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${client.email}`} className="hover:text-[var(--module-sat)]">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
                {client.location && (
                  <div className="relative z-10 mt-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${client.location.lat},${client.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      <MapPin className="h-3 w-3" />
                      Google Maps
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

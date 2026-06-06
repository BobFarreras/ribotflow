/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/clients/[id]/page.tsx
 * Description: Client detail page with info and associated work orders.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, workOrders } from "@/db/schema/sat";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, FileText, User, Wrench } from "lucide-react";
import { WorkOrderStatusBadge } from "@/components/sat/shared/WorkOrderStatusBadge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);

  if (!client || client.companyId !== companyId) {
    notFound();
  }

  const orders = await db
    .select({
      id: workOrders.id,
      number: workOrders.number,
      title: workOrders.title,
      status: workOrders.status,
      priority: workOrders.priority,
      scheduledDate: workOrders.scheduledDate,
    })
    .from(workOrders)
    .where(eq(workOrders.clientId, id))
    .orderBy(desc(workOrders.createdAt));

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sat/clients"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--module-sat)]" />
              <h1 className="text-lg font-semibold text-[var(--text)]">{client.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Info card */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Dades de contacte
              </h2>
              <div className="space-y-2 text-sm">
                {client.phone && (
                  <div className="flex items-center gap-2 text-[var(--text)]">
                    <Phone className="h-4 w-4 text-[var(--text-muted)]" />
                    <a
                      href={`tel:${client.phone}`}
                      className="hover:text-[var(--module-sat)] hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-[var(--text)]">
                    <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                    <a
                      href={`mailto:${client.email}`}
                      className="hover:text-[var(--module-sat)] hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-[var(--text)]">
                    <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                    <span>{client.address}</span>
                  </div>
                )}
                {client.taxId && (
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <FileText className="h-4 w-4" />
                    <span>NIF: {client.taxId}</span>
                  </div>
                )}
              </div>
              {client.location && (
                <div className="mt-3">
                  <a
                    href={`https://www.google.com/maps?q=${client.location.lat},${client.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--module-sat)]/10 px-2 py-1 text-xs font-medium text-[var(--module-sat)] hover:bg-[var(--module-sat)]/20"
                  >
                    <MapPin className="h-3 w-3" />
                    Veure a Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Accions
              </h2>
              <Link
                href={`/sat/new?clientId=${client.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Wrench className="h-4 w-4" />
                Nova OT per aquest client
              </Link>
            </div>
          </div>

          {/* Work orders */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Ordres de treball ({orders.length})
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Aquest client no té ordres de treball.
                </p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/sat/${order.id}`}
                      className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 transition-colors hover:border-[var(--module-sat)]/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            {order.number}
                          </span>
                          <WorkOrderStatusBadge status={order.status} size="sm" />
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                          {order.title}
                        </p>
                      </div>
                      {order.scheduledDate && (
                        <span className="shrink-0 text-xs text-[var(--text-muted)]">
                          {new Date(order.scheduledDate).toLocaleDateString("ca-ES")}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

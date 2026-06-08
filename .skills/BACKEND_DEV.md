# [SKILL:BACKEND_DEV]

## Contexto de Activación
Esta skill se despierta cuando se requiere: Server Actions, rutas de API, capa de servicios, lógica de negocio, colas asíncronas, o cualquier aspecto del backend framework-agnostic.

## ⚡ Server Actions (Controladores)

### Ubicación: `/src/actions/`
```
actions/
├── sat/
│   ├── create-work-order.ts
│   ├── update-work-order.ts
│   └── close-work-order.ts
├── billing/
│   ├── create-invoice.ts
│   ├── generate-verifactu.ts
│   └── send-invoice.ts
└── ...
```

### Pattern Obligatorio
```typescript
/**
 * Creation/modification date: DD/MM/YYYY
 * Path: src/actions/billing/create-invoice.ts
 * Description: Creates a new invoice with company filter and role check.
 */

"use server";

import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import { invoiceService } from "@/services/billing/invoice";
import { createInvoiceSchema } from "@/lib/validators";

export async function createInvoice(rawInput: unknown) {
  // 1. Auth check
  const session = await auth();
  if (!session) throw new UnauthorizedError();

  // 2. Role check
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    throw new UnauthorizedError("Insufficient permissions");
  }

  // 3. Validate input
  const input = createInvoiceSchema.parse(rawInput);

  // 4. Execute service (framework-agnostic)
  const result = await invoiceService.create({
    ...input,
    companyId: session.user.companyId,
  });

  // 5. Return safe result (never expose internal IDs or stack traces)
  return { success: true, invoiceId: result.id };
}
```

## 🔌 Rutas de API

### Ubicación: `/src/app/api/`
- Solo para webhooks externos (Veri*factu, Stripe, Google)
- Para todo lo interno → usar Server Actions

```typescript
// src/app/api/webhooks/verifactu/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get("x-aeat-signature");
  if (!signature) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  await verifactuService.processWebhook(body);

  return new Response("OK", { status: 200 });
}
```

## 💼 Capa de Servicios

### Ubicación: `/src/services/`
- **Framework-agnostic:** No importa de Next.js, React, ni Drizzle directamente
- **Testable:** Fácil de mockear para tests unitarios
- **Reutilizable:** Llamada desde Server Actions, API routes, o jobs

```typescript
// src/services/billing/invoice.ts
import { db } from "@/db";
import { invoices } from "@/db/schema/billing";
import { eq, and } from "drizzle-orm";

export const invoiceService = {
  async create(data: CreateInvoiceInput) {
    const [invoice] = await db
      .insert(invoices)
      .values({ ...data, status: "draft" })
      .returning();

    return invoice;
  },

  async getById(id: string, companyId: string) {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));

    return invoice ?? null;
  },
};
```

## 🔄 Colas Asíncronas

### Ubicación: `/src/services/jobs/`
- **Cloud:** BullMQ + Redis
- **Self-Hosted:** pg-boss (Postgres)
- **Abstracción:** Interfaz `JobQueue` común

```typescript
// Uso
const queue = createJobQueue();
await queue.enqueue({
  type: "send-invoice-email",
  payload: { invoiceId, email },
  companyId,
});
```

### Tipos de Jobs
| Job | Prioridad | Modo |
|-----|-----------|------|
| `send-invoice-email` | normal | Async |
| `generate-verifactu` | critical | Sync |
| `sync-google-calendar` | low | Async |
| `generate-pdf` | high | Async |
| `send-restock-alert` | normal | Async |

## ⚠️ Reglas Críticas
1. **Nunca** lógica de negocio en Server Actions → delegar a servicios
2. **Nunca** consultar DB sin `company_id` de la sesión
3. **Siempre** validar inputs con Zod antes de procesar
4. **Siempre** usar transacciones para operaciones multi-tabla
5. **Siempre** retornar resultados seguros (nunca exponer datos internos)
6. **Siempre** logar errores en Sentry (si modo cloud)

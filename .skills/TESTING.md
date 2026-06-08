# [SKILL:TESTING]

## Contexto de Activación
Esta skill se despierta cuando se requiere: tests unitarios, tests de integración, tests E2E, mocks de servicios, factories de datos, o configuración de cobertura de tests.

## 🧪 Stack de Testing
- **Framework:** Vitest
- **Cobertura mínima:** 80% para servicios y acciones
- **Mocks:** Factories en `/tests/factories/`
- **Pre-push:** `pnpm tsc --noEmit` + `pnpm test`

## 📁 Estructura de Tests

```
tests/
├── unit/                    → Tests unitarios aislados
│   ├── services/
│   │   ├── invoice.test.ts
│   │   └── work-order.test.ts
│   └── validators/
│       └── invoice.test.ts
├── integration/             → Tests con DB real (test DB)
│   ├── actions/
│   │   └── create-invoice.test.ts
│   └── services/
│       └── invoice.test.ts
├── e2e/                     → Tests end-to-end (Playwright)
│   └── login.spec.ts
├── mocks/                   → Mocks de servicios externos
│   ├── auth.ts
│   └── db.ts
└── factories/               → Factories de datos de test
    ├── company.ts
    ├── user.ts
    ├── invoice.ts
    └── work-order.ts
```

## 🏭 Factories de Datos

```typescript
// tests/factories/user.ts
import { users } from "@/db/schema/auth";

export function createUserFactory(overrides: Partial<typeof users.$inferInsert> = {}) {
  return {
    id: crypto.randomUUID(),
    companyId: overrides.companyId ?? crypto.randomUUID(),
    email: `user-${Date.now()}@test.com`,
    passwordHash: "$2a$12$hashedpassword",
    name: "Test User",
    role: overrides.role ?? "ADMIN",
    ...overrides,
  };
}

export function createOwnerFactory(companyId: string) {
  return createUserFactory({ role: "OWNER", companyId });
}

export function createTechnicianFactory(companyId: string) {
  return createUserFactory({ role: "TECHNICIAN", companyId });
}
```

## 📝 Pattern de Test Unitario

```typescript
// tests/unit/services/invoice.test.ts
import { describe, it, expect, vi } from "vitest";
import { invoiceService } from "@/services/billing/invoice";
import { createCompanyFactory } from "@/tests/factories/company";
import { createInvoiceFactory } from "@/tests/factories/invoice";

describe("invoiceService", () => {
  it("should create an invoice with valid data", async () => {
    const company = createCompanyFactory();
    const input = createInvoiceFactory({ companyId: company.id });

    const result = await invoiceService.create(input);

    expect(result).toBeDefined();
    expect(result.companyId).toBe(company.id);
    expect(result.status).toBe("draft");
  });

  it("should return null for non-existent invoice", async () => {
    const result = await invoiceService.getById("non-existent", "any-company");

    expect(result).toBeNull();
  });

  it("should not return invoices from other companies", async () => {
    const companyA = createCompanyFactory();
    const companyB = createCompanyFactory();

    const invoiceA = await invoiceService.create(createInvoiceFactory({ companyId: companyA.id }));

    const result = await invoiceService.getById(invoiceA.id, companyB.id);

    expect(result).toBeNull();
  });
});
```

## 🔌 Pattern de Test de Integración

```typescript
// tests/integration/actions/create-invoice.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createInvoice } from "@/actions/billing/create-invoice";
import { db } from "@/db";
import { createCompanyFactory } from "@/tests/factories/company";
import { createUserFactory } from "@/tests/factories/user";

describe("createInvoice action", () => {
  let company: any;
  let owner: any;

  beforeEach(async () => {
    company = await db.insert(companies).values(createCompanyFactory()).returning();
    owner = await db.insert(users).values(createUserFactory({ companyId: company[0].id, role: "OWNER" })).returning();
  });

  it("should create invoice for authenticated owner", async () => {
    // Mock auth session
    vi.mock("@/lib/auth", () => ({
      auth: vi.fn(() => Promise.resolve({ user: { id: owner[0].id, companyId: company[0].id, role: "OWNER" } })),
    }));

    const result = await createInvoice({
      clientId: "test-client",
      items: [{ productId: "test-product", quantity: 1, price: 100 }],
    });

    expect(result.success).toBe(true);
  });

  it("should reject technician role", async () => {
    vi.mock("@/lib/auth", () => ({
      auth: vi.fn(() => Promise.resolve({ user: { id: "tech-id", companyId: company[0].id, role: "TECHNICIAN" } })),
    }));

    await expect(createInvoice({ clientId: "test", items: [] })).rejects.toThrow("UnauthorizedError");
  });
});
```

## 🎯 Comandos

```bash
pnpm test                  # Ejecutar todos los tests
pnpm test:watch            # Modo watch
pnpm test:coverage         # Con reporte de cobertura
pnpm test -- -t "invoice"  # Ejecutar tests que matchean "invoice"
```

## ⚠️ Reglas Críticas
1. **Siempre** tests para servicios y acciones (cobertura mínima 80%)
2. **Siempre** probar aislamiento multi-tenant (empresa A no ve datos de empresa B)
3. **Siempre** probar validación de inputs (casos válidos e inválidos)
4. **Siempre** usar factories, nunca datos hardcoded
5. **Nunca** tests que dependan de orden de ejecución
6. **Nunca** tests sin assertions (tests vacíos)

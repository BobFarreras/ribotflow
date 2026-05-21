# [SKILL:SECURITY]

## Contexto de Activación
Esta skill se despierta cuando se requiere: protección de rutas, validación de inputs, sanitización de datos, headers de seguridad, cookies seguras, prevención de OWASP Top 10, o auditoría de seguridad.

## 🛡️ Protección de Rutas (proxy.ts)

### Ubicación: `/src/proxy.ts` (Next.js 16)
- Intercepta todas las requests antes de llegar a las rutas
- Verifica autenticación y roles
- Inyecta headers `x-user-role` y `x-company-id`

```typescript
export async function proxy(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access
  if (userRole === "TECHNICIAN" && !pathname.startsWith("/dashboard/sat")) {
    return NextResponse.redirect(new URL("/dashboard/unauthorized", request.url));
  }
}
```

## 🔐 Validación de Inputs (Zod)

### Ubicación: `/src/lib/validators/`
- **Nunca** confiar en datos del cliente
- **Siempre** validar con esquemas Zod antes de procesar

```typescript
// src/lib/validators/invoice.ts
import { z } from "zod";

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })).min(1),
  notes: z.string().max(500).optional(),
});
```

## 🍪 Cookies Seguras

```typescript
// Auth.js config
cookies: {
  sessionToken: {
    name: `__Secure-ribotflow-session`,
    options: {
      httpOnly: true,       // No accesible desde JS
      secure: true,         // Solo HTTPS
      sameSite: "lax",      // Protección CSRF
      path: "/",
    },
  },
},
```

## 🔒 Headers de Seguridad

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};
```

## 🛡️ Prevención OWASP Top 10

| Vulnerabilidad | Protección |
|----------------|------------|
| **Inyección SQL** | Drizzle ORM (parametrización automática) |
| **Autenticación rota** | Auth.js v5 + JWT firmado + httpOnly cookies |
| **Exposición de datos** | Filtro `company_id` obligatorio en todas las consultas |
| **XSS** | React escapa por defecto + CSP headers |
| **CSRF** | `sameSite: "lax"` + tokens de sesión |
| **Componentes inseguros** | Radix UI (audited, accessible) |
| **Control de acceso** | RBAC en proxy.ts + Server Actions |
| **Configuración incorrecta** | `.env` nunca en repo + `poweredByHeader: false` |

## 🔑 Multi-Tenancy Security

### Regla Absoluta
```typescript
// ✅ Correcto: siempre con company_id
const orders = await db
  .select()
  .from(workOrders)
  .where(eq(workOrders.companyId, session.user.companyId));

// ❌ Incorrecto: sin company_id (expone datos de otras empresas)
const orders = await db.select().from(workOrders);
```

## ⚠️ Reglas Críticas
1. **Nunca** exponer stack traces en producción
2. **Nunca** confiar en datos del cliente para autorización
3. **Nunca** almacenar contraseñas en texto plano (usar bcrypt/argon2)
4. **Siempre** validar inputs con Zod en el servidor
5. **Siempre** usar `company_id` de la sesión, nunca del request body
6. **Siempre** logar intentos de acceso no autorizado

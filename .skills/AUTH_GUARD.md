# [SKILL:AUTH_GUARD]

## Contexto de Activación
Esta skill se despierta cuando se requiere: control de acceso, autenticación, autorización RBAC, multi-tenancy, gestión de sesiones, o protección de rutas y Server Actions.

## 🔐 Stack de Autenticación
- **Framework:** Auth.js v5 (sucesor de NextAuth)
- **Sesión:** JWT encriptado (cookie-based, httpOnly, secure)
- **Provider:** Credentials (email + password hash bcrypt/argon2)
- **Extensible:** OAuth (Google, Microsoft) para integraciones futuras

## 🏢 Arquitectura Multi-Tenancy
### Cloud (Multi-tenant)
- Todas las empresas comparten la misma base de datos
- Separación lógica vía `company_id` en cada consulta
- Login: email + password → Auth.js valida → inyecta `companyId` + `role` al JWT
- Cada Server Action aplica filtro invisible: `where(eq(table.companyId, session.user.companyId))`

### Self-Hosted (Single-tenant)
- Variable: `NEXT_PUBLIC_APP_MODE=self_hosted`
- Primera ejecución: Setup wizard crea 1 empresa + 1 usuario OWNER
- Mismo código, mismo filtro `company_id`, pero solo hay 1 empresa en la DB
- La lógica no cambia, solo el contexto de datos

## 👥 Matriz de Roles (RBAC)
| Rol | Permisos |
|-----|----------|
| **OWNER** | Acceso absoluto. Facturación, licencias, configuración, agentes IA, borrar empresa |
| **ADMIN** | Clientes, ERP, CRM, Veri*factu, Calendario Command Center. No puede cambiar suscripción ni borrar empresa |
| **TECHNICIAN** | Solo módulo SAT (órdenes asignadas) + Control de Acceso (fichar). No ve facturación, CRM, ni stock ajeno |
| **OFFICE** | Administrativo: facturación básica, clientes, calendario. No acceso a configuración avanzada ni SAT de campo |

## 🛡️ Protección de Rutas (Proxy)
- **`/src/proxy.ts`:** Intercepta todas las rutas protegidas
- **Flujo:** Cookie → JWT → session → verifica rol → permite/bloquea/redirige
- **Rutas públicas:** `/login`, `/register`, `/setup` (self-hosted), `/api/health`
- **Rutas protegidas:** `/dashboard/**`, `/api/**` (excepto health)

> **Nota:** Next.js 16 ha deprecado `middleware.ts` y lo ha renombrado a `proxy.ts`. La función exportada también cambia de `middleware()` a `proxy()`.

## 🔒 Protección de Server Actions
- Cada Server Action verifica sesión antes de ejecutar
- Pattern:
  ```typescript
  export async function createInvoice(data: InvoiceInput) {
    const session = await auth();
    if (!session || !hasRole(session, ['OWNER', 'ADMIN'])) {
      throw new UnauthorizedError();
    }
    // Lógica de negocio con filtro company_id
  }
  ```

## 📐 Implementación de Permisos
- **UI:** Componentes condicionales según rol (`<IfRole roles={['OWNER']}><AdminPanel /></IfRole>`)
- **API:** Middleware de ruta verifica rol antes de procesar
- **DB:** Server Actions aplican filtro `company_id` automáticamente
- **Inmutabilidad:** JWT firmado, nunca modificable desde el cliente

## ⚠️ Reglas Críticas
1. **Nunca** confiar en datos del cliente para autorización → siempre verificar en el servidor
2. **Nunca** ejecutar consultas DB sin `company_id` de la sesión
3. **Siempre** usar cookies `httpOnly` + `secure` para el JWT
4. **Siempre** redirigir a `/unauthorized` cuando el rol no tiene permiso
5. **Siempre** logar intentos de acceso no autorizado (Sentry + audit log)

## 🔧 Setup Wizard (Self-Hosted)
- Detecta `NEXT_PUBLIC_APP_MODE=self_hosted`
- Si no hay ninguna empresa en la DB → redirige a `/setup`
- Formulario: nombre empresa + email admin + password
- Crea empresa + usuario OWNER → redirige a `/dashboard`

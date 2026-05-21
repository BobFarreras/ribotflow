# [SKILL:AUTH_GUARD]

## Context d'Activació
Aquesta skill es desperta quan es requereix: control d'accés, autenticació, autorització RBAC, multi-tenancy, gestió de sessions, o protecció de rutes i Server Actions.

## 🔐 Stack d'Autenticació
- **Framework:** Auth.js v5 (NextAuth successor)
- **Sessió:** JWT encriptat (cookie-based, httpOnly, secure)
- **Provider:** Credentials (email + password hash bcrypt/argon2)
- **Extensible:** OAuth (Google, Microsoft) per a integracions futures

## 🏢 Arquitectura Multi-Tenancy
### Cloud (Multi-tenant)
- Totes les empreses comparteixen la mateixa base de dades
- Separació lògica via `company_id` en cada consulta
- Login: email + password → Auth.js valida → injecta `companyId` + `role` al JWT
- Cada Server Action aplica filtre invisible: `where(eq(table.companyId, session.user.companyId))`

### Self-Hosted (Single-tenant)
- Variable: `NEXT_PUBLIC_APP_MODE=self_hosted`
- Primera execució: Setup wizard crea 1 empresa + 1 usuari OWNER
- Mateix codi, mateix filtre `company_id`, però només hi ha 1 empresa a la DB
- La lògica no canvia, només el context de dades

## 👥 Matriu de Rols (RBAC)
| Rol | Permisos |
|-----|----------|
| **OWNER** | Accés absolut. Facturació, llicències, configuració, agents IA, esborrar empresa |
| **ADMIN** | Clients, ERP, CRM, Veri*factu, Calendari Command Center. No pot canviar subscripció ni esborrar empresa |
| **TECHNICIAN** | Només mòdul SAT (ordres assignades) + Control d'Accés (fitxar). No veu facturació, CRM, ni estoc aliè |
| **OFFICE** | Administratiu: facturació bàsica, clients, calendari. No accés a configuració avançada ni SAT de camp |

## 🛡️ Protecció de Rutes (Middleware)
- **`/src/middleware.ts`:** Intercepta totes les rutes protegides
- **Flux:** Cookie → JWT → session → verifica rol → permet/bloqueja/redirigeix
- **Rutes públiques:** `/login`, `/register`, `/setup` (self-hosted), `/api/health`
- **Rutes protegides:** `/dashboard/**`, `/api/**` (excepte health)

## 🔒 Protecció de Server Actions
- Cada Server Action verifica sessió abans d'executar
- Pattern:
  ```typescript
  export async function createInvoice(data: InvoiceInput) {
    const session = await auth();
    if (!session || !hasRole(session, ['OWNER', 'ADMIN'])) {
      throw new UnauthorizedError();
    }
    // Lògica de negoci amb filtre company_id
  }
  ```

## 📐 Implementació de Permisos
- **UI:** Components condicionals segons rol (`<IfRole roles={['OWNER']}><AdminPanel /></IfRole>`)
- **API:** Middleware de ruta verifica rol abans de processar
- **DB:** Server Actions apliquen filtre `company_id` automàticament
- **Immutabilitat:** JWT signat, mai modificable des del client

## ⚠️ Regles Crítiques
1. **Mai** confiar en dades del client per a autorització → sempre verificar al servidor
2. **Mai** executar consultes DB sense `company_id` de la sessió
3. **Sempre** usar `httpOnly` + `secure` cookies per al JWT
4. **Sempre** redirigir a `/unauthorized` quan el rol no té permís
5. **Sempre** logar intents d'accés no autoritzat (Sentry + audit log)

## 🔧 Setup Wizard (Self-Hosted)
- Detecta `NEXT_PUBLIC_APP_MODE=self_hosted`
- Si no hi ha cap empresa a la DB → redirigeix a `/setup`
- Formulari: nom empresa + email admin + password
- Crea empresa + usuari OWNER → redirigeix a `/dashboard`

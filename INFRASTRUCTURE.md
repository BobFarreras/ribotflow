# INFRASTRUCTURE.md - Matriu de Comportament per Mode d'Aplicació

## 🌐 Variable Clau: `NEXT_PUBLIC_APP_MODE`

Aquesta variable determina el comportament de tot el sistema. Dos modes possibles:

| Característica | `cloud` (SaaS Multi-tenant) | `self_hosted` (Docker Single-tenant) |
|----------------|-----------------------------|--------------------------------------|
| **Base de Dades** | PostgreSQL compartida (totes les empreses) | PostgreSQL dedicada (1 empresa) |
| **Multi-tenancy** | Lògic via `company_id` | Lògic via `company_id` (1 sola fila) |
| **Queue** | BullMQ + Redis | pg-boss (Postgres) o mode síncron |
| **Sentry** | SaaS activat | Desactivat o Sentry local del client |
| **Setup** | Registre d'empresa nou | Wizard inicial (1 empresa + 1 admin) |
| **Billing** | Stripe integrat | No aplicable (llicència directa) |
| **Updates** | Deploy centralitzat | Pull de imatge Docker + migrate |

## 🏢 Flux Cloud (Multi-tenant)

```
Usuari → app.ribotflow.com/login
         ↓
    Auth.js valida credencials
         ↓
    JWT amb { companyId, role }
         ↓
    Cada consulta DB: WHERE company_id = session.companyId
         ↓
    Aïllament total entre empreses
```

## 🐋 Flux Self-Hosted (Single-tenant)

```
Client → docker compose up
         ↓
    Detecta NEXT_PUBLIC_APP_MODE=self_hosted
         ↓
    Si no hi ha empresa → /setup wizard
         ↓
    Crea 1 empresa + 1 usuari OWNER
         ↓
    Mateix codi, mateix filtre company_id
         ↓
    Només 1 empresa a la DB
```

## 📊 Matriu de Decisions Tècniques

| Decisió | Cloud | Self-Hosted | Motiu |
|---------|-------|-------------|-------|
| Pool de connexions DB | PgBouncer (20 max) | Directe (5 max) | Escala vs simplicitat |
| Sessions | Redis store | DB store | Rendiment vs autonomia |
| File storage | S3-compatible | Volum Docker | Cost vs control |
| Email | Resend/SendGrid | SMTP local | Volum vs privacitat |
| Backups | Automatitzats cloud | Manual/client | Responsabilitat |

## 🔧 Variables d'Entorn per Mode

### Cloud (Obligatòries)
```env
NEXT_PUBLIC_APP_MODE=cloud
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AUTH_SECRET=...
SENTRY_DSN=...
STRIPE_SECRET_KEY=...
```

### Self-Hosted (Obligatòries)
```env
NEXT_PUBLIC_APP_MODE=self_hosted
DATABASE_URL=postgresql://...
AUTH_SECRET=...
# REDIS_URL → opcional (si no existeix, usa pg-boss)
# SENTRY_DSN → buit o Sentry local
```

# INFRASTRUCTURE.md - Matriz de Comportamiento por Modo de Aplicación

## 🌐 Variable Clave: `NEXT_PUBLIC_APP_MODE`

Esta variable determina el comportamiento de todo el sistema. Dos modos posibles:

| Característica | `cloud` (SaaS Multi-tenant) | `self_hosted` (Docker Single-tenant) |
|----------------|-----------------------------|--------------------------------------|
| **Base de Datos** | PostgreSQL compartida (todas las empresas) | PostgreSQL dedicada (1 empresa) |
| **Multi-tenancy** | Lógico vía `company_id` | Lógico vía `company_id` (1 sola fila) |
| **Queue** | BullMQ + Redis | pg-boss (Postgres) o modo síncron |
| **Sentry** | SaaS activado | Desactivado o Sentry local del cliente |
| **Setup** | Registro de empresa nueva | Wizard inicial (1 empresa + 1 admin) |
| **Billing** | Stripe integrado | No aplicable (licencia directa) |
| **Updates** | Deploy centralizado | Pull de imagen Docker + migrate |

## 🏢 Flujo Cloud (Multi-tenant)

```
Usuario → app.ribotflow.com/login
          ↓
     Auth.js valida credenciales
          ↓
     JWT con { companyId, role }
          ↓
     Cada consulta DB: WHERE company_id = session.companyId
          ↓
     Aislamiento total entre empresas
```

## 🐋 Flujo Self-Hosted (Single-tenant)

```
Cliente → docker compose up
          ↓
     Detecta NEXT_PUBLIC_APP_MODE=self_hosted
          ↓
     Si no hay empresa → /setup wizard
          ↓
     Crea 1 empresa + 1 usuario OWNER
          ↓
     Mismo código, mismo filtro company_id
          ↓
     Solo 1 empresa en la DB
```

## 📊 Matriz de Decisiones Técnicas

| Decisión | Cloud | Self-Hosted | Motivo |
|----------|-------|-------------|--------|
| Pool de conexiones DB | PgBouncer (20 max) | Directo (5 max) | Escala vs simplicidad |
| Sesiones | Redis store | DB store | Rendimiento vs autonomía |
| File storage | S3-compatible | Volumen Docker | Coste vs control |
| Email | Resend/SendGrid | SMTP local | Volumen vs privacidad |
| Backups | Automatizados cloud | Manual/cliente | Responsabilidad |

## 🔧 Variables de Entorno por Modo

### Cloud (Obligatorias)
```env
NEXT_PUBLIC_APP_MODE=cloud
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AUTH_SECRET=...
SENTRY_DSN=...
STRIPE_SECRET_KEY=...
```

### Self-Hosted (Obligatorias)
```env
NEXT_PUBLIC_APP_MODE=self_hosted
DATABASE_URL=postgresql://...
AUTH_SECRET=...
# REDIS_URL → opcional (si no existe, usa pg-boss)
# SENTRY_DSN → vacío o Sentry local
```

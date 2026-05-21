# DATABASE.md - Guía de Base de Datos

## 🏗️ Arquitectura

RIBOTFLOW usa **Drizzle ORM** sobre PostgreSQL. El código es **100% agnóstico** al proveedor de base de datos.

### Proveedores soportados

| Entorno | Proveedor | Connection String |
|---------|-----------|-------------------|
| **Dev local** | PostgreSQL 16 (Docker) | `postgresql://postgres:postgres@localhost:5432/ribotflow` |
| **Cloud/SaaS** | Supabase (managed) | `postgresql://postgres:***@db.***.supabase.co:5432/postgres` |
| **Self-Hosted** | PostgreSQL 16 (Docker) | `postgresql://postgres:postgres@db:5432/ribotflow` |

### ¿Por qué funciona con todos?

- Supabase **es** PostgreSQL 15+ con extensiones
- Neon **es** PostgreSQL 16+ serverless
- Drizzle ORM usa el protocolo estándar de PostgreSQL (`node-postgres`)
- No usamos funciones específicas de ningún proveedor
- Solo cambia el `DATABASE_URL` en `.env`

---

## 🚀 Setup Local (Docker)

### Requisitos
- Docker Desktop instalado y corriendo

### Inicio rápido

```bash
# 1. Levantar PostgreSQL
pnpm db:up

# 2. Aplicar esquema (crea las tablas)
pnpm db:push

# 3. Iniciar la app
pnpm dev
```

### Comandos disponibles

| Comando | Qué hace |
|---------|----------|
| `pnpm db:up` | Levanta PostgreSQL en Docker |
| `pnpm db:down` | Para el contenedor |
| `pnpm db:reset` | Destruye y recrea la DB (datos perdidos) |
| `pnpm db:setup` | Levanta DB + aplica esquema (todo en uno) |
| `pnpm db:logs` | Logs del contenedor en tiempo real |
| `pnpm db:push` | Aplica el esquema actual a la DB |
| `pnpm db:generate` | Genera migración desde cambios en el schema |
| `pnpm db:migrate` | Aplica migraciones pendientes |
| `pnpm db:studio` | Abre Drizzle Studio (UI para ver/editar datos) |

---

## ☁️ Setup Cloud (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a Settings → Database → Connection string → URI
3. Copia el string y ponlo en `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres.xxx:tu-password@db.xxx.supabase.co:5432/postgres
   ```
4. Aplica el esquema:
   ```bash
   pnpm db:push
   ```

---

## 🐋 Self-Hosted (Clientes)

El `docker-compose.yml` en la raíz incluye PostgreSQL automáticamente:

```bash
docker compose up -d
```

La app y la DB corren en la misma red Docker. La app conecta a `db:5432`.

---

## 📐 Esquema Actual

```
companies          → Empresas (multi-tenancy)
├── id (uuid)
├── name (text)
├── tenant_slug (text, unique)
├── plan (free/plus/enterprise)
├── created_at
└── updated_at

users              → Usuarios
├── id (uuid)
├── company_id (uuid, FK → companies)
├── email (text, unique)
├── password_hash (text)
├── name (text)
├── role (OWNER/ADMIN/TECHNICIAN/OFFICE)
├── created_at
└── updated_at

accounts           → OAuth accounts (Auth.js)
sessions           → User sessions (Auth.js)
```

---

## 🔒 Seguridad

- **Nunca** commitear `.env` con credenciales reales
- **Nunca** exponer `DATABASE_URL` al cliente
- **Siempre** usar `company_id` en todas las consultas de negocio
- **Siempre** usar transacciones para operaciones multi-tabla

---

## 🧪 Testing

Para tests de integración se usa una DB separada:

```env
# .env.test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ribotflow_test
```

```bash
# Crear DB de test
createdb ribotflow_test

# Aplicar esquema
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ribotflow_test pnpm db:push

# Ejecutar tests
pnpm test
```

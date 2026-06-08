# RIBOTFLOW

**Field Service Management Platform for Telecommunications**

---

## Overview

RIBOTFLOW is a comprehensive FSM platform designed for telecom companies to manage work orders, clients, quotes, routes, and field teams from a single dashboard.

### Key Features

- **Work Order Management** - Create, assign, and track field work orders with real-time status updates
- **Client Management** - Customer database with contact info, locations, and service history
- **Quote Generation** - Professional PDF quotes with customizable templates
- **Route Optimization** - Haversine-based route planning with interactive maps
- **Team Management** - Role-based access (Owner, Admin, Technician, Office)
- **Email Notifications** - Automated invitations and status updates
- **File Attachments** - Secure cloud storage for documents and photos
- **Internationalization** - Catalan and Spanish UI
- **Mobile-First** - Responsive design optimized for field technicians
- **PWA Support** - Offline-capable for field work in low-connectivity areas

---

## Tech Stack

### Frontend
```
Next.js 16+          React 19           TypeScript 5.x
Tailwind CSS 4.x     Radix UI           Leaflet 1.9
next-intl 4.x        React Hook Form    Zod 3.x
Sonner 2.x           motion 12.x        Lucide React
```

### Backend
```
Next.js Server Actions    Auth.js 5.x (JWT)     Drizzle ORM 0.38
PostgreSQL 16+            MinIO (S3)            Nodemailer 8.x
pdf-lib 1.17              BullMQ/Redis          Zod Validation
```

### DevOps
```
Docker (multi-stage)     Caddy/Traefik         Vitest 4.x
ESLint 9.x               Prettier 3.x          Husky 9.x
GitHub Actions           Drizzle Kit           PostgreSQL 16
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   Browser (Desktop)     Mobile (Field)      Tablet (Office) │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│                     REVERSE PROXY                           │
│            Caddy (Auto HTTPS) or Traefik                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     NEXT.JS APP                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Pages     │  │   API       │  │  Server Actions     │ │
│  │  (SSR/SSG)  │  │  Routes     │  │  (Business Logic)   │ │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘ │
└────────────────────────────────────────────────┼────────────┘
                                                 │
                    ┌────────────────────────────┼────────┐
                    │                            │        │
            ┌───────▼──────┐           ┌────────▼────┐   │
            │  PostgreSQL  │           │    MinIO    │   │
            │   (Data)     │           │   (Files)   │   │
            └──────────────┘           └─────────────┘   │
                                                         │
                                            ┌────────────▼────┐
                                            │   Nodemailer    │
                                            │    (Email)      │
                                            └─────────────────┘
```

---

## Project Structure

```
ribotflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, register, invitation
│   │   ├── (dashboard)/        # Main app routes
│   │   ├── api/                # API routes
│   │   └── sat/                # SAT module routes
│   ├── components/             # React components
│   │   ├── layout/             # Shell, sidebar, header
│   │   ├── sat/                # SAT-specific components
│   │   └── ui/                 # Shared UI components
│   ├── actions/                # Server Actions (controllers)
│   ├── services/               # Business logic layer
│   ├── lib/                    # Utilities, auth, validators
│   ├── db/                     # Database schema & migrations
│   └── locales/                # i18n (ca, es)
├── tests/                      # Unit & integration tests
├── docker/                     # Docker configurations
├── docker-compose.prod.yml     # Production (Caddy)
├── docker-compose.traefik.yml  # Traefik override
├── Dockerfile                  # Multi-stage build (~315MB)
└── package.json                # Dependencies & scripts
```

---

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- pnpm (package manager)

### Development

```bash
# Clone repository
git clone https://github.com/BobFarreras/ribotflow.git
cd ribotflow

# Install dependencies
pnpm install

# Setup database
pnpm db:setup

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default User
- **Email:** dais@test.com
- **Password:** 12345678

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run test suite (393 tests) |
| `pnpm test:coverage` | Run with coverage |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:setup` | Setup database (migrate + seed) |
| `pnpm db:generate` | Generate migration |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |

---

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/unit/lib/auth/permissions.test.ts

# Run with coverage
pnpm test:coverage
```

**Test Structure:**
- `tests/unit/` - Unit tests (services, actions, lib)
- `tests/components/` - Component tests
- `tests/factories/` - Test data factories

---

## Roles & Permissions

| Role | Access |
|------|--------|
| **OWNER** | Full access, settings, email config |
| **ADMIN** | Most features, team management |
| **TECHNICIAN** | Field work orders, mobile views |
| **OFFICE** | Read-only, quotes, clients |

---

## Internationalization

- **UI Language:** Catalan (ca) / Spanish (es)
- **Code:** English
- **Database:** English (states, categories)
- **i18n Keys:** `sat.workOrder.create.success`

---

## Production Deployment

### One-Liner Install (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/BobFarreras/ribotflow/features/Fxboix/scripts/install-remote.sh | bash
```

This downloads the latest deployment bundle and runs the interactive wizard.

### Manual Install
```bash
wget https://github.com/BobFarreras/ribotflow/releases/latest/download/ribotflow-deploy.tar.gz
tar -xzf ribotflow-deploy.tar.gz
cd ribotflow
./scripts/install.sh
```

For full instructions, see [INSTALL.md](INSTALL.md)

---

## Environment Variables

See [`.env.production`](.env.production) for all variables.

**Required:**
- `AUTH_SECRET` - JWT secret
- `DATABASE_URL` - PostgreSQL connection
- `MINIO_*` - Object storage

**Optional:**
- `SMTP_*` - Email configuration
- `SENTRY_DSN` - Error tracking

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## License

Private - DigitAIStudios

---

## Support

- **Documentation:** See `/docs` folder
- **Issues:** GitHub Issues
- **Email:** support@digitaistudios.com

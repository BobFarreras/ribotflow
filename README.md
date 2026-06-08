# RIBOTFLOW

Field Service Management (FSM) platform for telecommunications companies. Manage work orders, clients, quotes, routes, and team from a single dashboard.

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16+ | React framework (App Router, Server Components) |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first CSS |
| Radix UI | - | Accessible component primitives |
| Leaflet | 1.9 | Interactive maps |
| next-intl | 4.x | Internationalization (Catalan/Spanish) |
| React Hook Form | - | Form management |
| Zod | 3.x | Schema validation |
| Sonner | 2.x | Toast notifications |
| motion | 12.x | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | - | Server Actions as controllers |
| Auth.js | 5.x (beta) | Authentication (JWT strategy) |
| Drizzle ORM | 0.38 | Database ORM |
| PostgreSQL | 16+ | Primary database |
| MinIO | Latest | S3-compatible object storage |
| Nodemailer | 8.x | Email sending (SMTP) |
| pdf-lib | 1.17 | PDF generation |
| BullMQ | - | Job queue (Cloud mode) |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization (multi-stage build, ~315MB) |
| Caddy | Auto HTTPS / Reverse proxy |
| Traefik | Alternative reverse proxy (override file) |
| Vitest | Unit testing (393 tests) |
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| GitHub Actions | CI/CD |

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL 16 | Primary database |
| Drizzle ORM | Type-safe queries |
| Drizzle Kit | Migrations |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js App Router + Server Components          │
│  Tailwind CSS + Radix UI + Leaflet Maps          │
└──────────────────────┬──────────────────────────┘
                       │ Server Actions
┌──────────────────────▼──────────────────────────┐
│                   Backend                        │
│  Auth.js (JWT) + Drizzle ORM + Zod Validation   │
│  PDF Generation + Email Service + File Upload   │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│  PostgreSQL  │ │   MinIO   │ │  Nodemailer│
│   (Data)     │ │  (Files)  │ │  (Email)   │
└──────────────┘ └───────────┘ └───────────┘
```

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
│   ├── actions/                # Server Actions
│   ├── services/               # Business logic
│   ├── lib/                    # Utilities, auth, validators
│   ├── db/                     # Database schema & migrations
│   └── locales/                # i18n translations (ca, es)
├── tests/                      # Unit & integration tests
├── docker/                     # Docker configurations
│   ├── caddy/                  # Caddyfile
│   ├── postgres/               # Init SQL scripts
│   └── scripts/                # Backup scripts
├── docker-compose.prod.yml     # Production (Caddy)
├── docker-compose.traefik.yml  # Traefik override
├── Dockerfile                  # Multi-stage build
└── DEPLOY.md                   # Deployment guide
```

## Features

- **Work Order Management**: Create, assign, and track field work orders
- **Client Management**: Customer database with contact info and locations
- **Quote Generation**: PDF quotes with templates
- **Route Optimization**: Haversine-based route planning with maps
- **Team Management**: Role-based access (Owner, Admin, Technician, Office)
- **Email Notifications**: SMTP-based invitation and notification system
- **File Attachments**: MinIO/S3-compatible object storage
- **Internationalization**: Catalan and Spanish UI
- **Mobile-First**: Responsive design for field technicians
- **PWA Support**: Offline-capable for field work

## Quick Start

### Development

```bash
# Clone
git clone https://github.com/BobFarreras/ribotflow.git
cd ribotflow

# Install dependencies
pnpm install

# Setup database
pnpm db:setup

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production

See [DEPLOY.md](DEPLOY.md) for complete deployment instructions.

```bash
# Universal (with Caddy)
docker compose -f docker-compose.prod.yml up -d

# With Traefik
docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml up -d
```

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test
pnpm test tests/unit/lib/auth/permissions.test.ts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run test suite |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript check |
| `pnpm db:setup` | Setup database (migrate + seed) |
| `pnpm db:generate` | Generate migration |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:push` | Push schema (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |

## Environment Variables

See [`.env.production`](.env.production) for all variables with documentation.

Key variables:
- `AUTH_SECRET` - NextAuth JWT secret
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` - Application URL
- `MINIO_*` - Object storage config
- `SMTP_*` - Email configuration

## License

Private - DigitAIStudios

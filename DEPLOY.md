# RIBOTFLOW - Deployment Guide

## Prerequisites

- **VPS** with Ubuntu 22.04+ (2GB RAM minimum, 4GB recommended)
- **Domain** pointed to your VPS IP (A record)
- **Docker** 24+ and **Docker Compose** v2
- **Git** installed

## Quick Start

```bash
# 1. Connect to your VPS
ssh root@your-vps-ip

# 2. Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh

# 3. Clone the repository
git clone https://github.com/BobFarreras/ribotflow.git
cd ribotflow
git checkout features/Fxboix

# 4. Configure environment
cp .env.production .env.local
nano .env.local  # Edit with your values

# 5. Start services
docker compose -f docker-compose.prod.yml up -d

# 6. Run database migrations
docker compose -f docker-compose.prod.yml exec app npx drizzle-kit migrate

# 7. (Optional) Seed demo data
docker compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-demo.ts
```

## Step-by-Step Configuration

### 1. Generate Secrets

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32

# Generate MINIO passwords
openssl rand -base64 16
```

### 2. Configure .env.local

Edit `.env.local` with your values:

```env
DOMAIN=ribotflow.yourdomain.com
AUTH_SECRET=your-generated-secret
ENCRYPTION_KEY=your-generated-key
POSTGRES_PASSWORD=your-strong-db-password
MINIO_ROOT_USER=your-minio-user
MINIO_ROOT_PASSWORD=your-minio-password
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-smtp-password
```

### 3. DNS Configuration

Add these DNS records:

```
Type    Name                    Value
A       ribotflow.yourdomain.com    your-vps-ip
AAAA    ribotflow.yourdomain.com    your-vps-ipv6 (optional)
```

### 4. Start Services

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f app
```

### 5. Database Setup

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec app npx drizzle-kit migrate

# Verify migrations
docker compose -f docker-compose.prod.yml exec app npx drizzle-kit check
```

## Production Checklist

### Security

- [ ] Strong AUTH_SECRET generated
- [ ] Strong ENCRYPTION_KEY generated
- [ ] Strong POSTGRES_PASSWORD set
- [ ] MinIO credentials changed
- [ ] SMTP credentials configured
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] SSH key authentication enabled
- [ ] Root login disabled

### Monitoring

- [ ] Health check endpoint working: `https://your-domain.com/api/health`
- [ ] Logs accessible: `docker compose logs -f`
- [ ] Backup cron configured (see below)

### Backups

```bash
# Manual backup
./docker/scripts/backup.sh manual

# List backups
./docker/scripts/backup.sh list

# Restore from backup
./docker/scripts/backup.sh restore /backups/ribotflow/ribotflow_20260608_120000.sql.gz
```

#### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM
0 2 * * * cd /path/to/ribotflow && ./docker/scripts/backup.sh daily >> /var/log/ribotflow-backup.log 2>&1
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose -f docker-compose.prod.yml up -d` | Start all services |
| `docker compose -f docker-compose.prod.yml down` | Stop all services |
| `docker compose -f docker-compose.prod.yml logs -f app` | View app logs |
| `docker compose -f docker-compose.prod.yml exec app sh` | Open shell in app |
| `docker compose -f docker-compose.prod.yml exec app npx drizzle-kit studio` | Open Drizzle Studio |
| `docker compose -f docker-compose.prod.yml build --no-cache app` | Rebuild app |

## Troubleshooting

### App won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Common issues:
# - DATABASE_URL wrong
# - AUTH_SECRET missing
# - Port 3000 already in use
```

### HTTPS not working

```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Common issues:
# - Domain not pointing to VPS
# - Ports 80/443 blocked by firewall
# - DNS not propagated (wait 5-10 minutes)
```

### Database connection refused

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.prod.yml ps db

# Check logs
docker compose -f docker-compose.prod.yml logs db

# Restart database
docker compose -f docker-compose.prod.yml restart db
```

### MinIO bucket not found

```bash
# Access MinIO console (internal only)
docker compose -f docker-compose.prod.yml exec minio mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}
docker compose -f docker-compose.prod.yml exec minio mc mb local/ribotflow
docker compose -f docker-compose.prod.yml exec minio mc anonymous set public local/ribotflow
```

## Architecture

```
Internet
    │
    ▼
┌─────────┐
│  Caddy  │ ← HTTPS auto (Let's Encrypt)
│  :80    │
│  :443   │
└────┬────┘
     │
     ▼
┌─────────┐
│   App   │ ← Next.js 16 (standalone)
│  :3000  │
└────┬────┘
     │
     ├──────────┐
     ▼          ▼
┌─────────┐ ┌─────────┐
│   DB    │ │  MinIO  │
│PostgreSQL│ │  :9000  │
│  :5432  │ │         │
└─────────┘ └─────────┘
```

## Security Features

- **HTTPS**: Auto-configured via Caddy + Let's Encrypt
- **Rate Limiting**: 5 login attempts per minute per IP
- **Security Headers**: HSTS, X-Frame-Options, CSP, etc.
- **Non-root containers**: App runs as `nextjs:1001`
- **Network isolation**: Internal network, only Caddy exposed
- **Encrypted storage**: SMTP passwords encrypted with AES-256-GCM
- **Database backups**: Automated daily with 7-day retention

## Updating

```bash
# Pull latest changes
git pull origin features/Fxboix

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations (if any)
docker compose -f docker-compose.prod.yml exec app npx drizzle-kit migrate
```

## Rollback

```bash
# Stop current version
docker compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Restore database if needed
./docker/scripts/backup.sh restore /backups/ribotflow/ribotflow_YYYYMMDD_HHMMSS.sql.gz
```

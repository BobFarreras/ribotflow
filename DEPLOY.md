# DEPLOY.md - RIBOTFLOW Production Deployment

## Architecture

```
Internet → ssribotflow.digitaistudios.com → Traefik (HTTPS) → ribotflow-app:3000
                                                                    ↓
                                                            PostgreSQL:5432
                                                            MinIO:9000/9001
```

## Prerequisites

- VPS: Contabo (95.111.224.230)
- Docker + Docker Compose installed
- Traefik already running (ports 80/443)
- DNS: `ssribotflow.digitaistudios.com` → VPS IP ✅

## Step-by-Step Deployment

### 1. SSH into VPS
```bash
ssh root@95.111.224.230
```

### 2. Create project directory
```bash
mkdir -p /opt/ribotflow
cd /opt/ribotflow
```

### 3. Clone the repository
```bash
git clone -b features/Fxboix https://github.com/BobFarreras/ribotflow.git .
```

### 4. Create .env.local
```bash
cat > .env.local << 'EOF'
# Auth
AUTH_SECRET=QrvNE7eEniSOnIQzABMB0KySgl2Ozl7aPz5fWCWVJps

# Database
POSTGRES_PASSWORD=OewMjA_U0ruIJjIfROIXoTk9xDOXEebl
DATABASE_URL=postgresql://postgres:OewMjA_U0ruIJjIfROIXoTk9xDOXEebl@db:5432/ribotflow

# App
NEXT_PUBLIC_APP_URL=https://ssribotflow.digitaistudios.com
NEXT_PUBLIC_APP_MODE=self-hosted
NODE_ENV=production

# MinIO
MINIO_ROOT_USER=8a8bR25hObJeghjCn5pq1Q
MINIO_ROOT_PASSWORD=-pyzlgOy66AlpGWM3H9Q
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_BUCKET=ribotflow-uploads
MINIO_USE_SSL=false

# SMTP - Configure with your email provider
# Gmail example:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=465
# SMTP_SECURE=true
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# SMTP_FROM=noreply@digitaistudios.com
EOF
```

### 5. Create uploads directory
```bash
mkdir -p uploads
```

### 6. Ensure Traefik network exists
```bash
docker network ls | grep traefik
# If not exists:
docker network create traefik
```

### 7. Build and start
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 8. Check status
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

### 9. Run database migrations
```bash
docker compose -f docker-compose.prod.yml exec app npx drizzle-kit push
```

### 10. Access the application
- **URL**: https://ssribotflow.digitaistudios.com
- **Login**: dais@test.com / 12345678

## Traefik Configuration

The app service includes Traefik labels for automatic HTTPS:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.ribotflow.rule=Host(`ssribotflow.digitaistudios.com`)"
  - "traefik.http.routers.ribotflow.entrypoints=websecure"
  - "traefik.http.routers.ribotflow.tls.certresolver=letsencrypt"
  - "traefik.http.services.ribotflow.loadbalancer.server.port=3000"
```

**Important**: Make sure your Traefik has a `letsencrypt` certresolver configured. If not, add this to your Traefik static config:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@digitaistudios.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

## Troubleshooting

### App not accessible
```bash
# Check if app is running
docker compose -f docker-compose.prod.yml ps

# Check Traefik labels
docker inspect ribotflow-app | grep -A 20 "Labels"

# Check logs
docker compose -f docker-compose.prod.yml logs app
```

### Database connection error
```bash
# Check PostgreSQL is running
docker compose -f docker-compose.prod.yml ps db

# Test connection
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### HTTPS not working
1. Check DNS: `nslookup ssribotflow.digitaistudios.com`
2. Check Traefik logs: `docker logs traefik | grep ribotflow`
3. Check certresolver name matches your Traefik config

## Backup Management

### Manual backup
```bash
docker compose -f docker-compose.prod.yml exec backup /bin/sh -c \
  "PGPASSWORD=OewMjA_U0ruIJjIfROIXoTk9xDOXEebl pg_dump -h db -U postgres ribotflow | gzip > /backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz"
```

### Restore from backup
```bash
# Find backup file
docker compose -f docker-compose.prod.yml exec backup ls -la /backups/

# Restore
docker compose -f docker-compose.prod.yml exec backup /bin/sh -c \
  "gunzip < /backups/ribotflow_YYYYMMDD_HHMMSS.sql.gz | PGPASSWORD=OewMjA_U0ruIJjIfROIXoTk9xDOXEebl psql -h db -U postgres ribotflow"
```

## Updating the Application

```bash
cd /opt/ribotflow
git pull origin features/Fxboix
docker compose -f docker-compose.prod.yml up -d --build
```

## Rollback

```bash
cd /opt/ribotflow
git log --oneline -5  # Find previous commit
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_SECRET` | NextAuth JWT secret | `QrvNE7eEniSOnIQzABMB0KySgl2Ozl7aPz5fWCWVJps` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `OewMjA_U0ruIJjIfROIXoTk9xDOXEebl` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://ssribotflow.digitaistudios.com` |
| `MINIO_ROOT_USER` | MinIO admin user | `8a8bR25hObJeghjCn5pq1Q` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | `-pyzlgOy66AlpGWM3H9Q` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `465` or `587` |
| `SMTP_SECURE` | Use SSL/TLS | `true` (465) or `false` (587) |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | `your-app-password` |
| `SMTP_FROM` | Sender email address | `noreply@digitaistudios.com` |

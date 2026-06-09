# DEPLOY.md - RIBOTFLOW Production Deployment

## Architecture

```
                    ┌─────────────────┐
   Internet ──────►│  Reverse Proxy   │──── HTTPS
                    │  (Caddy/Traefik) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Next.js App   │
                    │    (port 3000)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼────┐ ┌───────▼───────┐
     │  PostgreSQL   │ │  MinIO  │ │   Backup      │
     │  (port 5432)  │ │ (9000)  │ │  (daily)      │
     └───────────────┘ └─────────┘ └───────────────┘
```

## Prerequisites

- VPS with Docker + Docker Compose installed
- Domain name with DNS pointing to your VPS
- (Optional) Existing reverse proxy (Traefik, Nginx, etc.)

## Deployment Options

### Option A: Standalone with Caddy (Recommended)

Best for: New servers, simple setups, no existing reverse proxy.

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Clone the repository
git clone -b main https://github.com/BobFarreras/ribotflow.git /opt/ribotflow
cd /opt/ribotflow

# 3. Create .env (see Environment Variables below)
cp .env.production .env
nano .env

# 4. Create uploads directory
mkdir -p uploads

# 5. Build and start
docker compose -f docker-compose.prod.yml up -d --build

# 6. Check status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

**Caddy** will automatically:
- Obtain SSL certificates from Let's Encrypt
- Redirect HTTP to HTTPS
- Serve your app on port 443

### Option B: With Existing Traefik

Best for: Servers already running Traefik (like Contabo VPS with n8n/Portainer).

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Clone the repository
git clone -b main https://github.com/BobFarreras/ribotflow.git /opt/ribotflow
cd /opt/ribotflow

# 3. Create .env
cp .env.production .env
nano .env

# 4. Create uploads directory
mkdir -p uploads

# 5. Ensure Traefik network exists
docker network ls | grep traefik || docker network create traefik

# 6. Build and start (with Traefik override)
docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml up -d --build

# 7. Check status
docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml ps
docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml logs -f app
```

**Requirements for Traefik:**
- Traefik must be running with ports 80/443
- Network `traefik` must exist
- Certresolver `letsencrypt` must be configured

### Option C: With Existing Nginx

Best for: Servers already running Nginx as reverse proxy.

```bash
# 1. Deploy with Caddy disabled (only internal)
docker compose -f docker-compose.prod.yml up -d --build

# 2. Add Nginx config
cat > /etc/nginx/sites-available/ribotflow << 'EOF'
server {
    listen 443 ssl http2;
    server_name ribotflow.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/ribotflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ribotflow.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 3. Enable site
ln -s /etc/nginx/sites-available/ribotflow /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Environment Variables

### Required

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `AUTH_SECRET` | NextAuth JWT secret | `openssl rand -base64 32` |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 24` |
| `MINIO_ROOT_USER` | MinIO admin user | `openssl rand -base64 16` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | `openssl rand -base64 16` |
| `DOMAIN` | Your domain name | e.g., `ribotflow.yourdomain.com` |

### Optional (Email)

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` or `587` |
| `SMTP_SECURE` | Use SSL | `true` (465) or `false` (587) |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | App password |
| `SMTP_FROM` | Sender address | `noreply@yourdomain.com` |

### .env Template

```bash
# Auth
AUTH_SECRET=your-generated-secret-here

# Database
POSTGRES_PASSWORD=your-generated-password-here

# App
DOMAIN=ribotflow.yourdomain.com
NEXT_PUBLIC_APP_URL=https://ribotflow.yourdomain.com
NEXT_PUBLIC_APP_MODE=self_hosted
NODE_ENV=production

# MinIO
MINIO_ROOT_USER=your-minio-user-here
MINIO_ROOT_PASSWORD=your-minio-password-here

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

## Database Management

### Run migrations
```bash
docker compose -f docker-compose.prod.yml restart app
```

### Manual backup
```bash
docker compose -f docker-compose.prod.yml exec backup /bin/sh -c \
  "PGPASSWORD=your-password pg_dump -h db -U postgres ribotflow | gzip > /backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz"
```

### Restore from backup
```bash
# List backups
docker compose -f docker-compose.prod.yml exec backup ls -la /backups/

# Restore
docker compose -f docker-compose.prod.yml exec backup /bin/sh -c \
  "gunzip < /backups/ribotflow_YYYYMMDD_HHMMSS.sql.gz | PGPASSWORD=your-password psql -h db -U postgres ribotflow"
```

## Updating

```bash
cd /opt/ribotflow
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## Rollback

```bash
cd /opt/ribotflow
git log --oneline -5
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

### App not accessible
```bash
# Check containers
docker compose -f docker-compose.prod.yml ps

# Check app logs
docker compose -f docker-compose.prod.yml logs app

# Check Caddy/Traefik logs
docker compose -f docker-compose.prod.yml logs caddy
```

### Database connection error
```bash
# Check PostgreSQL
docker compose -f docker-compose.prod.yml ps db
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### HTTPS not working
1. **DNS**: Verify `nslookup yourdomain.com` points to your VPS
2. **Ports**: Ensure ports 80/443 are open in firewall
3. **Caddy**: Check `docker compose logs caddy`
4. **Traefik**: Check `docker logs traefik`

### Traefik specific
```bash
# Ensure network exists
docker network ls | grep traefik

# Check Traefik labels
docker inspect ribotflow-app | grep -A 20 "Labels"

# Check certresolver name matches your Traefik config
docker logs traefik | grep ribotflow
```

## Architecture Details

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| app | Custom build | 3000 | Next.js application |
| db | postgres:16-alpine | 5432 | PostgreSQL database |
| minio | minio/minio:latest | 9000/9001 | Object storage |
| caddy | caddy:2-alpine | 80/443 | Reverse proxy (Option A) |
| backup | postgres:16-alpine | - | Daily database backups |

### Volumes

| Volume | Purpose |
|--------|---------|
| db_data | PostgreSQL data |
| minio_data | MinIO files |
| app_uploads | User uploads |
| caddy_data | SSL certificates |
| caddy_config | Caddy config |

### Networks

| Network | Purpose |
|---------|---------|
| internal | Inter-service communication |
| traefik | External Traefik network (Option B only) |

# INSTALL.md - RIBOTFLOW Installation & Deployment

## Prerequisites

### System Requirements
- **OS:** Linux (Ubuntu 22.04+ recommended), macOS, or Windows with WSL2
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 10GB minimum
- **CPU:** 2 cores minimum

### Required Software
- Docker 24+ and Docker Compose v2
- Git
- Node.js 22+ (for local development only)

---

## Quick Install (5 minutes)

### 1. SSH into your server
```bash
ssh root@your-server-ip
```

### 2. Clone the repository
```bash
git clone -b features/Fxboix https://github.com/BobFarreras/ribotflow.git /opt/ribotflow
cd /opt/ribotflow
```

### 3. Create environment file
```bash
# Generate secrets
AUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_USER=$(openssl rand -base64 16)
MINIO_PASSWORD=$(openssl rand -base64 16)

# Create .env.local
cat > .env.local << EOF
AUTH_SECRET=$AUTH_SECRET
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@db:5432/ribotflow
DOMAIN=yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_MODE=self-hosted
NODE_ENV=production
MINIO_ROOT_USER=$MINIO_USER
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_BUCKET=ribotflow-uploads
MINIO_USE_SSL=false
EOF
```

### 4. Create uploads directory
```bash
mkdir -p uploads
```

### 5. Start the application
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 6. Verify installation
```bash
# Check containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f app

# Test access
curl -I https://yourdomain.com
```

### 7. Access the application
- **URL:** https://yourdomain.com
- **Login:** dais@test.com / 12345678

---

## Deployment Options

### Option A: Standalone with Caddy (Recommended)

**Best for:** New servers, no existing reverse proxy.

```bash
# Caddy is included in docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

**Features:**
- Automatic HTTPS via Let's Encrypt
- Rate limiting on login
- Security headers
- No additional configuration needed

---

### Option B: With Existing Traefik

**Best for:** Servers already running Traefik (e.g., with n8n, Portainer).

```bash
# Ensure Traefik network exists
docker network ls | grep traefik || docker network create traefik

# Start with Traefik override
docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml up -d
```

**Requirements:**
- Traefik running on ports 80/443
- Network `traefik` exists
- Certresolver `letsencrypt` configured

**Traefik Labels:**
The app automatically registers with Traefik using labels:
```yaml
- "traefik.http.routers.ribotflow.rule=Host(`yourdomain.com`)"
- "traefik.http.routers.ribotflow.entrypoints=websecure"
- "traefik.http.routers.ribotflow.tls.certresolver=letsencrypt"
```

---

### Option C: With Existing Nginx

**Best for:** Servers already running Nginx.

#### 1. Deploy without Caddy (internal only)
```bash
# Start services without Caddy
docker compose -f docker-compose.prod.yml up -d

# Map Caddy to internal port
# (modify docker-compose.prod.yml to expose app directly)
```

#### 2. Configure Nginx
```bash
cat > /etc/nginx/sites-available/ribotflow << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

# Enable site
ln -s /etc/nginx/sites-available/ribotflow /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## DNS Configuration

### For your domain registrar (e.g., Hostinger)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 95.111.224.230 | 14400 |
| CNAME | ssribotflow | vps.digitaistudios.com | 14400 |

**Result:**
- `ssribotflow.digitaistudios.com` → `vps.digitaistudios.com` → `95.111.224.230`

---

## Post-Installation

### 1. Configure Email (SMTP)

Edit `.env.local` and add your SMTP settings:

```bash
# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Or professional email (Brevo, Mailgun, etc.)
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

Restart after changes:
```bash
docker compose -f docker-compose.prod.yml restart app
```

### 2. Run Database Migrations

```bash
docker compose -f docker-compose.prod.yml exec app npx drizzle-kit push
```

### 3. Create Admin User

Access the app and register through the UI, or use the setup page:
```
https://yourdomain.com/setup
```

---

## Backup Management

### Automated Backups
Backups run automatically every 24 hours.

### Manual Backup
```bash
docker compose -f docker-compose.prod.yml exec backup /bin/sh -c \
  "PGPASSWORD=your-password pg_dump -h db -U postgres ribotflow | gzip > /backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz"
```

### Restore from Backup
```bash
# List backups
docker compose -f docker-compose.prod.yml exec backup ls -la /backups/

# Restore
docker compose -f docker-compose.prod.yml exec backup /bin/sh -c \
  "gunzip < /backups/ribotflow_YYYYMMDD_HHMMSS.sql.gz | psql -h db -U postgres ribotflow"
```

---

## Updating

```bash
cd /opt/ribotflow
git pull origin features/Fxboix
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Rollback

```bash
cd /opt/ribotflow
git log --oneline -5
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

### App not accessible
```bash
# Check containers
docker compose -f docker-compose.prod.yml ps

# Check app logs
docker compose -f docker-compose.prod.yml logs app

# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy
```

### Database connection error
```bash
# Check PostgreSQL
docker compose -f docker-compose.prod.yml ps db
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### HTTPS not working
1. **DNS:** Verify `nslookup yourdomain.com` points to your VPS
2. **Ports:** Ensure 80/443 are open in firewall
3. **Firewall:** Check `ufw status` or `iptables -L`

### Traefik specific
```bash
# Check network
docker network ls | grep traefik

# Check labels
docker inspect ribotflow-app | grep -A 20 "Labels"

# Check Traefik logs
docker logs traefik | grep ribotflow
```

### Container won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check Docker daemon
systemctl status docker
```

---

## Architecture Details

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| app | Custom build | 3000 | Next.js application |
| db | postgres:16-alpine | 5432 | PostgreSQL database |
| minio | minio/minio:latest | 9000/9001 | Object storage |
| caddy | caddy:2-alpine | 80/443 | Reverse proxy (Option A) |
| backup | postgres:16-alpine | - | Daily backups |

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

---

## Security Notes

- Never commit `.env.local` to git
- Use strong, unique secrets (generate with `openssl rand -base64 32`)
- Keep Docker and system packages updated
- Monitor logs for suspicious activity
- Use firewall to restrict access to necessary ports only

---

## Support

- **Issues:** GitHub Issues
- **Documentation:** See `docs/` folder
- **Email:** support@digitaistudios.com

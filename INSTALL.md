# INSTALL.md - RIBOTFLOW Installation & Deployment

## Quick Install (5 minutes)

### 1. SSH into your server
```bash
ssh root@your-server-ip
```

### 2. Run the remote installer
```bash
curl -fsSL https://raw.githubusercontent.com/BobFarreras/ribotflow/main/scripts/install-remote.sh | bash
```

Run this from any directory, including `/root` after SSH login. The remote installer creates `/opt/ribotflow`, downloads the deployment files there, and launches the interactive wizard. Use `root` or `sudo` because the default install path is under `/opt`.

Or, if you prefer to download the bundle manually:
```bash
mkdir -p /opt/ribotflow && cd /opt/ribotflow
wget https://github.com/BobFarreras/ribotflow/releases/latest/download/ribotflow-deploy.tar.gz
tar -xzf ribotflow-deploy.tar.gz
./scripts/install.sh
```

The installer will:
- Ask for your domain name
- Detect your reverse proxy preference (Caddy, Traefik, Nginx, or none)
- Generate secure secrets automatically (Auth, DB, MinIO, Encryption)
- Run Drizzle migrations automatically when the app container starts
- Create the first company and OWNER user when the database is empty
- Configure SMTP (optional)
- Start all services

### 3. Access the application
- **URL:** https://yourdomain.com (or http://yourdomain.com:3000 if no proxy)
- **Login:** the admin email entered during installation
- **Password:** the admin password entered during installation

---

## What the Installer Does

```
┌─────────────────────────────────────────────────────────────┐
│                    INSTALLATION WIZARD                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Domain Configuration                               │
│  └─ Enter your domain (e.g., ribotflow.yourdomain.com)      │
│                                                             │
│  Step 2: Reverse Proxy Selection                            │
│  ├─ 1) Caddy (auto HTTPS — runs inside Docker)             │
│  ├─ 2) Traefik (existing setup)                            │
│  ├─ 3) Nginx (existing setup)                              │
│  └─ 4) None / External (port 3000 only — BYO proxy)        │
│                                                             │
│  Step 3: Generate Secrets (automatic)                       │
│  ├─ AUTH_SECRET (JWT token)                                │
│  ├─ POSTGRES_PASSWORD (database)                           │
│  ├─ MINIO_USER/PASSWORD (file storage)                     │
│  └─ ENCRYPTION_KEY (AES-256-GCM for SMTP passwords)      │
│                                                             │
│  Step 4: Company and Admin User Configuration               │
│  ├─ Company name                                             │
│  ├─ Admin email                                              │
│  └─ Admin password                                           │
│                                                             │
│  Step 5: SMTP Configuration (optional)                      │
│  ├─ Gmail / Brevo / Mailgun / Custom                       │
│  └─ Username & password                                    │
│                                                             │
│  Step 6: Create .env                                        │
│  └─ All configuration saved securely                       │
│                                                             │
│  Step 7: Start Services                                     │
│  ├─ Docker containers running                              │
│  ├─ Drizzle migrations applied by the app container         │
│  └─ Initial OWNER seeded if the database is empty           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
Internet → Reverse Proxy (optional) → Next.js App (port 3000) → PostgreSQL + MinIO
```

The base `docker-compose.prod.yml` is **agnostic** — it only contains the application and its dependencies. It exposes port `3000` so you can place any reverse proxy in front of it.

| Service | File | Purpose |
|---------|------|---------|
| app | `docker-compose.prod.yml` | Next.js application (port 3000) |
| db | `docker-compose.prod.yml` | PostgreSQL database |
| minio | `docker-compose.prod.yml` | Object storage |
| backup | `docker-compose.prod.yml` | Daily backups |
| caddy | `docker-compose.caddy.yml` | Reverse proxy + auto HTTPS (optional) |

---

## Deployment Options

### Option A: Standalone with Caddy (Recommended)

**Best for:** New servers, no existing reverse proxy.

```bash
# Installer handles everything
./scripts/install.sh
# Select "1) Caddy"
```

**What happens:**
- `docker-compose.prod.yml` (app + db + minio)
- `docker-compose.caddy.yml` (Caddy + ports 80/443)
- Automatic HTTPS via Let's Encrypt
- Rate limiting on login
- Security headers

---

### Option B: With Existing Traefik

**Best for:** Servers already running Traefik (e.g., with n8n, Portainer).

```bash
# Installer handles everything
./scripts/install.sh
# Select "2) Traefik" and enter network name (usually traefik-public)
```

**What happens:**
- `docker-compose.prod.yml` (app + db + minio)
- `docker-compose.traefik.yml` (Traefik labels)

**Requirements:**
- Traefik running on ports 80/443
- Network `traefik-public` exists
- Certresolver `letsencrypt` configured

---

### Option C: With Existing Nginx

**Best for:** Servers already running Nginx.

```bash
# Installer handles Docker setup
./scripts/install.sh
# Select "3) Nginx"

# Then configure Nginx manually:
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

ln -s /etc/nginx/sites-available/ribotflow /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

### Option D: No Reverse Proxy / External Proxy

**Best for:** You already have a reverse proxy outside Docker (e.g., Apache, Cloudflare Tunnel, or a load balancer).

```bash
./scripts/install.sh
# Select "4) None / External"
```

**What happens:**
- Only `docker-compose.prod.yml` runs (app + db + minio)
- App is exposed on port `3000`
- You configure your external proxy to forward to `http://<server-ip>:3000`

---

## Management Commands

After installation, use the management script:

```bash
chmod +x scripts/manage.sh
```

| Command | Description |
|---------|-------------|
| `./manage.sh start` | Start all services |
| `./manage.sh stop` | Stop all services |
| `./manage.sh restart` | Restart all services |
| `./manage.sh logs` | View application logs |
| `./manage.sh status` | Show service status |
| `./manage.sh update` | Pull latest and rebuild |
| `./manage.sh backup` | Create manual backup |
| `./manage.sh restore` | Restore from backup |
| `./manage.sh shell` | Open app shell |
| `./manage.sh db` | Open database shell |

The script automatically detects which Docker Compose files you used during installation.

---

## DNS Configuration

### For your domain registrar (e.g., Hostinger)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 14400 |
| CNAME | ribotflow | vps.yourdomain.com | 14400 |

---

## Post-Installation

### Configure Email (if skipped during install)

1. Go to **Settings > Email** in the application
2. Enter your SMTP details
3. Or edit `.env` directly:

```bash
# Edit configuration
nano .env

# Restart after changes
./manage.sh restart
```

### Run Database Migrations

Migrations run automatically when the app container starts (`RUN_MIGRATIONS=true`).
To force them again, restart the app:

```bash
./manage.sh restart
```

---

## Backup Management

### Automated Backups
Backups run automatically every 24 hours inside the `backup` container.

### Manual Backup
```bash
./manage.sh backup
```

### Restore from Backup
```bash
./manage.sh restore
```

---

## Updating

```bash
./manage.sh update
```

---

## Troubleshooting

### Check service status
```bash
./manage.sh status
```

### View logs
```bash
./manage.sh logs
```

### Restart services
```bash
./manage.sh restart
```

### Check Docker daemon
```bash
systemctl status docker
```

### Common issues

**HTTPS not working (Caddy):**
1. Check DNS: `nslookup yourdomain.com`
2. Check ports: `ufw status` or `iptables -L`
3. Check Caddy logs: `docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml logs caddy`

**Database connection error:**
```bash
./manage.sh db
# If connects, database is OK
```

**Container won't start:**
```bash
docker compose -f docker-compose.prod.yml logs
```

**Traefik returns `404 page not found`:**
This response is from Traefik, not from Next.js. It means Traefik did not match a router for the requested host.

```bash
cd /opt/ribotflow
cat .env | grep -E 'DOMAIN|TRAEFIK_'
docker inspect ribotflow-app --format '{{json .Config.Labels}}'
docker inspect ribotflow-app --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}'
docker inspect traefik --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}'
docker inspect traefik --format '{{json .Config.Cmd}}'
docker logs traefik --tail 80
curl -vk https://YOUR_DOMAIN/
curl -sS -H 'Host: YOUR_DOMAIN' http://127.0.0.1/
```

The app and Traefik must share the same `TRAEFIK_NETWORK`, and the app labels must include `traefik.http.routers.ribotflow.rule=Host(...)`. If Traefik was started with `providers.docker.constraints`, set `TRAEFIK_CONSTRAINT_LABEL` to the required value, usually `traefik-public`.

**App not reachable (Option D — no proxy):**
1. Verify port 3000 is open in your firewall: `ufw allow 3000`
2. Check the app is listening: `curl http://localhost:3000/api/health`

---

## Environment Variables

Generated automatically by `install.sh`. Key variables:

| Variable | Purpose | Generated? |
|----------|---------|------------|
| `AUTH_SECRET` | JWT signing | Yes (auto) |
| `POSTGRES_PASSWORD` | DB password | Yes (auto) |
| `MINIO_ROOT_USER` | S3 access key | Yes (auto) |
| `MINIO_ROOT_PASSWORD` | S3 secret key | Yes (auto) |
| `ENCRYPTION_KEY` | AES-256-GCM for SMTP passwords | Yes (auto) |
| `DATABASE_URL` | PostgreSQL connection | Yes (auto) |
| `DOMAIN` | Your domain | Manual |
| `NEXT_PUBLIC_APP_URL` | Public URL | Yes (from domain) |
| `STORAGE_PROVIDER` | Must be `minio` | Yes (auto) |
| `SMTP_*` | Email configuration | Optional |

---

## Uninstall

```bash
cd /opt/ribotflow

# Stop and remove containers
./manage.sh stop

# Remove files
cd /
rm -rf /opt/ribotflow
```

---

## Support

- **Issues:** GitHub Issues
- **Documentation:** See README.md
- **Email:** support@digitaistudios.com

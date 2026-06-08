# INSTALL.md - RIBOTFLOW Installation & Deployment

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

### 3. Run the installer
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

The installer will:
- Ask for your domain name
- Detect your reverse proxy (Caddy/Traefik/Nginx)
- Generate secure secrets automatically
- Configure SMTP (optional)
- Start all services

### 4. Access the application
- **URL:** https://yourdomain.com
- **Login:** dais@test.com
- **Password:** 12345678

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
│  ├─ 1) None (Caddy - auto HTTPS)                           │
│  ├─ 2) Traefik (existing setup)                            │
│  └─ 3) Nginx (existing setup)                              │
│                                                             │
│  Step 3: Generate Secrets (automatic)                       │
│  ├─ AUTH_SECRET (JWT token)                                │
│  ├─ POSTGRES_PASSWORD (database)                           │
│  └─ MINIO_USER/PASSWORD (file storage)                     │
│                                                             │
│  Step 4: SMTP Configuration (optional)                      │
│  ├─ Gmail / Brevo / Mailgun / Custom                       │
│  └─ Username & password                                    │
│                                                             │
│  Step 5: Create .env.local                                  │
│  └─ All configuration saved securely                       │
│                                                             │
│  Step 6: Start Services                                     │
│  └─ Docker containers running                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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

---

## Deployment Options

### Option A: Standalone with Caddy (Recommended)

**Best for:** New servers, no existing reverse proxy.

```bash
# Installer handles everything
./scripts/install.sh
# Select "1) None" when asked about reverse proxy
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
# Installer handles everything
./scripts/install.sh
# Select "2) Traefik" and enter network name (usually traefik-public)
```

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
3. Or edit `.env.local` directly:

```bash
# Edit configuration
nano .env.local

# Restart after changes
./manage.sh restart
```

### Run Database Migrations

```bash
./manage.sh shell
npx drizzle-kit push
exit
```

---

## Backup Management

### Automated Backups
Backups run automatically every 24 hours.

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

**HTTPS not working:**
1. Check DNS: `nslookup yourdomain.com`
2. Check ports: `ufw status` or `iptables -L`
3. Check Traefik/Caddy logs

**Database connection error:**
```bash
./manage.sh db
# If connects, database is OK
```

**Container won't start:**
```bash
docker compose -f docker-compose.prod.yml logs
```

---

## Architecture

```
Internet → Reverse Proxy (Caddy/Traefik/Nginx) → Next.js App → PostgreSQL + MinIO
```

### Services

| Service | Image | Purpose |
|---------|-------|---------|
| app | Custom build | Next.js application |
| db | postgres:16-alpine | PostgreSQL database |
| minio | minio/minio:latest | Object storage |
| caddy | caddy:2-alpine | Reverse proxy (Option A) |
| backup | postgres:16-alpine | Daily backups |

---

## Uninstall

```bash
cd /opt/ribotflow

# Stop and remove containers
docker compose -f docker-compose.prod.yml down -v

# Remove files
cd /
rm -rf /opt/ribotflow
```

---

## Support

- **Issues:** GitHub Issues
- **Documentation:** See README.md
- **Email:** support@digitaistudios.com

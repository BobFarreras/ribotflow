#!/bin/bash
# ==========================================
# RIBOTFLOW - Database Backup Script
# Usage: ./backup.sh [daily|manual|restore <file>]
# ==========================================

set -euo pipefail

BACKUP_DIR="/backups/ribotflow"
CONTAINER_NAME="ribotflow-db"
DB_NAME="ribotflow"
DB_USER="postgres"
RETENTION_DAYS=7

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Get password from environment
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/ribotflow_${timestamp}.sql.gz"
    
    log "Starting database backup..."
    
    docker exec "$CONTAINER_NAME" \
        pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl \
        | gzip > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "Backup completed: $backup_file ($size)"
    else
        error "Backup failed!"
    fi
    
    # Clean old backups
    log "Cleaning backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "ribotflow_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    local count=$(ls -1 "$BACKUP_DIR"/ribotflow_*.sql.gz 2>/dev/null | wc -l)
    log "Total backups: $count"
}

restore() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    warn "This will OVERWRITE the current database!"
    read -p "Are you sure? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log "Restore cancelled."
        exit 0
    fi
    
    log "Restoring from: $backup_file"
    
    gunzip -c "$backup_file" | docker exec -i "$CONTAINER_NAME" \
        psql -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl
    
    log "Restore completed!"
}

case "${1:-manual}" in
    daily|manual)
        backup
        ;;
    restore)
        if [ -z "${2:-}" ]; then
            error "Usage: $0 restore <backup_file>"
        fi
        restore "$2"
        ;;
    list)
        log "Available backups:"
        ls -lh "$BACKUP_DIR"/ribotflow_*.sql.gz 2>/dev/null || echo "No backups found."
        ;;
    *)
        echo "Usage: $0 [daily|manual|restore <file>|list]"
        exit 1
        ;;
esac

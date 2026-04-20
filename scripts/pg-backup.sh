#!/usr/bin/env bash
# WaSend Postgres günlük backup script'i.
# VPS'te /etc/cron.d/wasend-backup ile günlük 03:00'ta çalıştır.
#
# Yedekler: /var/backups/wasend/wasend-YYYY-MM-DD.sql.gz
# Retention: 14 gün (eski backup'lar otomatik silinir).
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/wasend}"
DB="${PG_DB:-wasend}"
USER="${PG_USER:-wasend}"
PORT="${PG_PORT:-5433}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

DATE=$(date +%Y-%m-%d)
TS=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/wasend-$DATE.sql.gz"

PG_PASSWORD=$(cat /etc/wasend_pg_password)

# Dump + gzip
echo "[$TS] wasend DB dump başlıyor..."
PGPASSWORD="$PG_PASSWORD" pg_dump \
  -h 127.0.0.1 -p "$PORT" -U "$USER" -d "$DB" \
  --no-owner --no-acl \
  | gzip > "$FILE"

SIZE=$(du -h "$FILE" | cut -f1)
echo "[$TS] Backup tamam: $FILE ($SIZE)"

# Retention
find "$BACKUP_DIR" -name "wasend-*.sql.gz" -mtime +$RETENTION_DAYS -delete
COUNT=$(ls -1 "$BACKUP_DIR"/wasend-*.sql.gz 2>/dev/null | wc -l)
echo "[$TS] Aktif backup: $COUNT dosya (retention: ${RETENTION_DAYS} gün)"

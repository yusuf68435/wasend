#!/usr/bin/env bash
# WaSend VPS operasyon kurulumu — logrotate + pg backup cron + health check.
# deploy.sh'den sonra tek seferlik çalıştır.
#
#   sudo bash /opt/wasend/scripts/ops-setup.sh
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "Root olarak çalıştır"; exit 1; }

# ─── 1. Logrotate ──────────────────────────────────────────────────────
echo "==> Logrotate config"
cat > /etc/logrotate.d/wasend <<'EOF'
/var/log/wasend.log /var/log/wasend.err.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 0640 wasend wasend
}
EOF
logrotate -d /etc/logrotate.d/wasend >/dev/null 2>&1 && echo "  logrotate OK"

# ─── 2. PG backup script + cron ────────────────────────────────────────
echo "==> PG backup"
install -m 755 /opt/wasend/scripts/pg-backup.sh /usr/local/bin/wasend-pg-backup.sh
mkdir -p /var/backups/wasend
chmod 700 /var/backups/wasend

cat > /etc/cron.d/wasend-backup <<'EOF'
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# Her gün 03:00'ta PG dump + 14 gün retention
0 3 * * * root /usr/local/bin/wasend-pg-backup.sh >> /var/log/wasend-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/wasend-backup
echo "  PG backup cron: her gün 03:00"

# İlk backup'ı hemen çalıştır
echo "==> İlk backup..."
bash /usr/local/bin/wasend-pg-backup.sh || echo "  İlk backup başarısız — elle kontrol et"

# ─── 3. Health check cron (uyarı için) ────────────────────────────────
echo "==> Health check cron"
cat > /etc/cron.d/wasend-health <<'EOF'
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# 5 dakikada bir /api/health'i kontrol et, fail olursa /var/log/wasend-health.log'a yaz
*/5 * * * * root sh -c 'STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:$(grep ^PORT /opt/wasend/.env | cut -d= -f2 | tr -d "\"") /api/health 2>&1); if [ "$STATUS" != "200" ] && [ "$STATUS" != "503" ]; then echo "$(date -u +%FT%TZ) HEALTH FAIL status=$STATUS" >> /var/log/wasend-health.log; fi'
EOF
chmod 644 /etc/cron.d/wasend-health
touch /var/log/wasend-health.log
echo "  Health check: 5 dk"

# ─── 4. Özet ───────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " ✅ Ops kurulum tamam"
echo "═══════════════════════════════════════════════════════"
echo " Logrotate:      /etc/logrotate.d/wasend (günlük, 14 gün)"
echo " PG backup:      /var/backups/wasend (günlük 03:00, 14 gün)"
echo " Health check:   5 dakikada bir (/var/log/wasend-health.log)"
echo ""
echo " Manuel backup:  sudo /usr/local/bin/wasend-pg-backup.sh"
echo " Geri yükleme:   gunzip -c /var/backups/wasend/X.sql.gz | PGPASSWORD=\$(cat /etc/wasend_pg_password) psql -h 127.0.0.1 -p 5433 -U wasend -d wasend"
echo "═══════════════════════════════════════════════════════"

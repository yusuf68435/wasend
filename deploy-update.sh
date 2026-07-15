#!/usr/bin/env bash
# WaSend VPS güncelleme script'i — ilk kurulum SONRASI yeni kod çekmek için.
#
# Kullanım (VPS'te, root olarak):
#   cd /opt/wasend && tar -xzf /tmp/wasend.tar.gz && bash deploy-update.sh
#
# Yaptıkları:
#   - .env'i korur (sen değiştirmediysen)
#   - schema.prisma'yı PostgreSQL'e çevirir
#   - npm ci + prisma generate + güvenli db push
#   - next build (production)
#   - ADMIN_EMAILS'te listelenen kullanıcıları süper admin yapar
#   - systemd servisini restart eder
#   - Health endpoint'ini kontrol eder
set -euo pipefail

APP_DIR="/opt/wasend"
APP_USER="wasend"

log()  { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m==>\033[0m %s\n' "$*" >&2; }
err()  { printf '\n\033[1;31m==>\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || err "Root olarak çalıştır"
[[ -d "$APP_DIR" ]] || err "$APP_DIR yok — önce deploy.sh çalıştır"
[[ -f "$APP_DIR/.env" ]] || err "$APP_DIR/.env yok"

cd "$APP_DIR"

# 1) Schema provider: postgresql (repo sqlite olarak commit'li — dev dostluğu için)
log "Schema → PostgreSQL"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
if [[ -f prisma/migrations/migration_lock.toml ]]; then
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/migrations/migration_lock.toml
fi

# 2) Ownership
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# 3) DATABASE_URL'i .env'den al
DB_URL=$(grep ^DATABASE_URL "$APP_DIR/.env" | cut -d= -f2- | tr -d '"')
if [[ -z "$DB_URL" ]]; then err "DATABASE_URL boş"; fi

# 4) Dependencies + prisma generate + schema push
log "npm ci"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && npm ci --no-audit --no-fund"

log "prisma generate"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && DATABASE_URL='$DB_URL' npx prisma generate"

log "prisma db push (yeni kolonlar/tablolar senkronize)"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && DATABASE_URL='$DB_URL' npx prisma db push"

# 5) Next.js build
log "next build (production)"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && NODE_ENV=production npm run build"

# 6) ADMIN_EMAILS'te listelenenleri süper admin yap
ADMIN_LIST=$(grep ^ADMIN_EMAILS "$APP_DIR/.env" | cut -d= -f2- | tr -d '"' || true)
if [[ -n "$ADMIN_LIST" ]]; then
  log "ADMIN_EMAILS işleniyor: $ADMIN_LIST"
  PG_PW=$(cat /etc/wasend_pg_password 2>/dev/null || true)
  if [[ -n "$PG_PW" ]]; then
    IFS=$'\t' read -r PG_HOST PG_PORT PG_USER PG_DB < <(
      DATABASE_URL="$DB_URL" node -e '
        const url = new URL(process.env.DATABASE_URL);
        const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
        process.stdout.write([
          url.hostname,
          url.port || "5432",
          decodeURIComponent(url.username),
          database,
        ].join("\t"));
      '
    )
    if [[ -z "$PG_HOST" || -z "$PG_PORT" || -z "$PG_USER" || -z "$PG_DB" ]]; then
      err "DATABASE_URL PostgreSQL bağlantı bilgilerine ayrıştırılamadı"
    fi
    IFS=',' read -ra EMAILS <<< "$ADMIN_LIST"
    for EMAIL in "${EMAILS[@]}"; do
      CLEAN=$(echo "$EMAIL" | xargs)
      [[ -z "$CLEAN" ]] && continue
      PGPASSWORD="$PG_PW" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
        -v admin_email="$CLEAN" -c \
        "UPDATE \"User\" SET \"isSuperAdmin\" = true WHERE email = :'admin_email' AND \"emailVerifiedAt\" IS NOT NULL AND suspended = false AND \"deletedAt\" IS NULL RETURNING email;" \
        2>/dev/null || warn "  $CLEAN: doğrulanmış aktif kullanıcı bulunamadı"
    done
  else
    warn "/etc/wasend_pg_password bulunamadı; ADMIN_EMAILS atlandı"
  fi
fi

# 7) Servis restart
log "wasend.service restart"
systemctl restart wasend
sleep 8

# 8) Health check
log "Sağlık kontrolü"
PORT=$(grep ^PORT "$APP_DIR/.env" | cut -d= -f2- | tr -d '"')
HEALTH=$(curl -s "http://127.0.0.1:${PORT}/api/health" || echo "ERROR")
echo "$HEALTH" | head -c 500
echo ""

if echo "$HEALTH" | grep -q '"db":{"ok":true'; then
  log "✅ Güncelleme başarılı — https://wasend.tech/admin adresinden admin panele gir"
else
  warn "Health beklenmedik çıktı verdi, logları kontrol et:"
  warn "  tail -40 /var/log/wasend.err.log"
  warn "  journalctl -u wasend -n 30 --no-pager"
fi

echo ""
log "Servis durumu:"
systemctl status wasend --no-pager | head -8

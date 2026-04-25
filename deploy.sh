#!/usr/bin/env bash
# WaSend VPS deploy script — Ubuntu 22.04/24.04 (also works on Debian 12).
#
# Idempotent: safe to re-run. Re-running upgrades code + restarts service.
#
# Usage (fresh VPS, as sudo-capable user):
#   DOMAIN=panel.ornek.com EMAIL=admin@ornek.com ./deploy.sh
#
# With repo URL instead of current directory:
#   REPO_URL=https://github.com/kullanici/wasend.git ./deploy.sh
#
# After first install, edit /opt/wasend/.env to set WhatsApp / AI keys,
# then: sudo systemctl restart wasend
set -euo pipefail

# ---------- Config ----------
APP_NAME="wasend"
APP_DIR="/opt/${APP_NAME}"
APP_USER="${APP_NAME}"
NODE_MAJOR=20
PG_DB="${APP_NAME}"
PG_USER="${APP_NAME}"
SERVICE_PORT=3000

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
SKIP_SSL="${SKIP_SSL:-false}"

# ---------- Helpers ----------
log() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m==>\033[0m %s\n' "$*" >&2; }
err() { printf '\n\033[1;31m==>\033[0m %s\n' "$*" >&2; exit 1; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || err "Missing command: $1"; }

if [[ $EUID -eq 0 ]]; then
  err "Bu scripti root olarak ÇALIŞTIRMA. sudo yetkisi olan bir kullanıcıyla çalıştır."
fi
require_cmd sudo
require_cmd curl

# ---------- Collect input ----------
if [[ -z "$DOMAIN" ]]; then
  read -rp "Domain (boş geçilirse sadece IP/HTTP): " DOMAIN || true
fi
if [[ -n "$DOMAIN" && -z "$EMAIL" ]]; then
  read -rp "Let's Encrypt için email: " EMAIL || true
fi
if [[ -z "$EMAIL" && -n "$DOMAIN" ]]; then
  warn "EMAIL yok, SSL atlanıyor. Meta webhook HTTPS ister — sonra manuel certbot çalıştır."
  SKIP_SSL="true"
fi

# ---------- 1. System packages ----------
log "APT güncelleniyor ve temel paketler kuruluyor"
sudo apt-get update -qq
sudo apt-get install -y -qq \
  ca-certificates curl gnupg git build-essential \
  ufw nginx postgresql postgresql-contrib \
  cron

# ---------- 2. Node.js 20 ----------
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  log "Node.js ${NODE_MAJOR} kuruluyor"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
log "Node sürümü: $(node -v)"

# ---------- 3. Certbot (only if domain + SSL wanted) ----------
if [[ -n "$DOMAIN" && "$SKIP_SSL" != "true" ]]; then
  if ! command -v certbot >/dev/null 2>&1; then
    log "Certbot kuruluyor"
    sudo apt-get install -y -qq certbot python3-certbot-nginx
  fi
fi

# ---------- 4. App user ----------
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  log "Sistem kullanıcısı oluşturuluyor: $APP_USER"
  sudo useradd --system --create-home --home-dir "/home/$APP_USER" --shell /bin/bash "$APP_USER"
fi

# ---------- 5. PostgreSQL: db + user ----------
log "Postgres: db ve kullanıcı kurulumu"
PG_PASSWORD_FILE="/etc/${APP_NAME}_pg_password"
if sudo test -f "$PG_PASSWORD_FILE"; then
  PG_PASSWORD="$(sudo cat "$PG_PASSWORD_FILE")"
  log "Mevcut Postgres parolası kullanıldı"
else
  PG_PASSWORD="$(openssl rand -base64 32 | tr -d '\n=/+' | cut -c1-32)"
  echo -n "$PG_PASSWORD" | sudo tee "$PG_PASSWORD_FILE" >/dev/null
  sudo chmod 600 "$PG_PASSWORD_FILE"
  log "Yeni Postgres parolası üretildi ve $PG_PASSWORD_FILE dosyasına kaydedildi"
fi

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${PG_USER} WITH ENCRYPTED PASSWORD '${PG_PASSWORD}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${PG_DB} OWNER ${PG_USER};"
# Ensure password matches even if user existed from a previous install
sudo -u postgres psql -c "ALTER USER ${PG_USER} WITH ENCRYPTED PASSWORD '${PG_PASSWORD}';" >/dev/null

DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:5432/${PG_DB}?schema=public"

# ---------- 6. Source code ----------
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER":"$APP_USER" "$APP_DIR"

if [[ -n "$REPO_URL" ]]; then
  if sudo test -d "${APP_DIR}/.git"; then
    log "Mevcut checkout güncelleniyor ($BRANCH)"
    sudo -u "$APP_USER" git -C "$APP_DIR" fetch --all --prune
    sudo -u "$APP_USER" git -C "$APP_DIR" checkout "$BRANCH"
    sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
  else
    log "Repo klonlanıyor: $REPO_URL"
    sudo -u "$APP_USER" git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
else
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  if [[ "$SCRIPT_DIR" != "$APP_DIR" ]]; then
    log "Yerel kopya $APP_DIR dizinine senkronlanıyor (rsync, .git dahil)"
    sudo rsync -a --delete \
      --exclude=node_modules --exclude=.next --exclude=.env --exclude=dev.db \
      "$SCRIPT_DIR/" "$APP_DIR/"
    sudo chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
  fi
fi

# ---------- 7. Schema → Postgres, fresh migration ----------
log "Prisma schema Postgres'e çevriliyor"
sudo -u "$APP_USER" sed -i 's/provider = "sqlite"/provider = "postgresql"/' "${APP_DIR}/prisma/schema.prisma"

# Drop SQLite-authored migrations; they use PRAGMA/TEXT which Postgres rejects.
# db push will sync the current schema directly.
if sudo test -d "${APP_DIR}/prisma/migrations"; then
  log "SQLite migration'ları temizleniyor (Postgres baseline için)"
  sudo rm -rf "${APP_DIR}/prisma/migrations"
fi

# ---------- 8. .env ----------
ENV_FILE="${APP_DIR}/.env"
if ! sudo test -f "$ENV_FILE"; then
  log ".env oluşturuluyor (sonra doldur: WhatsApp/AI keys)"
  NEXTAUTH_SECRET="$(openssl rand -base64 32)"
  CRON_SECRET="$(openssl rand -base64 32)"

  NEXTAUTH_URL="http://$(hostname -I | awk '{print $1}'):${SERVICE_PORT}"
  if [[ -n "$DOMAIN" ]]; then
    if [[ "$SKIP_SSL" == "true" ]]; then
      NEXTAUTH_URL="http://${DOMAIN}"
    else
      NEXTAUTH_URL="https://${DOMAIN}"
    fi
  fi

  sudo -u "$APP_USER" tee "$ENV_FILE" >/dev/null <<EOF
# --- WaSend production env ---
DATABASE_URL="${DATABASE_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL}"
CRON_SECRET="${CRON_SECRET}"
NODE_ENV="production"
PORT="${SERVICE_PORT}"

# WhatsApp Cloud API — Meta Developer panelinden al
WHATSAPP_API_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_VERIFY_TOKEN=""
WHATSAPP_APP_SECRET=""
WHATSAPP_WABA_ID=""

# AI fallback (opsiyonel)
ANTHROPIC_API_KEY=""
EOF
  sudo chmod 600 "$ENV_FILE"
else
  log ".env mevcut, atlanıyor (DATABASE_URL ve CRON_SECRET bu dosyada olmalı)"
fi

# ---------- 9. Install deps + generate + push schema + build ----------
log "NPM bağımlılıkları kuruluyor"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && npm ci --no-audit --no-fund || npm install --no-audit --no-fund"

log "Prisma client üretiliyor"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && DATABASE_URL='${DATABASE_URL}' npx prisma generate"

log "Postgres schema push ediliyor (db push)"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && DATABASE_URL='${DATABASE_URL}' npx prisma db push --accept-data-loss"

log "Next.js production build"
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && NODE_ENV=production npm run build"

# ---------- 10. systemd service ----------
log "systemd servisi yazılıyor"
sudo tee /etc/systemd/system/${APP_NAME}.service >/dev/null <<EOF
[Unit]
Description=WaSend — WhatsApp Automation
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
StandardOutput=append:/var/log/${APP_NAME}.log
StandardError=append:/var/log/${APP_NAME}.err.log

# Hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=${APP_DIR} /var/log

[Install]
WantedBy=multi-user.target
EOF

sudo touch "/var/log/${APP_NAME}.log" "/var/log/${APP_NAME}.err.log"
sudo chown "${APP_USER}:${APP_USER}" "/var/log/${APP_NAME}.log" "/var/log/${APP_NAME}.err.log"

sudo systemctl daemon-reload
sudo systemctl enable "${APP_NAME}"
sudo systemctl restart "${APP_NAME}"

# Wait for port to come up
log "Servis başlatılıyor, port kontrol ediliyor"
for i in {1..20}; do
  if curl -fs "http://127.0.0.1:${SERVICE_PORT}/api/health" >/dev/null 2>&1; then
    log "App ayakta: http://127.0.0.1:${SERVICE_PORT}"
    break
  fi
  sleep 2
done

# ---------- 11. Nginx reverse proxy ----------
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
SERVER_NAME="${DOMAIN:-_}"
log "Nginx config yazılıyor (server_name: ${SERVER_NAME})"
sudo tee "$NGINX_CONF" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:${SERVICE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
    }
}
EOF

sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${APP_NAME}"
# Disable default landing site if present
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# ---------- 12. Firewall ----------
if sudo ufw status | grep -q inactive; then
  log "UFW kapalı, açılıyor (SSH + HTTP/HTTPS izinli)"
  sudo ufw allow OpenSSH >/dev/null
fi
sudo ufw allow 'Nginx Full' >/dev/null || true
sudo ufw --force enable >/dev/null || true

# ---------- 13. SSL via certbot ----------
if [[ -n "$DOMAIN" && "$SKIP_SSL" != "true" ]]; then
  log "Let's Encrypt sertifikası alınıyor"
  sudo certbot --nginx --non-interactive --agree-tos --redirect \
    -m "${EMAIL}" -d "${DOMAIN}" \
    || warn "Certbot başarısız oldu — DNS A kaydı doğru mu? Daha sonra: sudo certbot --nginx -d ${DOMAIN}"
fi

# ---------- 14. Cron jobs ----------
log "Cron işleri ekleniyor"
CRON_SECRET_VAL="$(sudo grep ^CRON_SECRET "$ENV_FILE" | cut -d= -f2- | tr -d '"')"
BASE_URL="http://127.0.0.1:${SERVICE_PORT}"
CRONTAB_FILE="/etc/cron.d/${APP_NAME}"
sudo tee "$CRONTAB_FILE" >/dev/null <<EOF
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# WaSend scheduled jobs (mirrors vercel.json)
* * * * * root curl -fsS -H "Authorization: Bearer ${CRON_SECRET_VAL}" ${BASE_URL}/api/cron/reminders >/dev/null 2>&1
* * * * * root curl -fsS -H "Authorization: Bearer ${CRON_SECRET_VAL}" ${BASE_URL}/api/cron/broadcasts >/dev/null 2>&1
* * * * * root curl -fsS -H "Authorization: Bearer ${CRON_SECRET_VAL}" ${BASE_URL}/api/cron/retry-messages >/dev/null 2>&1
0 * * * * root curl -fsS -H "Authorization: Bearer ${CRON_SECRET_VAL}" ${BASE_URL}/api/cron/templates-sync >/dev/null 2>&1
0 1 * * * root curl -fsS -H "Authorization: Bearer ${CRON_SECRET_VAL}" ${BASE_URL}/api/cron/aggregate >/dev/null 2>&1
0 3 * * * root curl -fsS -H "Authorization: Bearer ${CRON_SECRET_VAL}" ${BASE_URL}/api/cron/cleanup >/dev/null 2>&1
EOF
sudo chmod 644 "$CRONTAB_FILE"

# ---------- Done ----------
FINAL_URL="$(sudo grep ^NEXTAUTH_URL "$ENV_FILE" | cut -d= -f2- | tr -d '"')"
cat <<EOF

========================================================
 ✅ WaSend kuruldu
========================================================
 URL:        ${FINAL_URL}
 Sağlık:     ${FINAL_URL}/api/health
 App dizini: ${APP_DIR}
 Env:        ${APP_DIR}/.env  (WhatsApp/AI anahtarlarını doldur)
 Loglar:     /var/log/${APP_NAME}.log  /var/log/${APP_NAME}.err.log
 Servis:     sudo systemctl {status|restart|stop} ${APP_NAME}
 DB backup:  sudo -u postgres pg_dump ${PG_DB} > backup.sql

 Sonraki adımlar:
  1) sudo nano ${APP_DIR}/.env  ← WHATSAPP_* ve ANTHROPIC_API_KEY doldur
  2) sudo systemctl restart ${APP_NAME}
  3) Meta Developer panelinde Webhook URL:
     ${FINAL_URL}/api/webhook
     Verify token: WHATSAPP_VERIFY_TOKEN değerinin aynısı
  4) ${FINAL_URL}/register adresinden ilk kullanıcı oluştur
========================================================
EOF

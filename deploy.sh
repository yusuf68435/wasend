#!/bin/bash
set -e

# Renkli cikti
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WaSend - VPS Deploy Script${NC}"
echo -e "${GREEN}========================================${NC}"

# 1. Docker kurulu mu kontrol et
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker bulunamadi. Kuruluyor...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker kuruldu. Lutfen cikis yapin ve tekrar giris yapin (newgrp docker).${NC}"
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose bulunamadi. Docker'i guncelleyin.${NC}"
    exit 1
fi

# 2. .env dosyasini kontrol et
if [ ! -f .env ]; then
    echo -e "${YELLOW}.env dosyasi bulunamadi. .env.example'dan kopyalaniyor...${NC}"
    cp .env.example .env
    echo -e "${RED}ONEMLI: .env dosyasini duzenleyin ve tekrar calistirin:${NC}"
    echo -e "${RED}  nano .env${NC}"
    echo -e "${RED}  ./deploy.sh${NC}"
    exit 1
fi

# .env dosyasindan degiskenleri oku
set -a
source .env
set +a

# Gerekli degiskenleri kontrol et
REQUIRED_VARS=("NEXTAUTH_SECRET" "DUCKDNS_TOKEN" "DUCKDNS_DOMAIN" "DOMAIN")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"buraya"* ]] || [[ "${!var}" == *"your"* ]] || [[ "${!var}" == *"tokeniniz"* ]]; then
        echo -e "${RED}HATA: $var degiskeni .env dosyasinda duzgun ayarlanmamis.${NC}"
        exit 1
    fi
done

FULL_DOMAIN="${DOMAIN}"
echo -e "${GREEN}Domain: ${FULL_DOMAIN}${NC}"

# 3. DuckDNS IP guncelle
echo -e "${YELLOW}DuckDNS IP adresi guncelleniyor...${NC}"
DUCKDNS_RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=")
if [ "$DUCKDNS_RESPONSE" = "OK" ]; then
    echo -e "${GREEN}DuckDNS IP guncellendi.${NC}"
else
    echo -e "${RED}DuckDNS IP guncellenemedi. Token ve domain adini kontrol edin.${NC}"
    exit 1
fi

# 4. Gerekli dizinleri olustur
mkdir -p data certbot/www certbot/conf

# 5. SSL sertifikasi al (ilk kurulumda)
if [ ! -d "certbot/conf/live/${FULL_DOMAIN}" ]; then
    echo -e "${YELLOW}SSL sertifikasi aliniyor...${NC}"

    # Gecici nginx baslat (sadece HTTP, sertifika icin)
    cat > nginx/nginx-temp.conf << NGINXEOF
server {
    listen 80;
    server_name ${FULL_DOMAIN};
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'WaSend kurulum devam ediyor...';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

    # Gecici nginx baslat
    docker run -d --name nginx-temp \
        -p 80:80 \
        -v "$(pwd)/nginx/nginx-temp.conf:/etc/nginx/conf.d/default.conf" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        nginx:alpine

    # Sertifika al
    docker run --rm \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        certbot/certbot certonly \
        --webroot -w /var/www/certbot \
        -d "${FULL_DOMAIN}" \
        --email "admin@${FULL_DOMAIN}" \
        --agree-tos \
        --no-eff-email

    # Gecici nginx durdur
    docker stop nginx-temp && docker rm nginx-temp
    rm -f nginx/nginx-temp.conf

    echo -e "${GREEN}SSL sertifikasi alindi.${NC}"
else
    echo -e "${GREEN}SSL sertifikasi zaten mevcut.${NC}"
fi

# 6. nginx.conf icindeki domain'i guncelle
sed -i "s/wasend\.yusuf435\.duckdns\.org/${FULL_DOMAIN}/g" nginx/nginx.conf

# 7. Build ve baslat
echo -e "${YELLOW}Docker container'lari build ediliyor ve baslatiliyor...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d --build

echo -e "${YELLOW}Container'larin baslamasi bekleniyor...${NC}"
sleep 10

# 8. Cron job'lari kur
echo -e "${YELLOW}Cron job'lar kuruluyor...${NC}"

# Reminder cron
CRON_SECRET=$(grep NEXTAUTH_SECRET .env | cut -d '=' -f2)
REMINDER_CRON="* * * * * curl -s -H \"Authorization: Bearer ${CRON_SECRET}\" http://localhost:3000/api/cron/reminders > /var/log/wasend-cron.log 2>&1"

# DuckDNS IP guncelleme (her 5 dakika)
DUCKDNS_CRON="*/5 * * * * curl -s \"https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=\" > /var/log/duckdns.log 2>&1"

# SSL yenileme (gunluk saat 03:00)
SSL_CRON="0 3 * * * cd $(pwd) && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload > /var/log/wasend-ssl.log 2>&1"

# DB yedekleme (gunluk saat 02:00)
BACKUP_CRON="0 2 * * * mkdir -p $(pwd)/data/backups && cp $(pwd)/data/wasend.db $(pwd)/data/backups/wasend-\$(date +\\%Y\\%m\\%d).db 2>/dev/null; find $(pwd)/data/backups -name '*.db' -mtime +7 -delete"

# Mevcut crontab'i al ve wasend satirlarini kaldir
(crontab -l 2>/dev/null | grep -v "wasend" | grep -v "duckdns") > /tmp/current_cron || true

# Yeni cron'lari ekle
echo "$REMINDER_CRON" >> /tmp/current_cron
echo "$DUCKDNS_CRON" >> /tmp/current_cron
echo "$SSL_CRON" >> /tmp/current_cron
echo "$BACKUP_CRON" >> /tmp/current_cron

crontab /tmp/current_cron
rm /tmp/current_cron

echo -e "${GREEN}Cron job'lar kuruldu.${NC}"

# 9. Durum
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WaSend basariyla deploy edildi!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  URL: https://${FULL_DOMAIN}"
echo ""
echo -e "  Kontrol: docker compose ps"
echo -e "  Loglar:  docker compose logs -f app"
echo ""
docker compose ps

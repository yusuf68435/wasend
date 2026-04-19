# WaSend — WhatsApp Business Automation

Next.js 16 + Prisma + NextAuth tabanlı WhatsApp Business otomasyon platformu.
İşletmeler için otomatik cevap, randevu hatırlatma, toplu mesaj, iş saati yönetimi
ve opt-out uyumu.

## Kurulum

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Açılış: [http://localhost:3000](http://localhost:3000)

## Ortam Değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✅ | Dev: `file:./dev.db`. Prod: Postgres URL (bkz. aşağıda) |
| `NEXTAUTH_SECRET` | ✅ | NextAuth JWT imza anahtarı. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ (prod) | Deploy URL'i |
| `WHATSAPP_API_TOKEN` | ✅ | Meta Cloud API erişim token'ı |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | Meta Phone Number ID |
| `WHATSAPP_VERIFY_TOKEN` | ✅ | Meta webhook doğrulama token'ı (serbest seçim) |
| `WHATSAPP_APP_SECRET` | ⚠️ | Webhook imza doğrulaması. Boş bırakılırsa imza kontrolü atlanır (prod'da MUTLAKA ayarlayın) |
| `CRON_SECRET` | ⚠️ | Cron auth için ayrı secret. Yoksa `NEXTAUTH_SECRET` fallback olarak kullanılır |
| `WHATSAPP_WABA_ID` | ⚠️ | WhatsApp Business Account ID. Template'leri Meta'ya onaya göndermek için gerekli (yoksa yalnızca lokal kayıt) |
| `ANTHROPIC_API_KEY` | ⚠️ | AI fallback aktifse zorunlu. [console.anthropic.com](https://console.anthropic.com)'dan alınır |

## Cron Jobs (Vercel)

`vercel.json` iki cron tanımlar:

- `/api/cron/reminders` — dakikada bir, vadesi gelmiş pending reminder'ları gönderir
- `/api/cron/broadcasts` — dakikada bir, `scheduled` statüsündeki broadcast'leri işler
- `/api/cron/templates-sync` — saat başı, Meta'daki template onay durumlarını çeker
- `/api/cron/aggregate` — her gün 01:00 UTC, günlük metrikleri (gönderim/teslim/okuma/gelen/yeni kontak/opt-out) `DailyMetric`'e yazar

Hepsi `Authorization: Bearer $CRON_SECRET` bekler.

## VPS Deploy (Ubuntu 22.04/24.04)

Tek komutla kurulum — reverse proxy + Postgres + systemd + cron + Let's Encrypt dahil.

**1. VPS'de sudo yetkili bir kullanıcıyla:**

```bash
# Domain varsa:
DOMAIN=panel.ornek.com EMAIL=admin@ornek.com ./deploy.sh

# Git repo'dan çekmek istersen (yerel kopya yoksa):
REPO_URL=https://github.com/KULLANICI/wasend.git BRANCH=main \
  DOMAIN=panel.ornek.com EMAIL=admin@ornek.com ./deploy.sh

# Domain yoksa (sadece IP, Meta webhook çalışmaz):
./deploy.sh
```

**Script ne yapar:**
- Node 20 + Postgres 16 + Nginx + certbot + cron kurar
- `wasend` sistem kullanıcısı oluşturur
- Postgres DB + kullanıcı + güçlü parola üretir (`/etc/wasend_pg_password`)
- Kodu `/opt/wasend` altına kopyalar, `schema.prisma`'yı `postgresql` provider'a çevirir
- SQLite migration'larını siler, `prisma db push` ile baseline kurar
- `.env` üretir (`NEXTAUTH_SECRET`, `CRON_SECRET` otomatik random)
- `next build` çalıştırır, systemd servisi kurar ve başlatır
- Nginx reverse proxy + `certbot --nginx` ile HTTPS
- `/etc/cron.d/wasend` içine tüm cron job'ları yazar (reminders, broadcasts,
  templates-sync, aggregate)
- UFW firewall'u açıp SSH + Nginx Full izinlerini set eder

**2. Kurulum sonrası:**

```bash
sudo nano /opt/wasend/.env   # WHATSAPP_* ve opsiyonel ANTHROPIC_API_KEY doldur
sudo systemctl restart wasend
sudo systemctl status wasend
tail -f /var/log/wasend.log
```

**3. Meta Developer panelinde webhook:**
- URL: `https://panel.ornek.com/api/webhook`
- Verify token: `.env`'deki `WHATSAPP_VERIFY_TOKEN` ile aynı
- Events: `messages`, `message_statuses`

**4. İlk müşteri hesabı:**
- `https://panel.ornek.com/register` — OWNER olarak kayıt
- Ek müşteriler için: `/dashboard/team` → davet link'i paylaş → `?invite=TOKEN` ile register

**Yönetim komutları:**

| Ne için | Komut |
|---|---|
| Durum | `sudo systemctl status wasend` |
| Yeniden başlat | `sudo systemctl restart wasend` |
| Log | `tail -f /var/log/wasend.log` |
| Güncelleme | Tekrar `./deploy.sh` çalıştır (git pull + build + restart) |
| DB yedek | `sudo -u postgres pg_dump wasend > backup.sql` |
| DB geri yükle | `sudo -u postgres psql wasend < backup.sql` |
| Cron logları | `grep CRON /var/log/syslog` veya `journalctl -u cron -f` |

**Güvenlik notları:**
- `.env` mode 600, sadece `wasend` user okur.
- Systemd servisi `ProtectSystem=strict`, `PrivateTmp` vb. hardening açık.
- Postgres sadece localhost'tan erişilebilir (default).
- Let's Encrypt sertifikaları otomatik yenilenir (certbot systemd timer).

---

## Üretim Veritabanı — Postgres'e Geçiş (manuel, deploy.sh kullanmıyorsan)

SQLite (`dev.db`) yalnızca geliştirme içindir. Vercel serverless ortamı dosya
sistemini kalıcı tutmadığı için üretimde **Postgres zorunludur**.

### Adımlar

1. **Postgres instance'ı sağlayın** (Neon, Supabase, Vercel Postgres).
   `DATABASE_URL` değerini kopyalayın (örn. `postgresql://user:pass@host/db?sslmode=require`).

2. **Schema provider'ı değiştirin** — `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Migration'ları sıfırlayın** (dev veri kaybı olur, prod'da zaten veri yok):
   ```bash
   rm -rf prisma/migrations
   DATABASE_URL="<postgres-url>" npx prisma migrate dev --name init
   ```
   Bu Postgres-uyumlu yeni bir baseline migration oluşturur.

4. **Vercel env**: Project Settings → Environment Variables altına `DATABASE_URL`,
   `NEXTAUTH_SECRET`, `WHATSAPP_*`, `CRON_SECRET` değerlerini ekleyin.

5. **Deploy**: `vercel --prod`. Build sırasında `prisma generate` otomatik çalışır;
   `prisma migrate deploy` ilk istekte veya build script'e eklenerek tetiklenebilir.

Geçişten önce mevcut SQLite içindeki kritik veriyi CSV olarak dışa aktarmak
isterseniz `sqlite3 dev.db ".mode csv" ".once file.csv" "SELECT ..."` kullanın.

## Özellikler

- **Opt-out**: "stop", "dur", "iptal", "çık" vb. kelimelerle gelen mesaj
  contact'ı otomatik opted-out yapar; broadcast, reminder ve manuel gönderim
  bu contact'ları atlar.
- **Webhook imza doğrulaması**: Meta `X-Hub-Signature-256` HMAC-SHA256.
- **Delivery receipts**: Meta `statuses` webhook event'i `delivered`/`read`/`failed`
  alanlarını günceller (`waMessageId` unique key ile).
- **Rate-limited broadcast**: `rateLimit` alanı dakika başı mesaj sınırı
  (varsayılan 80 — Meta Tier 1).
- **Scheduled broadcast**: `scheduledAt` set edilirse broadcast `scheduled`
  statüsüne girer ve cron tarafından vade zamanında işlenir.
- **İş saati + saat dilimi**: User tablosunda `timezone`, `businessHoursStart`,
  `businessHoursEnd`, `workDays`. İş saati dışında keyword eşleşmesi yoksa
  `offHoursReply` gönderilir.
- **Input validation**: Tüm API route'ları zod ile doğrulanır; hatalar 400 +
  structured issues döner.
- **Medya mesajları**: `sendWhatsAppMedia` ile image/document/video/audio
  gönderimi (URL tabanlı, Meta `link` yöntemi). Broadcast'lerde caption olarak
  mesaj metni kullanılır.
- **Template yönetimi**: `/dashboard/templates`'de UTILITY/MARKETING/AUTHENTICATION
  şablonlar. `WHATSAPP_WABA_ID` ayarlıysa Meta'ya onaya gönderilir; `templates-sync`
  cron'u onay durumunu günceller.
- **Segmentler**: JSON kural seti (tag/optedOut/language/source/lastMessageAt/createdAt)
  ile dinamik kişi grupları. Broadcast'ler tag yerine `segmentId` alabilir.
- **CSV import/export**: Kişileri toplu ekleyin/güncelleyin. Duplicate davranışı:
  `?mode=update` güncelle, `?mode=skip` atla (default).
- **Tag auto-assignment**: AutoReply'da `assignTags` + `priority` + `matchType`
  (contains/exact/regex). Match'te contact'a etiket atanır.
- **AI fallback**: Claude Haiku 4.5 (ayarlanabilir). Keyword match yoksa AI
  yanıt üretir; `#handoff` algılanırsa kontağa `needs-human` etiketi eklenir.
  Günlük token limiti ve AIUsage tablosu ile maliyet kontrolü.
- **Analitik**: `/dashboard/analytics` — mesaj akışı line chart, kontak
  büyümesi bar chart, KPI kartları, en çok tetiklenen kurallar. Günlük metrikler
  `aggregate` cron'u ile `DailyMetric`'e yazılır; bugünün verileri canlı sayılır.
- **Visual Flow Builder**: `/dashboard/flows` — xyflow tabanlı canvas editor.
  Düğüm tipleri: message, question, condition, action (tag), handoff, end.
  Tetikleyici: keyword veya new_contact. Question düğümünde gelen cevap
  değişken olarak saklanır. FlowSession 24 saat TTL, süre dolunca temizlenir.
  Priority sırası: Flow session/trigger → AutoReply → AI → off-hours fallback.
- **Hızlı Cevaplar**: `/dashboard/quick-replies` — sık kullanılan cevapları
  `shortcut` + `content` olarak saklar. API ile üçüncü taraf UI'larda kullanılır.
- **Ekip & Roller**: `User.role` (OWNER/ADMIN/AGENT/VIEWER). `/dashboard/team`
  sayfasında ADMIN+ davet linki oluşturur (7 gün TTL). Register sayfası
  `?invite=...` ile davet tokenı kabul eder; kabul edilen rol yeni kullanıcıya
  atanır. Not: tam ekip/workspace izolasyonu ileriki fazlarda.
- **Public API v1**: `/api/v1/messages/send`, `/api/v1/contacts` (cursor
  paginated), `/api/v1/flows/trigger`. Bearer auth ile API key — `ws_live_…`
  önekli, SHA-256 hash'lenerek saklanır, plaintext sadece oluşturma anında
  döner. `/dashboard/api-keys` ile yönetim.
- **Giden webhook'lar**: `/dashboard/webhooks` — event aboneliği + HMAC-SHA256
  imza (`X-Wasend-Signature`). Event'ler: `message.received|sent|delivered|read|failed`,
  `contact.created|opted_out`, `broadcast.completed`, `flow.handoff`.
- **Plan sınırları**: `STARTER` / `PRO` / `BUSINESS` — kişi, aylık broadcast,
  akış sayısı, AI token kotası. `/dashboard/billing` sayfası usage göstergeleri
  + dev-mode plan değişikliği. Stripe iskeleti (`STRIPE_ENABLED=true` env ile
  portal akışı gelecek).
- **Health endpoint**: `/api/health` — DB ping + env check, 200 ok / 503
  degraded.

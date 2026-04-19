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

## Cron Jobs (Vercel)

`vercel.json` iki cron tanımlar:

- `/api/cron/reminders` — dakikada bir, vadesi gelmiş pending reminder'ları gönderir
- `/api/cron/broadcasts` — dakikada bir, `scheduled` statüsündeki broadcast'leri işler
- `/api/cron/templates-sync` — saat başı, Meta'daki template onay durumlarını çeker

Hepsi `Authorization: Bearer $CRON_SECRET` bekler.

## Üretim Veritabanı — Postgres'e Geçiş

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

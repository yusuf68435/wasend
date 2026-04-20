# WaSend — Ürün Yol Haritası

Mevcut durum (Faz 1-4 tamamlandı): multi-tenant SaaS, canlıda wasend.tech
üzerinde deploy edildi. Temel özellikler:
- WhatsApp Cloud API entegrasyonu, webhook + HMAC imza, delivery receipts
- Otomatik cevap (keyword + matchType + priority), tag auto-assignment
- Visual Flow Builder (xyflow), AI fallback (Claude Haiku 4.5)
- Segment + CSV import/export, Template (Meta onay), rate-limited broadcast
- Analytics (recharts), 7 cron + systemd + Nginx + UFW + fail2ban
- Public API v1 (API key), outgoing webhooks (HMAC)
- Admin Paneli (süper admin): kiracı yönetimi, duyuru, denetim, sistem sağlığı
- Plan limits (STARTER/PRO/BUSINESS), billing iskelet

---

## Faz 5 — Ürün tamamlayıcıları (en yüksek ROI)

### 5.1 Email gönderimi (Resend veya SMTP)
- Kayıt onayı, parola sıfırlama, ekip daveti, faturalandırma e-postaları
- `lib/email.ts` soyutlama, Resend/SendGrid provider adapter
- **Şu an eksik:** parola sıfırlama UX'i tamamen yok → kullanıcı şifresini unutursa
  kilitleniyor. Kritik.

### 5.2 Conversation (inbox) görünümü
- Mesajlar şu an flat liste — kişiye göre konuşmalar (WhatsApp-benzeri) grupla
- Sol: kontak listesi (son mesaj önce), sağ: kronolojik konuşma
- Gerçek zamanlı güncelleme (SSE veya polling)
- Çoklu operator desteği için "son okuyan", typing indicator

### 5.3 Onboarding wizard
- Kayıttan sonra 4 adım: işletme profili → WhatsApp API bağla → ilk kontak
  ekle → ilk otomatik cevap
- Her adım tamamlanınca progress kaydet (User.onboardingStep)
- Terk eden kullanıcıyı e-postayla geri çağır

### 5.4 Meta embedded signup
- Müşteri şu an kendi Meta Developer hesabını kurmak zorunda (zor). Meta'nın
  Tech Provider programına başvurup embedded signup akışını entegre et: kullanıcı
  WaSend içinde Meta hesabına login yapar, WABA otomatik bağlanır.
- Setup süresi 2-3 günden 5 dakikaya iner.

### 5.5 WhatsApp Business embedded API (sandbox → prod)
- Meta onayı için ürün gösterimi, kullanım kılavuzu, gizlilik politikası
- **KVKK/GDPR uyum sayfaları** (/privacy, /terms, /gdpr)

---

## Faz 6 — Teknik borç & ölçeklenebilirlik

### 6.1 Observability
- **Sentry** hem backend hem client-side (hata izleme)
- **Axiom** veya **Better Stack** structured logs (pino)
- `/api/admin/system`'e cron çalıştırma geçmişi (son 100 tetik)

### 6.2 Otomatik DB backup
- `pg_dump` günlük + 7 gün retention
- S3/Backblaze B2'ye upload (DR — Hostinger VPS crash senaryosu)
- Haftalık full backup testi (restore verification)

### 6.3 Kuyruk sistemi (BullMQ + Redis)
- Broadcast gönderimi şu an web process'te bloklar — 10k kontakta timeout riski
- BullMQ ile async job queue: broadcast split into chunks, worker process'te
- AI çağrıları da kuyruğa — yavaş sorgularda UI donmasın

### 6.4 Redis cache
- Session cache (NextAuth)
- Hot endpoint cache (`/api/contacts` list, `/api/analytics/summary`)
- Rate limit counter (IP + user başı, Nginx'in ötesinde app-level)

### 6.5 Test suite
- **Vitest** unit test (lib/* için: segment-resolver, autoreply-match, timezone, plan-limits)
- **Playwright** E2E: register → contact ekle → segment → broadcast simülasyon
- CI (GitHub Actions): PR'da typecheck + lint + test + build

### 6.6 Feature flag sistemi
- `FeatureFlag` modeli → tenant/plan bazlı özellik aç/kapat
- Beta özellikleri önce belirli tenant'lara açmak için
- Admin panelinde yönetim UI

---

## Faz 7 — Gelir & büyüme

### 7.1 Gerçek Stripe entegrasyonu
- Checkout flow, customer portal (plan yükseltme/düşürme, fatura indir)
- Stripe webhook → `subscription.updated/deleted` → User.plan sync
- Trial 14 gün → otomatik STARTER
- Başarısız ödemede grace period 3 gün

### 7.2 Türkiye ödeme yöntemleri
- İyzico / PayTR entegrasyonu (kredi kartı + havale + bankaların 3DS)
- e-Fatura (GİB) entegrasyonu — B2B zorunlu
- KDV hesaplaması (stopaj, kademeli)

### 7.3 Referral / Affiliate
- Her kiracıya unique kod, başarılı davet → %20 komisyon
- Affiliate panel: /affiliate/dashboard

### 7.4 Kullanıma dayalı fiyatlama
- Mesaj kredisi sistemi: plan'a dahil olanın üzerinde mesaj başına ücret
- Üst seviye tier'lar için custom quote "Enterprise" CTA

### 7.5 White-label
- Kiracı kendi domain'i + branding (logo, renk, hero)
- `branding` tablosu, Nginx dynamic cert (certbot wildcard veya per-domain)

---

## Faz 8 — UX ve erişilebilirlik

### 8.1 Mobil-öncelikli redesign
- Sidebar → bottom nav mobilde
- Touch-friendly flow builder (şu an sadece masaüstü)
- PWA manifest + offline fallback

### 8.2 Arama & klavye kısayolları
- Global Cmd/Ctrl+K command palette (kontak ara, sayfaya git, eylem)
- Klavye navigation tablolar için (j/k ile gezin)

### 8.3 Karanlık mod
- Tailwind `dark:` variant, OS preference + toggle
- Admin panel zaten koyu tema

### 8.4 i18n
- `next-intl` ile TR/EN toggle
- Timezone-aware tarih gösterimi (zaten backend'de var)

### 8.5 Bildirimler
- In-app: broadcast bitti, flow handoff, yeni mesaj, quota %80
- Web Push API (mobilde iOS 16.4+ destekli)

---

## Faz 9 — Gelişmiş zeka

### 9.1 AI Studio
- Prompt engineering UI: system prompt test et, geçmiş konuşmalar örnekle,
  A/B test et
- "Knowledge base" upload (PDF/URL) → RAG için vector index (Pinecone/Qdrant)
- AI auto-tag: gelen mesajları duygu/konu analiziyle tag'le

### 9.2 Analitik AI özetleri
- "Bu hafta neler oldu?" tek tıkla Claude'dan özet
- Anomali tespit (ani mesaj düşüşü, opt-out artışı)

### 9.3 Voice & ses mesajı transkripsiyon
- Gelen voice message → Whisper/Groq → text
- Outgoing: text-to-speech ile ses mesaj gönder (opsiyonel)

---

## Faz 10 — Çoklu kanal & kurumsal

### 10.1 Instagram DM + Messenger
- Aynı Meta Graph API backbone, Channel soyutlama
- Unified inbox: tüm kanallar tek yerde

### 10.2 SMS fallback
- WhatsApp delivery fail → Twilio/NetGSM SMS otomatik
- Maliyet farkı kullanıcıya şeffaf

### 10.3 Çağrı merkezi
- Sesli arama (WhatsApp Business Calling API, 2026 açılan yeni feature)
- Ses kayıtları, aramayı flow'a bağla

### 10.4 Ekip yönetimi — tam workspace
- Şu an: her user kendi silosu, invite kabul eden yeni silo açar
- Hedef: **Workspace** modeli → User'lar workspace'e aitse, data workspace'e
  ait (userId yerine workspaceId)
- Büyük migrasyon, ama gerçek ekip paylaşımı için şart

---

## Öncelik matrisi (ROI × maliyet)

| Öncelik | Özellik | Efor | Etki |
|---|---|---|---|
| 🔥 | Parola sıfırlama + email | 1g | Kritik |
| 🔥 | Onboarding wizard | 2g | Yüksek |
| 🔥 | Conversation inbox | 3g | Yüksek |
| 🔥 | Sentry + auto backup | 1g | Güvenlik |
| ⭐ | Meta embedded signup | 5g | Yüksek |
| ⭐ | BullMQ + Redis | 3g | Ölçek için şart |
| ⭐ | Stripe gerçek | 3g | Gelir |
| ⭐ | İyzico + e-Fatura | 5g | TR pazarı |
| ⭐ | Playwright E2E | 2g | Regresyon |
| ◎ | Workspace refactor | 7g | Uzun vadede şart |
| ◎ | Dark mode + i18n | 3g | UX |
| ◎ | AI Studio + RAG | 5g | Premium tier |

**Önerim:** Faz 5.1-5.4 (1 hafta) → Faz 6.1-6.2 (2 gün) → Faz 7.1 (3 gün) 
sırası üretim için en hızlı değer üretir.

---
title: "WhatsApp Business API nedir, kime göre?"
description: "Manuel WhatsApp'tan Cloud API'a geçiş: kim kullanır, ne sağlar, ücretli mi?"
date: "2026-04-20"
tags: ["whatsapp", "başlangıç"]
author: "WaSend Ekibi"
---

## Üç farklı WhatsApp var

Kafa karışıklığını önce netleştirelim. WhatsApp'ın üç ürünü var:

- **WhatsApp** — Bireysel kullanıcılar için.
- **WhatsApp Business App** — Küçük işletmeler için ücretsiz telefon uygulaması. Otomatik cevap gibi basit özellikler mevcut.
- **WhatsApp Business Platform (Cloud API)** — Orta/büyük ölçekli işletmeler için REST API. Tüm otomasyon, CRM entegrasyonu, çoklu operatör desteği Cloud API üzerinden yapılır.

Bu yazı üçüncüsü hakkında.

## Kime uygun?

Cloud API şu sorulardan biri *evet* ise sizin için:

- Günde 50+ mesaj alıyor veya gönderiyor musunuz?
- Birden fazla kişi aynı WhatsApp numarasından cevap veriyor mu?
- Müşteri uygulamanızla (CRM, randevu, e-ticaret) WhatsApp'ı entegre etmek istiyor musunuz?
- Kampanya/toplu mesaj atmak zorunda mısınız?
- Hesabınızın *banlanma* riskini ortadan kaldırmak istiyor musunuz?

## Maliyet

Cloud API *mesaj başına* ücretlendirilir. Türkiye'de yaklaşık:

- **Utility** (sipariş onay, hatırlatma): ~0.01 USD
- **Marketing** (kampanya): ~0.05 USD
- **Service** (müşteri cevabı, 24 saat pencere): ücretsiz

Aylık 1000 mesaj marketing için ~50 USD, utility için ~10 USD. Small biz için çok makul.

## Kurulum akışı

1. Meta Developer hesabı aç: [developers.facebook.com](https://developers.facebook.com)
2. Business Verification (1-3 gün)
3. WhatsApp Business Account (WABA) oluştur
4. Phone Number ekle, doğrula
5. Access Token al, WaSend'e gir

5 dakikada olmaz (onay süreci var) ama 2 günde tamamlar, sonrası tek seferlik.

## WaSend ne yapar?

WaSend, Cloud API üzerine kurulu bir WhatsApp otomasyon platformudur:

- Otomatik cevap (anahtar kelime tetikli)
- Randevu hatırlatma
- Toplu mesaj (onaylı template)
- Akış/chatbot yönetimi
- AI destekli müşteri hizmetleri
- KOBİ için hazır paketler

Teknik kurulumla uğraşmadan kullanabilirsiniz.

---

Daha fazla soru için: `destek@wasend.tech`

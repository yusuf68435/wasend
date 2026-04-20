---
title: "WhatsApp otomatik cevap nasıl kurulur (2026 rehberi)"
description: "Müşterilerinize 7/24 otomatik yanıt veren bir sistem kurmanın adım adım yolu."
date: "2026-04-15"
tags: ["otomasyon", "otomatik-cevap"]
author: "WaSend Ekibi"
---

## Sorun

Mesai sonrası müşteri sorusu: "Fiyat ne kadar?" Cevap yarın sabah. Müşteri rakibinize gidiyor.

## Çözüm katmanları

### 1. Keyword-bazlı otomatik cevap

En basit: "fiyat" geçen mesaja otomatik fiyat listesi gönder.

WaSend'de:

1. Kişiler → Otomatik Cevap → Yeni Kural
2. Tetikleyici: `fiyat`
3. Cevap: `Merhaba! Fiyat listemiz: wasend.tech/fiyatlar. Detay için 0555...`
4. İş saati dışı: isteğe bağlı toggle

### 2. Çoklu anahtar kelime

Aynı mesaj için birden fazla keyword tek kural:
- `fiyat, ücret, kaç para, ne kadar`

### 3. Akış (chatbot)

Tek cevaplık basit rule yetmiyorsa: "Size nasıl yardımcı olabiliriz?" → 3 seçenek → her seçenek farklı dal.

### 4. AI fallback

Keyword yakalamadı, kullanıcı serbest yazıyor. AI devreye girer, işletme promptuna göre cevap üretir. Bilmediğinde temsilciye devreder.

## Best practice'ler

**Kısa tut.** WhatsApp mesajı 3-4 satırı geçmesin.

**Doğru saatte gönder.** Meta kuralı: pazarlama mesajları 09:00-21:00 dışında gitmemeli. Hatırlatmalar iş saati.

**Çıkış hakkı ver.** Opt-out mutlaka: "Bu mesajları almak istemiyorsanız DUR yazın."

**Şablon onayı.** Pazarlama mesajları için Meta'dan onaylı template gerekir. Onay 24-48 saat sürer.

## WaSend'in farkı

- Keyword kuralları tek panelden
- Türkçe dil desteği, Türkiye saat dilimi default
- İş saati/hafta sonu toggle
- AI fallback (Claude Haiku, ucuz + hızlı)
- Mesaj başı maliyet takibi

14 gün ücretsiz denemek için: [wasend.tech/register](/register)

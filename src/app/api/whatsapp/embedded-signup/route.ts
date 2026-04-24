/**
 * Embedded Signup callback — /api/whatsapp/embedded-signup
 *
 * POST { code, selected_phone_number_id? }
 *
 * Akış:
 *   1. Auth code'u long-lived access token'a değiştir
 *   2. Token ile user'ın WABA'larını listele
 *   3. Tek WABA/numara varsa otomatik seç, çoksa frontend'e listeyi döner
 *   4. Seçilen WABA'yı bizim app'e abone et (webhook için)
 *   5. Token + waba_id + phone_number_id kullanıcı record'una encrypted kaydet
 *
 * İki aşamalı çağrı:
 *   - 1. çağrı: { code } → WABA/phone listesi (user seçecek)
 *   - 2. çağrı: { code, selected_phone_number_id } → kaydet + abone ol
 *
 * Basit akışta user'ın tek WABA+tek numarası varsa tek seferde biter.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeAuthCode,
  fetchUserWABAs,
  getESConfig,
  subscribeAppToWABA,
} from "@/lib/meta-embedded-signup";
import { encryptSecret } from "@/lib/secret-crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { randomBytes } from "crypto";

const bodySchema = z.object({
  code: z.string().min(10).max(2000),
  selected_phone_number_id: z.string().regex(/^\d{10,20}$/).optional(),
  selected_waba_id: z.string().regex(/^\d{10,20}$/).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const cfg = getESConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "Meta Embedded Signup yapılandırılmamış. Yönetici ile iletişime geç." },
      { status: 503 },
    );
  }

  // Rate-limit — 10 deneme/saat
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = (xff.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
  const rl = checkRateLimit(`es:${userId}:${ip}`, 10, 3600_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme, 1 saat bekle." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { code, selected_phone_number_id, selected_waba_id } = parsed.data;

  let accessToken: string;
  try {
    const exch = await exchangeAuthCode(code, cfg);
    accessToken = exch.accessToken;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Token exchange hatası" },
      { status: 400 },
    );
  }

  // WABA + phone listesi
  let wabas;
  try {
    wabas = await fetchUserWABAs(accessToken);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "WABA listelenemedi" },
      { status: 502 },
    );
  }

  const allPhones = wabas.flatMap((w) =>
    w.phoneNumbers.map((p) => ({
      wabaId: w.wabaId,
      wabaName: w.name,
      ...p,
    })),
  );

  if (allPhones.length === 0) {
    return NextResponse.json(
      {
        error:
          "Bu Meta hesabında WhatsApp Business numarası bulunamadı. Meta Business Manager'dan bir numara ekle ve tekrar dene.",
      },
      { status: 400 },
    );
  }

  // Otomatik seçim: tek numara varsa direkt al
  let chosenWabaId: string | undefined = selected_waba_id;
  let chosenPhoneId: string | undefined = selected_phone_number_id;
  if (!chosenPhoneId && allPhones.length === 1) {
    chosenPhoneId = allPhones[0].phoneNumberId;
    chosenWabaId = allPhones[0].wabaId;
  }

  // Çoklu seçim gerekli → frontend'e listeyi dön (kod short-lived olduğu için
  // refresh problemi var ama Meta code'u tek kullanımlık; bu yüzden token
  // burada session-bound saklanmalı. Basit yaklaşım: WABA seçtirmeyi frontend'de
  // anında yap — tek POST request ile bitsin. Eğer kullanıcı seçmediyse listeyi
  // dönüp ona seçtir, sonra yeni bir auth code ile tekrar çağır.)
  if (!chosenPhoneId) {
    return NextResponse.json({
      needsSelection: true,
      options: allPhones.map((p) => ({
        wabaId: p.wabaId,
        wabaName: p.wabaName,
        phoneNumberId: p.phoneNumberId,
        displayPhoneNumber: p.displayPhoneNumber,
        verifiedName: p.verifiedName,
      })),
    });
  }

  // Seçilen phone'u doğrula
  const selected = allPhones.find(
    (p) => p.phoneNumberId === chosenPhoneId && p.wabaId === chosenWabaId,
  );
  if (!selected) {
    return NextResponse.json(
      { error: "Seçilen numara erişilebilir WABA'larla eşleşmiyor" },
      { status: 400 },
    );
  }

  // App'i WABA'ya abone et (webhook için)
  try {
    await subscribeAppToWABA(selected.wabaId, accessToken);
  } catch (e) {
    console.error("subscribeAppToWABA failed:", e);
    // non-fatal — user manuel webhook subscribe edebilir. Uyarıyla devam et.
  }

  // Per-tenant verify token üret (unique) — webhook GET için
  const verifyToken = `wsnd_${randomBytes(16).toString("hex")}`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      waApiToken: encryptSecret(accessToken),
      waAppSecret: encryptSecret(cfg.appSecret), // shared — app tek bir, tenantlar aynı app'i kullanır
      waWabaId: selected.wabaId,
      waVerifyToken: verifyToken,
      phone: selected.phoneNumberId,
      // ES akışında businessName auto-doldur (boşsa)
      businessName: (session?.user as { name?: string } | undefined)?.name || undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    wabaId: selected.wabaId,
    phoneNumberId: selected.phoneNumberId,
    displayPhoneNumber: selected.displayPhoneNumber,
  });
}

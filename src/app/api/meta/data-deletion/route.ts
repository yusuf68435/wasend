/**
 * Meta Data Deletion Callback — /api/meta/data-deletion
 *
 * Meta App Review için zorunlu endpoint. Kullanıcı Meta hesabından
 * uygulamamızı kaldırdığında Meta bu URL'e POST eder. Akış:
 *
 *   1. Meta POST application/x-www-form-urlencoded gövdesinde
 *      `signed_request=<base64url-payload>.<base64url-signature>` yollar
 *   2. Signature = HMAC-SHA256(payload, META_APP_SECRET) — biz doğrularız
 *   3. Decode edilen payload `{ user_id, algorithm, issued_at, ... }` içerir
 *   4. Kayıt → status sayfası URL'i + confirmation_code döneriz
 *
 * Response (Meta dokümanı):
 *   { url: "https://wasend.tech/data-deletion/<code>", confirmation_code: "<code>" }
 *
 * GET → endpoint'in canlı olduğunu kontrol eden basit health (Meta her ne
 * kadar GET'i resmen istemese de panel testi için faydalı).
 *
 * Güvenlik:
 *   - META_APP_SECRET olmadan endpoint 503 döner (yapılandırılmamış)
 *   - signed_request imza eşleşmezse 400 (HMAC timing-safe karşılaştırma)
 *   - Body içeriği zaten Meta'dan geldiği için trust ediliyor
 *     ama hiçbir database action user input'a göre yapılmıyor —
 *     sadece log kaydı tutulur, manuel admin işler.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSignedRequest } from "@/lib/meta-signed-request";

export async function GET(req: Request) {
  // Basit health endpoint — Meta panel testleri için
  const url = new URL(req.url);
  return NextResponse.json({
    ok: true,
    service: "meta-data-deletion-callback",
    info: "POST signed_request to this URL. See https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback",
    statusBase: `${url.origin}/data-deletion/`,
  });
}

export async function POST(req: Request) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json(
      { error: "Meta app yapılandırılmamış" },
      { status: 503 },
    );
  }

  let signedRequest: string;
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      signedRequest = params.get("signed_request") || "";
    } else if (ct.includes("application/json")) {
      const json = (await req.json()) as { signed_request?: string };
      signedRequest = json.signed_request || "";
    } else {
      // bazı testlerde raw query string gelebilir
      const text = await req.text();
      const params = new URLSearchParams(text);
      signedRequest = params.get("signed_request") || "";
    }
  } catch {
    return NextResponse.json({ error: "Geçersiz body" }, { status: 400 });
  }

  if (!signedRequest) {
    return NextResponse.json(
      { error: "signed_request alanı eksik" },
      { status: 400 },
    );
  }

  const payload = parseSignedRequest(signedRequest, appSecret);
  if (!payload) {
    return NextResponse.json(
      { error: "İmza doğrulanamadı" },
      { status: 400 },
    );
  }

  // Kayıt oluştur — manuel admin sonra işler
  const record = await prisma.metaDataDeletionRequest.create({
    data: {
      metaUserId: payload.user_id,
      status: "pending",
    },
  });

  // Status URL'i — Meta paneli ve son kullanıcı buradan takip eder
  const url = new URL(req.url);
  const statusUrl = `${url.origin}/data-deletion/${record.id}`;

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: record.id,
  });
}

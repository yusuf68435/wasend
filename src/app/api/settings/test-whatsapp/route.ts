import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId, isResponse } from "@/lib/api-auth";

/**
 * WhatsApp API credentials test. Kullanıcı Phone Number ID ve Token girer,
 * Meta Graph API'ye basit bir GET atar. Başarılı = credentials çalışıyor.
 *
 * Test ve prod token için aynı yöntem.
 */

const schema = z.object({
  phoneNumberId: z.string().min(5),
  apiToken: z.string().min(10),
});

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Phone ID ve Token zorunlu" }, { status: 400 });
  }

  const { phoneNumberId, apiToken } = parsed.data;
  const apiVersion = "v21.0";
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          error: data?.error?.message || "Meta API hatası",
          fbtraceId: data?.error?.fbtrace_id ?? null,
        },
        { status: 200 },
      );
    }
    return NextResponse.json({
      ok: true,
      verifiedName: data.verified_name ?? null,
      displayPhone: data.display_phone_number ?? null,
      qualityRating: data.quality_rating ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Network hatası",
      },
      { status: 200 },
    );
  }
}

/**
 * ES config discovery — /api/whatsapp/embedded-signup/config
 *
 * Frontend butonun görünür/gizli durumu için yükleme sırasında bunu
 * çağırır. Sadece public (NEXT_PUBLIC_*) değerleri döner — secret'lar
 * asla client'a sızdırılmaz.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const appId = process.env.META_APP_ID;
  const configId = process.env.META_ES_CONFIG_ID;
  const publicAppId = process.env.NEXT_PUBLIC_META_APP_ID || appId;
  const publicConfigId = process.env.NEXT_PUBLIC_META_ES_CONFIG_ID || configId;

  if (!publicAppId || !publicConfigId || !appId || !process.env.META_APP_SECRET) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    appId: publicAppId,
    configId: publicConfigId,
    // Graph API version — SDK init için gerekli
    graphVersion: "v21.0",
  });
}

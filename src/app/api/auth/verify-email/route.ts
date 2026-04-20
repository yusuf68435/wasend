import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Email doğrulama endpoint'i.
 * GET /api/auth/verify-email?token=...
 *
 * Token hash'leyip DB'deki emailVerifyToken ile karşılaştır, eşleşirse
 * emailVerifiedAt set + token temizle.
 */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = checkRateLimit(`verify:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme" },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token eksik" }, { status: 400 });
  }

  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findUnique({
    where: { emailVerifyToken: hash },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Bağlantı geçersiz veya süresi dolmuş" },
      { status: 400 },
    );
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
    },
  });

  return NextResponse.json({ success: true });
}

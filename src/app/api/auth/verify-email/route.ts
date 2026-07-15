import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { getTrustedClientIp } from "@/lib/client-ip";

/**
 * Email doğrulama endpoint'i.
 * GET /api/auth/verify-email?token=...
 *
 * Token hash'leyip DB'deki emailVerifyToken ile karşılaştır, eşleşirse
 * emailVerifiedAt set + token temizle.
 */
export async function GET(request: Request) {
  const ip = getTrustedClientIp(request.headers) ?? "unknown";
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
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
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

  const verified = await prisma.user.updateMany({
    where: {
      id: user.id,
      emailVerifyToken: hash,
      emailVerifiedAt: null,
    },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
    },
  });
  if (verified.count !== 1) {
    return NextResponse.json(
      { error: "Bağlantı daha önce kullanılmış" },
      { status: 409 },
    );
  }

  // İlk doğrulamadan sonra welcome email (fire-and-forget)
  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://wasend.tech";
  const tpl = welcomeEmail({ name: user.name, dashboardUrl: baseUrl });
  sendEmail({ to: user.email, ...tpl }).catch((e) =>
    console.error("welcome email failed:", e),
  );

  return NextResponse.json({ success: true });
}

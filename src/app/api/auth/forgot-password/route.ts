import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { formatZodError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

const RESET_TOKEN_TTL_MIN = 30;

export async function POST(request: Request) {
  // IP başı 5 istek / 15 dk — brute-force enumeration koruması
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = checkRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek, lütfen daha sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, suspended: true },
  });

  // Her durumda 200 döneriz — user enumeration saldırısını engellemek için.
  // Sadece kullanıcı varsa ve suspended değilse gerçekten email göndeririz.
  const generic = NextResponse.json({
    message:
      "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.",
  });

  if (!user || user.suspended) return generic;

  // Token: raw 32 byte crypto-random, DB'de hash'li saklanır (sızıntıda güvenli)
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60_000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://wasend.tech";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  const tpl = passwordResetEmail({
    name: user.name || user.email,
    resetUrl,
    expiresInMin: RESET_TOKEN_TTL_MIN,
  });

  // Fire-and-forget'e benzer — hata olsa bile 200 dönelim (email provider
  // geçici sorunları kullanıcıya sızmasın)
  sendEmail({ to: user.email, ...tpl }).catch((e) =>
    console.error("forgot-password email failed:", e),
  );

  return generic;
}

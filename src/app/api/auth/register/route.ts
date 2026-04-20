import crypto from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isBootstrapAdminEmail } from "@/lib/admin-guard";
import { sendEmail, emailVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatZodError } from "@/lib/validation";
import { verifyRecaptcha } from "@/lib/recaptcha";

const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin").max(200),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(200, "Şifre en fazla 200 karakter"),
  name: z.string().min(1, "İsim zorunlu").max(200),
  businessName: z.string().max(200).optional().nullable(),
  inviteToken: z.string().optional().nullable(),
  recaptchaToken: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    // IP-bazlı rate limit (brute force + bot spam koruması)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rl = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok fazla kayıt denemesi, lütfen daha sonra tekrar deneyin." },
        { status: 429 },
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
    }
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { email: rawEmail, password, name, businessName, inviteToken, recaptchaToken } =
      parsed.data;
    const email = rawEmail.toLowerCase().trim();

    // reCAPTCHA: production'da zorunlu, dev'de soft
    const captcha = await verifyRecaptcha(recaptchaToken || "", "register", ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { error: captcha.reason || "Bot doğrulama başarısız" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta zaten kayıtlı" },
        { status: 400 },
      );
    }

    let role = "OWNER";
    let invite: { id: string; email: string; role: string; expiresAt: Date } | null =
      null;
    if (inviteToken) {
      invite = await prisma.teamInvite.findUnique({
        where: { token: inviteToken },
        select: { id: true, email: true, role: true, expiresAt: true },
      });
      if (!invite) {
        return NextResponse.json(
          { error: "Davet bulunamadı" },
          { status: 400 },
        );
      }
      if (invite.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Davetin süresi dolmuş" },
          { status: 400 },
        );
      }
      if (invite.email.toLowerCase() !== email) {
        return NextResponse.json(
          { error: "Bu davet başka bir e-posta için oluşturulmuş" },
          { status: 400 },
        );
      }
      role = invite.role;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const isSuperAdmin = isBootstrapAdminEmail(email);

    // Email verify token (raw, email ile gönderilir; DB'de sha256 hash'li saklanır)
    const rawVerifyToken = crypto.randomBytes(32).toString("base64url");
    const verifyTokenHash = crypto
      .createHash("sha256")
      .update(rawVerifyToken)
      .digest("hex");

    // Invite yoluyla kayıt olan kullanıcı zaten davet kabulü ile email doğrulanmış
    // sayılır (email eşleşmesi yapıldı). Yoksa emailVerifiedAt null bırakılır.
    const autoVerified = !!invite;

    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name,
        businessName: businessName ?? null,
        role,
        isSuperAdmin,
        emailVerifyToken: autoVerified ? null : verifyTokenHash,
        emailVerifiedAt: autoVerified ? new Date() : null,
      },
    });

    if (invite) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
    }

    // Email gönderimi (fire-and-forget, başarısızsa kayıt yine tamam — user resend edebilir)
    if (!autoVerified) {
      const baseUrl =
        process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://wasend.tech";
      const verifyUrl = `${baseUrl}/verify-email?token=${rawVerifyToken}`;
      const tpl = emailVerificationEmail({ name, verifyUrl });
      sendEmail({ to: email, ...tpl }).catch((e) =>
        console.error("verify email failed:", e),
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      requiresVerification: !autoVerified,
    });
  } catch (error) {
    console.error("register error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}

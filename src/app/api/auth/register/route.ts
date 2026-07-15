import crypto from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailVerificationEmail, welcomeEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatZodError } from "@/lib/validation";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { getTrustedClientIp } from "@/lib/client-ip";

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

class InviteUnavailableError extends Error {}

export async function POST(request: Request) {
  try {
    // IP-bazlı rate limit (brute force + bot spam koruması)
    const ip = getTrustedClientIp(request.headers) ?? "unknown";
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
    let invite: {
      id: string;
      email: string;
      role: string;
      expiresAt: Date;
      usedAt: Date | null;
    } | null = null;
    if (inviteToken) {
      invite = await prisma.teamInvite.findUnique({
        where: { token: inviteToken },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          usedAt: true,
        },
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
      if (invite.usedAt) {
        return NextResponse.json(
          { error: "Bu davet daha önce kullanılmış" },
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

    // Email verify token (raw, email ile gönderilir; DB'de sha256 hash'li saklanır)
    const rawVerifyToken = crypto.randomBytes(32).toString("base64url");
    const verifyTokenHash = crypto
      .createHash("sha256")
      .update(rawVerifyToken)
      .digest("hex");

    // Invite yoluyla kayıt olan kullanıcı zaten davet kabulü ile email doğrulanmış
    // sayılır (email eşleşmesi yapıldı). Yoksa emailVerifiedAt null bırakılır.
    const autoVerified = !!invite;

    const userData = {
      email,
      hashedPassword,
      name,
      businessName: businessName ?? null,
      role,
      emailVerifyToken: autoVerified ? null : verifyTokenHash,
      emailVerifiedAt: autoVerified ? new Date() : null,
    };

    const user = invite
      ? await prisma.$transaction(async (tx) => {
          const consumed = await tx.teamInvite.updateMany({
            where: {
              id: invite.id,
              usedAt: null,
              expiresAt: { gte: new Date() },
            },
            data: { usedAt: new Date() },
          });
          if (consumed.count !== 1) throw new InviteUnavailableError();
          return tx.user.create({ data: userData });
        })
      : await prisma.user.create({ data: userData });

    // Email gönderimi (fire-and-forget, başarısızsa kayıt yine tamam — user resend edebilir)
    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://wasend.tech";
    if (!autoVerified) {
      const verifyUrl = `${baseUrl}/verify-email?token=${rawVerifyToken}`;
      const tpl = emailVerificationEmail({ name, verifyUrl });
      sendEmail({ to: email, ...tpl }).catch((e) =>
        console.error("verify email failed:", e),
      );
    } else {
      // Invite yoluyla auto-verified — direkt welcome yolla
      const tpl = welcomeEmail({ name, dashboardUrl: baseUrl });
      sendEmail({ to: email, ...tpl }).catch((e) =>
        console.error("welcome email failed:", e),
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      requiresVerification: !autoVerified,
    });
  } catch (error) {
    if (error instanceof InviteUnavailableError) {
      return NextResponse.json(
        { error: "Davet artık geçerli değil veya daha önce kullanılmış" },
        { status: 409 },
      );
    }
    console.error("register error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}

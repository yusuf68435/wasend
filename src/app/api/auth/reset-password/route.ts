import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatZodError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTrustedClientIp } from "@/lib/client-ip";

const schema = z.object({
  token: z.string().min(16).max(200),
  password: z
    .string()
    .min(8, "En az 8 karakter")
    .max(200, "En fazla 200 karakter"),
});

export async function POST(request: Request) {
  // Token brute-force koruması: IP başı 20 istek / 15 dk
  const ip = getTrustedClientIp(request.headers) ?? "unknown";
  const rl = checkRateLimit(`reset:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek" },
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

  const tokenHash = crypto
    .createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const user = await prisma.user.findUnique({
    where: { passwordResetToken: tokenHash },
    select: {
      id: true,
      passwordResetExpiresAt: true,
      suspended: true,
    },
  });

  if (
    !user ||
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: "Bağlantı geçersiz veya süresi dolmuş" },
      { status: 400 },
    );
  }

  if (user.suspended) {
    return NextResponse.json(
      { error: "Hesap askıya alındı" },
      { status: 403 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  const consumed = await prisma.user.updateMany({
    where: {
      id: user.id,
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: { gte: new Date() },
      suspended: false,
      deletedAt: null,
    },
    data: {
      hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });
  if (consumed.count !== 1) {
    return NextResponse.json(
      { error: "Bağlantı daha önce kullanılmış veya süresi dolmuş" },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true });
}

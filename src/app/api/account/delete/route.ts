import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";
import { withErrorHandling, ValidationError } from "@/lib/api-error";

/**
 * KVKK/GDPR self-service hesap silme.
 *
 * Güvenlik: mevcut parolayı doğrulama zorunlu. Son süper admini silmeye izin yok.
 *
 * Davranış: Soft delete (deletedAt set) + suspended=true. Kullanıcı giriş yapamaz.
 * Veri 30 gün tutulur (geri alma penceresi), sonra cron ile hard delete.
 * Cascade delete mevcut — hard-delete olduğunda tüm bağlı kayıtlar gider.
 */
const schema = z.object({
  password: z.string().min(1, "Şifre zorunlu"),
  confirm: z.literal("HESABIMI SIL"),
});

export const POST = withErrorHandling(async (request: Request) => {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Geçersiz JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw parsed.error;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      hashedPassword: true,
      isSuperAdmin: true,
    },
  });
  if (!user) throw new ValidationError("Kullanıcı bulunamadı");

  // Parola doğrulama
  const ok = await bcrypt.compare(parsed.data.password, user.hashedPassword);
  if (!ok) {
    return NextResponse.json({ error: "Şifre yanlış" }, { status: 401 });
  }

  // Son süper admin korunması
  if (user.isSuperAdmin) {
    const count = await prisma.user.count({
      where: { isSuperAdmin: true, deletedAt: null },
    });
    if (count <= 1) {
      return NextResponse.json(
        {
          error:
            "Son süper admin siz olduğunuz için hesabınızı silemezsiniz. Önce başka bir admine yetki verin.",
        },
        { status: 403 },
      );
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      suspended: true,
      suspendReason: "Kullanıcı tarafından silindi",
    },
  });

  return NextResponse.json({
    success: true,
    message:
      "Hesap silindi. 30 gün içinde destek ile iletişime geçerek geri alabilirsiniz.",
  });
});

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readImpersonationCookie } from "@/lib/impersonation";
import { prisma } from "@/lib/prisma";

/**
 * API route'larında kullanılacak ortak auth helper.
 * Session yoksa 401 Response döner, varsa userId string'i döner.
 *
 * Impersonation: super admin geçici olarak başka bir tenant adına çalışıyorsa
 * (signed cookie), döndürülen userId impersonated target'tır. Admin route'ları
 * bu durumda kendi akışlarında requireSuperAdmin kullanmaya devam etmeli.
 *
 * Kullanım:
 *   const result = await requireUserId();
 *   if (typeof result !== "string") return result; // 401 response
 *   const userId = result;
 */
export async function requireUserId(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (session.user?.isSuperAdmin) {
    const imp = await readImpersonationCookie();
    if (imp) return imp.userId;
  }

  return id;
}

/**
 * Aynı auth kontrolü ama plan/role bilgisiyle birlikte.
 * Normal session'da JWT'den okunur, DB hit yok.
 *
 * Impersonation aktifken:
 *   - id   → target userId
 *   - plan → target'ın DB'deki gerçek plan'ı (JWT'deki admin plan'ı DEĞİL)
 *   - role → target'ın rolü
 *   - email → target'ın email'i
 *   - isSuperAdmin → false (impersonated user tenant user'dır)
 *
 * Bunu tek DB round-trip'le yaparız. Amaç: admin PRO iken STARTER tenant'ı
 * temsil ederken plan limitlerinin admin planına kaçmasını engellemek
 * (quota bypass / billing fraud).
 */
export async function requireUser(): Promise<
  | {
      id: string;
      email: string;
      plan: string;
      role: string;
      isSuperAdmin: boolean;
      impersonating: boolean;
    }
  | NextResponse
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (session.user.isSuperAdmin) {
    const imp = await readImpersonationCookie();
    if (imp) {
      const target = await prisma.user.findUnique({
        where: { id: imp.userId },
        select: { id: true, email: true, plan: true, role: true },
      });
      if (!target) {
        return NextResponse.json(
          { error: "Impersonation target bulunamadı" },
          { status: 404 },
        );
      }
      return {
        id: target.id,
        email: target.email,
        plan: target.plan || "STARTER",
        role: target.role || "OWNER",
        isSuperAdmin: false,
        impersonating: true,
      };
    }
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
    plan: session.user.plan || "STARTER",
    role: session.user.role || "OWNER",
    isSuperAdmin: session.user.isSuperAdmin || false,
    impersonating: false,
  };
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof Response;
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readImpersonationCookie } from "@/lib/impersonation";

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
 * JWT'den okunur, DB hit yok.
 *
 * Impersonation aktifken id alanı target userId olur; plan/role/email
 * admin'in kendi JWT'sinden gelir (impersonation için bilinçli tradeoff —
 * plan limitlerini admin tarafı normal tenant akışında değerlendirmek istemez).
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

  let id = session.user.id;
  let impersonating = false;
  if (session.user.isSuperAdmin) {
    const imp = await readImpersonationCookie();
    if (imp) {
      id = imp.userId;
      impersonating = true;
    }
  }

  return {
    id,
    email: session.user.email || "",
    plan: session.user.plan || "STARTER",
    role: session.user.role || "OWNER",
    isSuperAdmin: session.user.isSuperAdmin || false,
    impersonating,
  };
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof Response;
}

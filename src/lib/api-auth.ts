import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API route'larında kullanılacak ortak auth helper.
 * Session yoksa 401 Response döner, varsa userId string'i döner.
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
  return id;
}

/**
 * Aynı auth kontrolü ama plan/role bilgisiyle birlikte.
 * JWT'den okunur, DB hit yok.
 */
export async function requireUser(): Promise<
  | { id: string; email: string; plan: string; role: string; isSuperAdmin: boolean }
  | NextResponse
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  return {
    id: session.user.id,
    email: session.user.email || "",
    plan: session.user.plan || "STARTER",
    role: session.user.role || "OWNER",
    isSuperAdmin: session.user.isSuperAdmin || false,
  };
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof Response;
}

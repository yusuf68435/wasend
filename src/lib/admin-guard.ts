import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasValidTotpCookie } from "@/lib/admin-totp-gate";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}

/**
 * ADMIN_IP_ALLOWLIST env (virgüllü IP listesi, opsiyonel).
 * Set ise /admin erişimi sadece bu IP'lerden; unauth 403 redirect.
 * Boş ise kontrol yapılmaz (dev kolaylığı).
 */
async function checkAdminIpAllowlist(): Promise<boolean> {
  const raw = process.env.ADMIN_IP_ALLOWLIST;
  if (!raw) return true;
  const allowed = raw
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  const h = await headers();
  const xf = h.get("x-forwarded-for");
  const ip = xf ? xf.split(",")[0].trim() : (h.get("x-real-ip")?.trim() ?? "");
  return allowed.includes(ip);
}

/**
 * JWT'de isSuperAdmin cache'li. Her istekte DB'ye gitmez.
 * 10 dakikada bir auth.ts jwt callback'inde tazelenir, ya da client `update()` çağırırsa.
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?next=/admin");

  if (!session.user.isSuperAdmin) redirect("/dashboard");

  // IP whitelist (opsiyonel, env-controlled)
  if (!(await checkAdminIpAllowlist())) {
    redirect("/dashboard?reason=ip-blocked");
  }

  // 2FA gate: kullanıcının TOTP aktifse ve bu session'da geçmediyse verify sayfası
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpEnabled: true },
  });
  if (user?.totpEnabled && !(await hasValidTotpCookie(session.user.id))) {
    redirect("/verify-2fa?next=/admin");
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    isSuperAdmin: true,
  };
}

export async function getSuperAdminOrNull(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isSuperAdmin) return null;
  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    isSuperAdmin: true,
  };
}

/**
 * /admin/verify-2fa sayfası için — TOTP kontrolü atlatılır, sadece
 * super admin olduğunu kontrol eder. Infinite redirect önler.
 */
export async function requireSuperAdminSkipTotp(): Promise<AdminUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?next=/admin");
  if (!session.user.isSuperAdmin) redirect("/dashboard");
  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    isSuperAdmin: true,
  };
}

// Güvenlik hassasiyeti yüksek yerler için — DB'den taze okur (promote/demote
// hemen etkin olmalıysa bu'yu kullan; normal admin page için getSuperAdminOrNull)
export async function getSuperAdminFresh(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
    },
  });
  if (!user?.isSuperAdmin) return null;
  return user as AdminUser;
}

// Checks if the email is in the ADMIN_EMAILS env list (comma separated).
// Used during registration to auto-grant isSuperAdmin.
export function isBootstrapAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return false;
  const list = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

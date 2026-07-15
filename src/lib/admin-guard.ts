import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasValidTotpCookie } from "@/lib/admin-totp-gate";
import { getTrustedClientIp } from "@/lib/client-ip";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}

interface FreshAdmin extends AdminUser {
  totpEnabled: boolean;
}

async function checkAdminIpAllowlist(): Promise<boolean> {
  const raw = process.env.ADMIN_IP_ALLOWLIST;
  if (!raw) return true;

  const allowed = raw
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;

  const requestHeaders = await headers();
  const ip = getTrustedClientIp(requestHeaders);
  return ip !== null && allowed.includes(ip);
}

async function loadFreshAdmin(id: string): Promise<FreshAdmin | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
      suspended: true,
      deletedAt: true,
      totpEnabled: true,
    },
  });

  if (
    !user ||
    !user.isSuperAdmin ||
    user.suspended ||
    user.deletedAt !== null
  ) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: true,
    totpEnabled: user.totpEnabled,
  };
}

async function sessionAdmin(): Promise<{
  hasSession: boolean;
  admin: FreshAdmin | null;
}> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return { hasSession: false, admin: null };
  return { hasSession: true, admin: await loadFreshAdmin(id) };
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const { hasSession, admin } = await sessionAdmin();
  if (!hasSession) redirect("/login?next=/admin");
  if (!admin) redirect("/dashboard");
  if (!(await checkAdminIpAllowlist())) {
    redirect("/dashboard?reason=ip-blocked");
  }
  if (admin.totpEnabled && !(await hasValidTotpCookie(admin.id))) {
    redirect("/verify-2fa?next=/admin");
  }
  return admin;
}

export async function getSuperAdminOrNull(): Promise<AdminUser | null> {
  const { admin } = await sessionAdmin();
  if (!admin || !(await checkAdminIpAllowlist())) return null;
  if (admin.totpEnabled && !(await hasValidTotpCookie(admin.id))) return null;
  return admin;
}

/** Used by the 2FA status/enroll/verify flow to avoid a redirect loop. */
export async function requireSuperAdminSkipTotp(): Promise<AdminUser> {
  const { hasSession, admin } = await sessionAdmin();
  if (!hasSession) redirect("/login?next=/admin");
  if (!admin) redirect("/dashboard");
  if (!(await checkAdminIpAllowlist())) {
    redirect("/dashboard?reason=ip-blocked");
  }
  return admin;
}

export async function getSuperAdminFresh(): Promise<AdminUser | null> {
  return getSuperAdminOrNull();
}

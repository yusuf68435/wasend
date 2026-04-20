import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}

/**
 * JWT'de isSuperAdmin cache'li. Her istekte DB'ye gitmez.
 * 10 dakikada bir auth.ts jwt callback'inde tazelenir, ya da client `update()` çağırırsa.
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
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

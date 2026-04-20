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

export async function requireSuperAdmin(): Promise<AdminUser> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id: string } | undefined)?.id;
  if (!id) redirect("/login?next=/admin");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
    },
  });

  if (!user?.isSuperAdmin) redirect("/dashboard");
  return user as AdminUser;
}

export async function getSuperAdminOrNull(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id: string } | undefined)?.id;
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

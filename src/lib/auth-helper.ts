import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { readImpersonationCookie } from "@/lib/impersonation";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const sessionUser = session.user as {
    id: string;
    name: string;
    email: string;
    isSuperAdmin?: boolean;
  };

  if (sessionUser.isSuperAdmin) {
    const imp = await readImpersonationCookie();
    if (imp) {
      const target = await prisma.user.findUnique({
        where: { id: imp.userId },
        select: { id: true, name: true, email: true },
      });
      if (target) return { id: target.id, name: target.name, email: target.email };
    }
  }

  return sessionUser;
}

export async function getImpersonationState(): Promise<
  { active: false } | { active: true; targetId: string; targetEmail: string; adminEmail: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { active: false };
  const sessionUser = session.user as {
    id: string;
    email: string;
    isSuperAdmin?: boolean;
  };
  if (!sessionUser.isSuperAdmin) return { active: false };
  const imp = await readImpersonationCookie();
  if (!imp) return { active: false };
  const target = await prisma.user.findUnique({
    where: { id: imp.userId },
    select: { id: true, email: true },
  });
  if (!target) return { active: false };
  return {
    active: true,
    targetId: target.id,
    targetEmail: target.email,
    adminEmail: sessionUser.email,
  };
}

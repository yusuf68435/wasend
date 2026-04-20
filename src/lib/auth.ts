import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// JWT token'ında cache'lenen alanlar — her istekte DB hit etmemek için.
// 10 dakikada bir DB'den tazelenir (suspend/plan değişiklikleri makul gecikme).
const JWT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;
        if (user.deletedAt) {
          throw new Error("Hesap silindi. Destek ile iletişime geçin.");
        }
        if (user.suspended) {
          throw new Error("Hesap askıya alındı. Lütfen destek ile iletişime geçin.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) return null;

        // Fire-and-forget lastSeenAt update
        prisma.user
          .update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })
          .catch(() => undefined);

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // İlk login'de user var — profile alanlarını cache'e al
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            isSuperAdmin: true,
            plan: true,
            suspended: true,
            role: true,
          },
        });
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false;
        token.plan = dbUser?.plan ?? "STARTER";
        token.suspended = dbUser?.suspended ?? false;
        token.role = dbUser?.role ?? "OWNER";
        token.refreshedAt = Date.now();
        return token;
      }

      // Token update tetiklendiyse (client-side update()) veya
      // 10 dakikadan eski ise DB'den tazele
      const refreshedAt = Number(token.refreshedAt ?? 0);
      const isStale = Date.now() - refreshedAt > JWT_REFRESH_INTERVAL_MS;

      if (trigger === "update" || isStale) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            isSuperAdmin: true,
            plan: true,
            suspended: true,
            role: true,
          },
        });
        if (dbUser) {
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.plan = dbUser.plan;
          token.suspended = dbUser.suspended;
          token.role = dbUser.role;
          token.refreshedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as SessionUser;
        u.id = token.id as string;
        u.isSuperAdmin = Boolean(token.isSuperAdmin);
        u.plan = (token.plan as string) ?? "STARTER";
        u.role = (token.role as string) ?? "OWNER";
        u.suspended = Boolean(token.suspended);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  isSuperAdmin?: boolean;
  plan?: string;
  role?: string;
  suspended?: boolean;
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

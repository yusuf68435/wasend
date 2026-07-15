import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  passwordFingerprint,
  shouldInvalidateSession,
} from "@/lib/session-security";

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
        if (!user.emailVerifiedAt) {
          throw new Error("E-posta adresinizi doğrulayın.");
        }

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.invalidated = false;
        token.passwordFingerprint = undefined;
      }

      if (token.invalidated) return token;

      const id = typeof token.id === "string" ? token.id : "";
      if (!id) {
        token.invalidated = true;
        return token;
      }

      // Security-sensitive account state is refreshed for every session read.
      // This immediately revokes suspended/deleted/password-reset sessions and
      // prevents stale super-admin claims from surviving a demotion.
      const dbUser = await prisma.user.findUnique({
        where: { id },
        select: {
          isSuperAdmin: true,
          plan: true,
          suspended: true,
          deletedAt: true,
          emailVerifiedAt: true,
          role: true,
          hashedPassword: true,
        },
      });
      const currentFingerprint = dbUser
        ? passwordFingerprint(dbUser.hashedPassword)
        : "";
      if (!dbUser || shouldInvalidateSession(dbUser, token.passwordFingerprint)) {
        token.invalidated = true;
        token.isSuperAdmin = false;
        token.suspended = true;
        return token;
      }

      token.isSuperAdmin = dbUser.isSuperAdmin;
      token.plan = dbUser.plan;
      token.suspended = false;
      token.role = dbUser.role;
      token.passwordFingerprint = currentFingerprint;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as SessionUser;
        const invalidated = Boolean(token.invalidated);
        u.id = invalidated ? "" : (token.id as string);
        u.isSuperAdmin = invalidated ? false : Boolean(token.isSuperAdmin);
        u.plan = (token.plan as string) ?? "STARTER";
        u.role = (token.role as string) ?? "OWNER";
        u.suspended = invalidated || Boolean(token.suspended);
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

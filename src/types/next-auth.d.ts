import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSuperAdmin?: boolean;
      plan?: string;
      role?: string;
      suspended?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isSuperAdmin?: boolean;
    plan?: string;
    role?: string;
    suspended?: boolean;
    refreshedAt?: number;
  }
}

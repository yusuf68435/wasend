export type Role = "OWNER" | "ADMIN" | "AGENT" | "VIEWER";

const RANK: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  AGENT: 2,
  VIEWER: 1,
};

export function hasAtLeast(
  userRole: string | null | undefined,
  required: Role,
): boolean {
  const r = (userRole as Role) || "VIEWER";
  return (RANK[r] ?? 0) >= RANK[required];
}

export function isAdmin(userRole: string | null | undefined): boolean {
  return hasAtLeast(userRole, "ADMIN");
}

export function canSendMessages(userRole: string | null | undefined): boolean {
  return hasAtLeast(userRole, "AGENT");
}

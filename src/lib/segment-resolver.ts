import { prisma } from "@/lib/prisma";

export type SegmentRule =
  | { field: "tag"; op: "has" | "not-has"; value: string }
  | { field: "optedOut"; op: "eq"; value: boolean }
  | { field: "language"; op: "eq" | "neq"; value: string }
  | { field: "source"; op: "eq" | "neq"; value: string }
  | { field: "lastMessageAt"; op: "lt" | "gt"; daysAgo: number }
  | { field: "createdAt"; op: "lt" | "gt"; daysAgo: number };

export interface SegmentRuleSet {
  mode: "and" | "or";
  rules: SegmentRule[];
}

export function parseRules(raw: string | null | undefined): SegmentRuleSet | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.rules) ||
      (parsed.mode !== "and" && parsed.mode !== "or")
    ) {
      return null;
    }
    return parsed as SegmentRuleSet;
  } catch {
    return null;
  }
}

interface ContactShape {
  tags: string | null;
  optedOut: boolean;
  language: string;
  source: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}

function matchesRule(c: ContactShape, r: SegmentRule, now: Date): boolean {
  switch (r.field) {
    case "tag": {
      const tags = (c.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const has = tags.includes(r.value.toLowerCase());
      return r.op === "has" ? has : !has;
    }
    case "optedOut":
      return c.optedOut === r.value;
    case "language":
      return r.op === "eq" ? c.language === r.value : c.language !== r.value;
    case "source":
      return r.op === "eq" ? c.source === r.value : c.source !== r.value;
    case "lastMessageAt": {
      if (!c.lastMessageAt) return r.op === "lt" ? false : true;
      const cutoff = now.getTime() - r.daysAgo * 86400000;
      const ts = c.lastMessageAt.getTime();
      return r.op === "lt" ? ts < cutoff : ts > cutoff;
    }
    case "createdAt": {
      const cutoff = now.getTime() - r.daysAgo * 86400000;
      const ts = c.createdAt.getTime();
      return r.op === "lt" ? ts < cutoff : ts > cutoff;
    }
  }
}

export async function resolveSegmentContacts(
  userId: string,
  ruleSet: SegmentRuleSet,
): Promise<
  Array<{
    id: string;
    phone: string;
    name: string;
    tags: string | null;
  }>
> {
  const all = await prisma.contact.findMany({
    where: { userId },
    select: {
      id: true,
      phone: true,
      name: true,
      tags: true,
      optedOut: true,
      language: true,
      source: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const filtered = all.filter((c) => {
    if (ruleSet.rules.length === 0) return true;
    if (ruleSet.mode === "and") return ruleSet.rules.every((r) => matchesRule(c, r, now));
    return ruleSet.rules.some((r) => matchesRule(c, r, now));
  });

  return filtered.map((c) => ({
    id: c.id,
    phone: c.phone,
    name: c.name,
    tags: c.tags,
  }));
}

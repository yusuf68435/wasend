export type MatchType = "contains" | "exact" | "regex";

export function matchesTrigger(
  text: string,
  trigger: string,
  matchType: string | null | undefined,
): boolean {
  if (!text || !trigger) return false;
  const t = (matchType as MatchType) || "contains";
  const lowerText = text.toLowerCase();
  const lowerTrigger = trigger.toLowerCase();

  if (t === "exact") {
    return lowerText.trim() === lowerTrigger.trim();
  }

  if (t === "regex") {
    try {
      return new RegExp(trigger, "i").test(text);
    } catch {
      return false;
    }
  }

  return lowerText.includes(lowerTrigger);
}

export function mergeTags(
  existing: string | null | undefined,
  toAdd: string | null | undefined,
): string | null {
  if (!toAdd) return existing ?? null;

  const addSet = new Set(
    toAdd
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.toLowerCase()),
  );
  if (addSet.size === 0) return existing ?? null;

  const existingList = (existing || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const existingLower = new Set(existingList.map((t) => t.toLowerCase()));

  const merged = [...existingList];
  for (const t of addSet) {
    if (!existingLower.has(t)) merged.push(t);
  }
  return merged.join(",");
}

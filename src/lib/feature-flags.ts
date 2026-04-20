import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Basit feature flag sistemi.
 *
 * Flag değerlendirme akışı:
 *  1. enabled=false ise → false
 *  2. targetPlans set ise ve kullanıcının plan'ı orada yoksa → false
 *  3. rolloutPct=100 ise → true
 *  4. rolloutPct=X → user.id hash'i ile stabil %X deterministik seçim
 *
 * Hash stabil: aynı user aynı flag'i hep ya alır ya almaz (% değişmediği sürece).
 * Cache: process başına 1 dakika TTL. Admin değişikliği için 1 dakika gecikme kabul.
 */

interface FlagRow {
  enabled: boolean;
  rolloutPct: number;
  targetPlans: string | null;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: FlagRow | null }>();

async function getFlag(key: string): Promise<FlagRow | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const row = await prisma.featureFlag.findUnique({
    where: { key },
    select: { enabled: true, rolloutPct: true, targetPlans: true },
  });
  cache.set(key, { at: Date.now(), value: row });
  return row;
}

function stableBucket(userId: string, flagKey: string): number {
  const h = createHash("sha256").update(`${flagKey}:${userId}`).digest();
  // İlk 4 byte → uint32 → 0-99
  const n = h.readUInt32BE(0);
  return n % 100;
}

export async function isFeatureEnabled(
  key: string,
  user?: { id: string; plan?: string } | null,
): Promise<boolean> {
  const flag = await getFlag(key);
  if (!flag || !flag.enabled) return false;

  if (flag.targetPlans && user?.plan) {
    const plans = flag.targetPlans
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
    if (plans.length > 0 && !plans.includes(user.plan.toUpperCase())) return false;
  }

  if (flag.rolloutPct >= 100) return true;
  if (flag.rolloutPct <= 0) return false;
  if (!user) return false;

  return stableBucket(user.id, key) < flag.rolloutPct;
}

export function invalidateFeatureFlagCache(): void {
  cache.clear();
}

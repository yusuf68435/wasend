import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * env.ts modülü yan etkili (import anında validate çalışır), bu yüzden
 * schema'yı izole test etmek için aynı kural setini burada yeniden kurar
 * ve testler schema üzerinde çalışır. Asıl kontrol: prod modunda zorunlu
 * alanlar eksikse fail eder.
 */

function buildSchema(isProd: boolean) {
  const prodRequired = (s: z.ZodString) =>
    isProd ? s.min(1) : s.optional();
  return z.object({
    NEXTAUTH_SECRET: z.string().min(16),
    DATABASE_URL: z.string().min(1),
    WHATSAPP_API_TOKEN: prodRequired(z.string()),
    WHATSAPP_PHONE_NUMBER_ID: prodRequired(z.string()),
  });
}

describe("env schema — production", () => {
  const schema = buildSchema(true);

  it("fails when WHATSAPP_API_TOKEN missing", () => {
    const r = schema.safeParse({
      NEXTAUTH_SECRET: "a".repeat(32),
      DATABASE_URL: "postgres://x",
    });
    expect(r.success).toBe(false);
  });

  it("passes with all required", () => {
    const r = schema.safeParse({
      NEXTAUTH_SECRET: "a".repeat(32),
      DATABASE_URL: "postgres://x",
      WHATSAPP_API_TOKEN: "token",
      WHATSAPP_PHONE_NUMBER_ID: "123",
    });
    expect(r.success).toBe(true);
  });

  it("fails NEXTAUTH_SECRET too short", () => {
    const r = schema.safeParse({
      NEXTAUTH_SECRET: "short",
      DATABASE_URL: "postgres://x",
      WHATSAPP_API_TOKEN: "token",
      WHATSAPP_PHONE_NUMBER_ID: "123",
    });
    expect(r.success).toBe(false);
  });
});

describe("env schema — development", () => {
  const schema = buildSchema(false);

  it("passes without WHATSAPP creds", () => {
    const r = schema.safeParse({
      NEXTAUTH_SECRET: "a".repeat(32),
      DATABASE_URL: "file:./dev.db",
    });
    expect(r.success).toBe(true);
  });
});

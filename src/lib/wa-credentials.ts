/**
 * WhatsApp credential resolver — per-tenant + env fallback.
 *
 * Phase A (shared WABA): tüm firmalar tek env token kullanır.
 * Phase C (BYO): firma kendi Meta App'ini bağlar, token'ını DB'ye yapıştırır.
 *
 * Resolver mantığı (precedence):
 *   1. User record'unda waApiToken varsa → decrypt edilip kullanılır
 *   2. Yoksa → global env (WHATSAPP_API_TOKEN) fallback
 *   3. Her ikisi de yoksa → null (caller "ayarlar eksik" hatası dönecek)
 *
 * phoneNumberId her zaman user.phone'dan gelir (env fallback yok — phone
 * number zaten tenant-specific).
 *
 * appSecret webhook signature doğrulaması için; verifyToken webhook GET
 * verify handshake için.
 */

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret-crypto";

export interface WACredentials {
  apiToken: string | null;
  phoneNumberId: string | null;
  appSecret: string | null;
  verifyToken: string | null;
  wabaId: string | null;
  /** Kimlik bilgilerinin kaynak durumu — debug / health check için */
  source: "user" | "env" | "mixed" | "missing";
}

type UserCreds = {
  phone: string | null;
  waApiToken: string | null;
  waAppSecret: string | null;
  waVerifyToken: string | null;
  waWabaId: string | null;
};

/**
 * User record'una bakar, eksik alanları env'den doldurur.
 *
 * Performance: settings/send hot path'inde kullanılacak, o yüzden tek bir
 * prisma call. Caller user record'u zaten elindeyse resolveFromUser()
 * daha verimli — DB lookup yok.
 */
export async function resolveWACredentials(userId: string): Promise<WACredentials> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      waApiToken: true,
      waAppSecret: true,
      waVerifyToken: true,
      waWabaId: true,
    },
  });
  return resolveFromUser(u);
}

export function resolveFromUser(u: UserCreds | null): WACredentials {
  const userApiToken = u?.waApiToken ? decryptSecret(u.waApiToken) : null;
  const userAppSecret = u?.waAppSecret ? decryptSecret(u.waAppSecret) : null;

  const envApiToken = process.env.WHATSAPP_API_TOKEN?.trim() || null;
  const envAppSecret = process.env.WHATSAPP_APP_SECRET?.trim() || null;
  const envVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim() || null;
  const envWabaId = process.env.WHATSAPP_WABA_ID?.trim() || null;

  const apiToken = userApiToken || envApiToken;
  const appSecret = userAppSecret || envAppSecret;
  const verifyToken = u?.waVerifyToken || envVerifyToken;
  const wabaId = u?.waWabaId || envWabaId;
  const phoneNumberId = u?.phone?.trim() || null;

  let source: WACredentials["source"] = "missing";
  const hasUser = !!(userApiToken || userAppSecret || u?.waVerifyToken || u?.waWabaId);
  const hasEnv = !!(envApiToken || envAppSecret || envVerifyToken || envWabaId);
  if (hasUser && hasEnv) source = "mixed";
  else if (hasUser) source = "user";
  else if (hasEnv) source = "env";

  return { apiToken, phoneNumberId, appSecret, verifyToken, wabaId, source };
}

/**
 * Webhook GET handshake için — hub.verify_token gelen değeri ile eşleşen
 * kullanıcı VEYA env ile match eder. Env match'te user yok (shared verify
 * token - Phase A ile geriye dönük uyumluluk).
 */
export async function findUserByVerifyToken(
  token: string,
): Promise<{ matchedEnv: boolean; userId?: string }> {
  if (!token) return { matchedEnv: false };
  const env = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (env && token === env) return { matchedEnv: true };
  const user = await prisma.user.findFirst({
    where: { waVerifyToken: token },
    select: { id: true },
  });
  return { matchedEnv: false, userId: user?.id };
}

/**
 * Webhook POST: gelen phone_number_id ile user'ı bul ve onun credentials'ını
 * al. Bulunamazsa env'e düşer. Webhook imza doğrulaması için kullanılır.
 */
export async function resolveByPhoneNumberId(
  phoneNumberId: string,
): Promise<{ user: UserCreds & { id: string } | null; creds: WACredentials }> {
  const user = await prisma.user.findFirst({
    where: { phone: phoneNumberId },
    select: {
      id: true,
      phone: true,
      waApiToken: true,
      waAppSecret: true,
      waVerifyToken: true,
      waWabaId: true,
    },
  });
  const creds = resolveFromUser(user);
  return { user, creds };
}

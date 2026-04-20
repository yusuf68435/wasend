/**
 * iyzico Checkout Form entegrasyonu (hosted payment page).
 *
 * Akış:
 *  1. Kullanıcı "Satın Al" tıklar → POST /api/billing/iyzico/init
 *  2. Backend iyzipay.checkoutFormInitialize çağırır, payment token + paymentPageUrl alır
 *  3. Pending Payment kaydı yaratılır (providerToken + userId + plan + amount)
 *  4. Frontend paymentPageUrl'e redirect eder
 *  5. Kullanıcı iyzico'da kartını girer, ödeme sonucu callbackUrl'e geri gelir
 *  6. /api/billing/iyzico/callback: iyzipay.checkoutForm.retrieve(token) ile doğrular
 *  7. Başarılıysa Payment.status=paid, User.plan güncellenir
 *
 * IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL env'lerinden.
 * Sandbox: https://sandbox-api.iyzipay.com
 * Prod:    https://api.iyzipay.com
 */

import type Iyzipay from "iyzipay";

let cachedClient: Iyzipay | null = null;

export function getIyzicoClient(): Iyzipay | null {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) return null;

  // Dinamik import — paket yoksa hata fırlatmasın
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IyzipayCtor = require("iyzipay") as typeof Iyzipay;
  cachedClient = new IyzipayCtor({ apiKey, secretKey, uri: baseUrl });
  return cachedClient;
}

export function isIyzicoConfigured(): boolean {
  return !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);
}

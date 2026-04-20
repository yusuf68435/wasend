/**
 * Email soyutlama. Provider öncelik sırası:
 *   1. RESEND_API_KEY set ise → Resend API (ücretsiz 3K/ay)
 *   2. SMTP_HOST set ise → nodemailer SMTP (Gmail, cPanel, custom...)
 *   3. Prod'da hiçbiri yoksa → hata döner
 *   4. Dev'de hiçbiri yoksa → console'a yazar
 *
 * SMTP ayarları örneği (Gmail için app password gerekir):
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false    (465 için true)
 *   SMTP_USER=your@gmail.com
 *   SMTP_PASS=app-password
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

async function sendViaResend(
  input: SendEmailInput,
  from: string,
  apiKey: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return { ok: false, error: data?.message || "send failed" };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("Resend exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

async function sendViaSmtp(
  input: SendEmailInput,
  from: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { ok: true, id: info.messageId };
  } catch (e) {
    console.error("SMTP send exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const from = process.env.EMAIL_FROM || "WaSend <noreply@wasend.tech>";
  const resendKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  if (resendKey) return sendViaResend(input, from, resendKey);
  if (smtpHost) return sendViaSmtp(input, from);

  if (process.env.NODE_ENV === "production") {
    console.error("Email provider yok (RESEND_API_KEY veya SMTP_HOST eksik)");
    return { ok: false, error: "Email provider not configured" };
  }

  console.log("\n───── DEV EMAIL ─────");
  console.log("To:", input.to);
  console.log("Subject:", input.subject);
  console.log("Text:", input.text);
  console.log("─────────────────────\n");
  return { ok: true, id: "dev-log" };
}

// ——— Templates ———

export function passwordResetEmail(params: {
  name: string;
  resetUrl: string;
  expiresInMin: number;
}): { subject: string; html: string; text: string } {
  const { name, resetUrl, expiresInMin } = params;
  const subject = "WaSend — Şifre sıfırlama talebi";
  const text =
    `Merhaba ${name},\n\n` +
    `Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz:\n\n` +
    `${resetUrl}\n\n` +
    `Bu bağlantı ${expiresInMin} dakika süreyle geçerli.\n\n` +
    `Bu talebi siz yapmadıysanız e-postayı görmezden gelebilirsiniz.\n\n` +
    `— WaSend Ekibi`;
  const html = `
<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:600px;margin:auto;padding:24px;color:#222">
  <h2 style="color:#16a34a;margin:0 0 8px">WaSend</h2>
  <p style="color:#555;margin:0 0 24px">Şifre sıfırlama talebi</p>
  <p>Merhaba <strong>${escapeHtml(name)}</strong>,</p>
  <p>Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
  <p style="margin:28px 0">
    <a href="${escapeHtml(resetUrl)}" style="background:#16a34a;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;display:inline-block">
      Şifremi sıfırla
    </a>
  </p>
  <p style="color:#666;font-size:14px">
    Bu bağlantı <strong>${expiresInMin} dakika</strong> süreyle geçerli.
  </p>
  <p style="color:#888;font-size:13px;margin-top:32px">
    Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz. Şifreniz değişmeyecek.
  </p>
  <p style="color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
    — WaSend Ekibi
  </p>
</body></html>`;
  return { subject, html, text };
}

export function emailVerificationEmail(params: {
  name: string;
  verifyUrl: string;
}): { subject: string; html: string; text: string } {
  const { name, verifyUrl } = params;
  const subject = "WaSend — E-posta adresinizi doğrulayın";
  const text =
    `Merhaba ${name},\n\n` +
    `WaSend'e hoş geldin! Hesabını aktive etmek için aşağıdaki bağlantıya tıkla:\n\n` +
    `${verifyUrl}\n\n` +
    `Bağlantı 48 saat geçerlidir. Kayıt olmadıysan bu e-postayı görmezden gelebilirsin.\n\n` +
    `— WaSend Ekibi`;
  const html = `
<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:600px;margin:auto;padding:24px;color:#222">
  <h2 style="color:#16a34a;margin:0 0 8px">WaSend</h2>
  <p style="color:#555;margin:0 0 24px">E-posta doğrulama</p>
  <p>Merhaba <strong>${escapeHtml(name)}</strong>,</p>
  <p>WaSend'e hoş geldin! Hesabını aktive etmek için aşağıdaki butona tıkla:</p>
  <p style="margin:28px 0">
    <a href="${escapeHtml(verifyUrl)}" style="background:#16a34a;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;display:inline-block">
      E-postamı doğrula
    </a>
  </p>
  <p style="color:#666;font-size:14px">
    Bağlantı <strong>48 saat</strong> geçerlidir.
  </p>
  <p style="color:#888;font-size:13px;margin-top:32px">
    Kayıt olmadıysan bu e-postayı görmezden gelebilirsin.
  </p>
  <p style="color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
    — WaSend Ekibi
  </p>
</body></html>`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

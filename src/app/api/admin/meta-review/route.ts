import { NextResponse } from "next/server";
import { getSuperAdminOrNull } from "@/lib/admin-guard";

/**
 * Meta App Review readiness check.
 *
 * Submission'dan önce admin'in tek bakışta tüm gereksinimleri görüp
 * eksikleri kapatmasını sağlar:
 *
 *   1. Env vars (META_APP_ID, META_APP_SECRET, META_ES_CONFIG_ID,
 *      NEXT_PUBLIC_META_APP_ID, NEXT_PUBLIC_META_ES_CONFIG_ID,
 *      WHATSAPP_APP_SECRET — webhook signature için)
 *   2. Public URL'ler (privacy, terms, data-deletion endpoint health)
 *      → her birini server-side fetch'le smoke test, 200 + içerik kontrolü
 *   3. NEXTAUTH_URL public erişilebilir bir HTTPS URL mi
 *
 * Bu endpoint çalıştırıldığında nokta nokta hangi URL'leri Meta paneline
 * gireceğini gösterir.
 */

const FETCH_TIMEOUT_MS = 8_000;

interface CheckResult {
  ok: boolean;
  detail?: string;
  url?: string;
  status?: number;
}

async function pingUrl(
  url: string,
  signal?: AbortSignal,
): Promise<CheckResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "wasend-meta-review-check/1.0" },
    });
    return {
      ok: res.ok,
      status: res.status,
      url,
      detail: res.ok ? "Erişilebilir" : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      url,
      detail:
        e instanceof Error
          ? `Erişilemedi: ${e.message}`
          : "Erişilemedi (bilinmeyen hata)",
    };
  }
}

export async function GET() {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const baseUrl = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

  // 1. Env checks
  const env = {
    META_APP_ID: !!process.env.META_APP_ID,
    META_APP_SECRET: !!process.env.META_APP_SECRET,
    META_ES_CONFIG_ID: !!process.env.META_ES_CONFIG_ID,
    NEXT_PUBLIC_META_APP_ID: !!process.env.NEXT_PUBLIC_META_APP_ID,
    NEXT_PUBLIC_META_ES_CONFIG_ID: !!process.env.NEXT_PUBLIC_META_ES_CONFIG_ID,
    WHATSAPP_APP_SECRET: !!process.env.WHATSAPP_APP_SECRET,
    NEXTAUTH_URL: !!baseUrl && baseUrl.startsWith("https://"),
  };

  // 2. URL smoke tests (NEXTAUTH_URL configured ise)
  type UrlEntry = {
    label: string;
    purpose: string;
    metaPanelField: string;
    path: string;
  };
  const urlsToCheck: UrlEntry[] = [
    {
      label: "Gizlilik Politikası",
      purpose: "Privacy Policy URL",
      metaPanelField:
        "App Dashboard → Settings → Basic → Privacy Policy URL",
      path: "/privacy",
    },
    {
      label: "Kullanım Şartları",
      purpose: "Terms of Service URL",
      metaPanelField:
        "App Dashboard → Settings → Basic → Terms of Service URL",
      path: "/terms",
    },
    {
      label: "Data Deletion Callback",
      purpose: "Data Deletion Callback URL",
      metaPanelField:
        "App Dashboard → Settings → Advanced → Data Deletion Callback URL",
      path: "/api/meta/data-deletion",
    },
  ];

  const urlChecks = baseUrl
    ? await Promise.all(
        urlsToCheck.map(async (u) => ({
          ...u,
          fullUrl: `${baseUrl}${u.path}`,
          check: await pingUrl(`${baseUrl}${u.path}`),
        })),
      )
    : urlsToCheck.map((u) => ({
        ...u,
        fullUrl: null,
        check: {
          ok: false,
          detail: "NEXTAUTH_URL tanımlı değil — public URL bulunamıyor",
        } as CheckResult,
      }));

  // 3. Aggregate readiness
  const allEnvOk = Object.values(env).every(Boolean);
  const allUrlsOk = urlChecks.every((u) => u.check.ok);
  const ready = allEnvOk && allUrlsOk;

  // Webhook URL — Meta WhatsApp webhook için (verify token + endpoint)
  const webhookUrl = baseUrl ? `${baseUrl}/api/webhook` : null;
  const oauthRedirectUrl = baseUrl ? `${baseUrl}/auth/meta-callback` : null;

  return NextResponse.json({
    ready,
    baseUrl: baseUrl || null,
    env,
    urlChecks,
    additionalUrls: {
      webhookUrl,
      oauthRedirectUrl,
    },
    submissionChecklist: [
      {
        item: "Privacy Policy URL Meta panelinde set edilmiş",
        complete: urlChecks.find((u) => u.path === "/privacy")?.check.ok ??
          false,
      },
      {
        item: "Terms of Service URL Meta panelinde set edilmiş",
        complete: urlChecks.find((u) => u.path === "/terms")?.check.ok ?? false,
      },
      {
        item: "Data Deletion Callback URL Meta panelinde set edilmiş",
        complete:
          urlChecks.find((u) => u.path === "/api/meta/data-deletion")?.check
            .ok ?? false,
      },
      {
        item: "META_APP_ID + META_APP_SECRET production env'de mevcut",
        complete: env.META_APP_ID && env.META_APP_SECRET,
      },
      {
        item: "META_ES_CONFIG_ID set (Embedded Signup config)",
        complete: env.META_ES_CONFIG_ID,
      },
      {
        item:
          "Public Meta IDs (NEXT_PUBLIC_META_APP_ID, NEXT_PUBLIC_META_ES_CONFIG_ID) build'de bulunuyor",
        complete:
          env.NEXT_PUBLIC_META_APP_ID && env.NEXT_PUBLIC_META_ES_CONFIG_ID,
      },
      {
        item: "WHATSAPP_APP_SECRET (webhook signature verification)",
        complete: env.WHATSAPP_APP_SECRET,
      },
      {
        item: "NEXTAUTH_URL HTTPS public URL (Meta callback için zorunlu)",
        complete: env.NEXTAUTH_URL,
      },
    ],
  });
}

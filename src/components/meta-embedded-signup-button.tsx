"use client";

/**
 * Meta Embedded Signup button — tek tıkla WhatsApp Business bağlama.
 *
 * Kullanım:
 *   <MetaEmbeddedSignupButton onSuccess={() => router.refresh()} />
 *
 * Davranış:
 *   - Mount olduğunda /api/whatsapp/embedded-signup/config'a istek atar
 *   - enabled=false dönerse buton gizlenir (env eksik, admin yapılandırmalı)
 *   - enabled=true ise FB JS SDK'yı lazy yükler (connect.facebook.net/en_US/sdk.js)
 *   - Buton → FB.login(config_id, scope) → auth code alır
 *   - POST /api/whatsapp/embedded-signup { code } → backend kaydeder
 *   - Başarılı olursa onSuccess çağrılır
 *
 * FB SDK global pollution: window.FB yüklenir. Eğer başka modül zaten
 * yüklemişse reinject yapmaz.
 */

import { useEffect, useState } from "react";
import { MessageSquare, Loader2, Check } from "lucide-react";

interface FBSession {
  authResponse?: { code?: string } | null;
  status?: string;
}
interface FBSDK {
  init: (opts: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (
    cb: (res: FBSession) => void,
    opts: {
      config_id: string;
      response_type: "code";
      override_default_response_type: true;
      extras?: Record<string, unknown>;
    },
  ) => void;
}

declare global {
  interface Window {
    FB?: FBSDK;
    fbAsyncInit?: () => void;
  }
}

interface Props {
  onSuccess?: (info: { displayPhoneNumber: string }) => void;
  variant?: "primary" | "secondary";
  label?: string;
}

export function MetaEmbeddedSignupButton({
  onSuccess,
  variant = "primary",
  label = "Meta ile WhatsApp Bağla",
}: Props) {
  const [cfg, setCfg] = useState<{
    enabled: boolean;
    appId?: string;
    configId?: string;
    graphVersion?: string;
  } | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ phone: string } | null>(null);

  useEffect(() => {
    fetch("/api/whatsapp/embedded-signup/config")
      .then((r) => r.json())
      .then((d) => setCfg(d))
      .catch(() => setCfg({ enabled: false }));
  }, []);

  useEffect(() => {
    if (!cfg?.enabled || !cfg.appId) return;
    if (window.FB) {
      setSdkReady(true);
      return;
    }
    // Lazy-load FB SDK
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: cfg.appId!,
        cookie: true,
        xfbml: true,
        version: cfg.graphVersion || "v21.0",
      });
      setSdkReady(true);
    };
    const scr = document.createElement("script");
    scr.src = "https://connect.facebook.net/en_US/sdk.js";
    scr.async = true;
    scr.defer = true;
    scr.crossOrigin = "anonymous";
    document.body.appendChild(scr);
  }, [cfg]);

  function start() {
    if (!sdkReady || !window.FB || !cfg?.configId) return;
    setBusy(true);
    setErr(null);
    window.FB.login(
      (res) => {
        const code = res?.authResponse?.code;
        if (!code) {
          setBusy(false);
          setErr("İzin verilmedi ya da pencere kapatıldı");
          return;
        }
        // Backend'e gönder
        fetch("/api/whatsapp/embedded-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })
          .then(async (r) => {
            const d = await r.json().catch(() => ({}));
            if (!r.ok) {
              throw new Error(d.error || "Bağlantı başarısız");
            }
            if (d.needsSelection) {
              // MVP: çoklu numara durumunda uyar — user dashboard'dan manuel seçer
              throw new Error(
                "Birden fazla numara var — lütfen Ayarlar sayfasından seç.",
              );
            }
            setDone({ phone: d.displayPhoneNumber });
            onSuccess?.({ displayPhoneNumber: d.displayPhoneNumber });
          })
          .catch((e: Error) => setErr(e.message))
          .finally(() => setBusy(false));
      },
      {
        config_id: cfg.configId,
        response_type: "code",
        override_default_response_type: true,
      },
    );
  }

  if (cfg === null) return null; // loading
  if (!cfg.enabled) return null; // admin henüz kurmamış — buton gizli

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#1d7a3a] px-4 h-11 rounded-full text-[13px] tracking-tight">
        <Check size={14} /> Bağlandı: {done.phone}
      </div>
    );
  }

  const baseClass =
    variant === "primary"
      ? "bg-[#1877F2] text-white hover:bg-[#0d65d9]"
      : "bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:border-[#1d1d1f]/30";

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy || !sdkReady}
        className={`${baseClass} px-5 h-11 rounded-full text-[14px] font-medium tracking-tight transition disabled:opacity-50 inline-flex items-center gap-2`}
      >
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Bağlanıyor
          </>
        ) : !sdkReady ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Yükleniyor
          </>
        ) : (
          <>
            <MessageSquare size={16} /> {label}
          </>
        )}
      </button>
      {err && (
        <p className="text-[12px] text-[#ff3b30] mt-2 tracking-tight">{err}</p>
      )}
    </div>
  );
}

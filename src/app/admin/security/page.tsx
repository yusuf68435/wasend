"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Shield, ShieldCheck } from "lucide-react";

interface Status {
  totpEnabled: boolean;
}

export default function SecurityPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [enrollQr, setEnrollQr] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadStatus() {
    const res = await fetch("/api/admin/2fa/status");
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => {
    queueMicrotask(() => loadStatus());
  }, []);

  async function startEnroll() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/2fa/enroll");
    setBusy(false);
    if (!res.ok) {
      setMsg("Enroll başlatılamadı");
      return;
    }
    const d = await res.json();
    setEnrollQr(d.qrDataUrl);
    setEnrollSecret(d.secret);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollSecret) return;
    setBusy(true);
    const res = await fetch("/api/admin/2fa/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: enrollSecret, token: confirmToken }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(d.error || "Kod yanlış");
      return;
    }
    setMsg("2FA aktif edildi!");
    setEnrollQr(null);
    setEnrollSecret(null);
    setConfirmToken("");
    loadStatus();
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: disableToken }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(d.error || "Kapatılamadı");
      return;
    }
    setMsg("2FA kapatıldı");
    setDisableToken("");
    loadStatus();
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
          <Shield size={22} /> Güvenlik
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Admin hesabın için iki aşamalı doğrulama (TOTP).
        </p>
      </div>

      {msg && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2 rounded">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-xl">
        {status === null ? (
          <p className="text-slate-400">Yükleniyor...</p>
        ) : status.totpEnabled ? (
          <div>
            <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
              <ShieldCheck size={18} /> 2FA Aktif
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Her admin girişinde authenticator uygulaman kodu sorar. Kapatmak için
              mevcut 6 haneli kodu gir.
            </p>
            <form onSubmit={disable} className="flex gap-2">
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={8}
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                placeholder="000000"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                required
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Kapat
              </button>
            </form>
          </div>
        ) : enrollQr && enrollSecret ? (
          <div>
            <p className="text-sm text-slate-700 mb-3">
              1) Authenticator uygulamanda QR&apos;ı tara veya secret&apos;i elle gir.
              <br />
              2) Üretilen 6 haneli kodu gir.
            </p>
            <div className="flex gap-4 items-start mb-4">
              <Image
                src={enrollQr}
                alt="2FA QR kod"
                width={180}
                height={180}
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Manuel secret:</p>
                <code className="block text-xs bg-slate-100 p-2 rounded font-mono break-all">
                  {enrollSecret}
                </code>
              </div>
            </div>
            <form onSubmit={confirmEnroll} className="flex gap-2">
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={8}
                value={confirmToken}
                onChange={(e) => setConfirmToken(e.target.value)}
                placeholder="000000"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                required
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Onayla
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-600 mb-4">
              2FA kapalı. Aktifleştirerek admin panele yetkisiz erişimi zorlaştırın.
              Google Authenticator, 1Password veya Authy ile kullanabilirsiniz.
            </p>
            <button
              onClick={startEnroll}
              disabled={busy}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              2FA&apos;yı Aktifleştir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

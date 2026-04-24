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
        <h2 className="display-md text-[#1d1d1f] inline-flex items-center gap-2">
          <Shield size={22} /> Güvenlik
        </h2>
        <p className="text-[13px] text-[#6e6e73] tracking-tight mt-1">
          Admin hesabın için iki aşamalı doğrulama (TOTP).
        </p>
      </div>

      {msg && (
        <div className="mb-4 bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 text-[#ff9f0a] rounded-2xl px-4 py-3 text-[13px] tracking-tight">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6 max-w-xl">
        {status === null ? (
          <p className="text-[#86868b] text-[13px]">Yükleniyor...</p>
        ) : status.totpEnabled ? (
          <div>
            <div className="flex items-center gap-2 text-[#1d7a3a] font-medium mb-3 tracking-tight">
              <ShieldCheck size={18} /> 2FA Aktif
            </div>
            <p className="text-[13px] text-[#6e6e73] tracking-tight mb-4">
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
                className="flex-1 h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition font-mono"
                required
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-[#ff453a] text-white px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:opacity-90 transition disabled:opacity-50"
              >
                Kapat
              </button>
            </form>
          </div>
        ) : enrollQr && enrollSecret ? (
          <div>
            <p className="text-[13px] text-[#1d1d1f] tracking-tight mb-3">
              1) Authenticator uygulamanda QR&apos;ı tara veya secret&apos;i elle gir.
              <br />
              2) Üretilen 6 haneli kodu gir.
            </p>
            <div className="flex gap-4 items-start mb-4">
              {/* Fixed-size container — QR data-URL yüklenirken layout shift olmasın */}
              <div
                className="w-[180px] h-[180px] flex-shrink-0 bg-[#f5f5f7] rounded-xl overflow-hidden"
                aria-hidden={!enrollQr}
              >
                <Image
                  src={enrollQr}
                  alt="2FA QR kod"
                  width={180}
                  height={180}
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#6e6e73] mb-1 tracking-tight">Manuel secret:</p>
                <code className="block text-[11px] bg-[#f5f5f7] text-[#1d1d1f] p-2 rounded-xl font-mono break-all">
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
                className="flex-1 h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition font-mono"
                required
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-[#1d1d1f] text-white px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50"
              >
                Onayla
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-[13px] text-[#6e6e73] tracking-tight mb-4">
              2FA kapalı. Aktifleştirerek admin panele yetkisiz erişimi zorlaştırın.
              Google Authenticator, 1Password veya Authy ile kullanabilirsiniz.
            </p>
            <button
              onClick={startEnroll}
              disabled={busy}
              className="bg-[#1d1d1f] text-white px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50"
            >
              2FA&apos;yı Aktifleştir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, LogOut } from "lucide-react";

interface Props {
  targetEmail: string;
  adminEmail: string;
}

export function ImpersonationBanner({ targetEmail, adminEmail }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function stop() {
    setBusy(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      router.push("/admin/tenants");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="alert"
      className="sticky top-0 z-40 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield size={16} />
        <span>
          <strong>{adminEmail}</strong> olarak <strong>{targetEmail}</strong> hesabını
          görüntülüyorsunuz. Yaptığınız işlemler bu hesap adına kaydedilir.
        </span>
      </div>
      <button
        onClick={stop}
        disabled={busy}
        className="inline-flex items-center gap-1.5 bg-amber-900 text-amber-50 px-3 py-1 rounded text-xs font-semibold hover:bg-amber-950 disabled:opacity-50"
      >
        <LogOut size={12} />
        {busy ? "Çıkılıyor..." : "Çıkış"}
      </button>
    </div>
  );
}

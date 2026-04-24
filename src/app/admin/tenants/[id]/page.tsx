"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Shield,
  ShieldOff,
  CreditCard,
  Mail,
  Calendar,
  Activity,
  UserCheck,
  Clock,
  KeyRound,
  Trash2,
  Copy,
} from "lucide-react";

interface TenantDetail {
  user: {
    id: string;
    email: string;
    name: string;
    businessName: string | null;
    businessType: string | null;
    phone: string | null;
    timezone: string;
    plan: string;
    role: string;
    isSuperAdmin: boolean;
    suspended: boolean;
    suspendedAt: string | null;
    suspendReason: string | null;
    aiEnabled: boolean;
    aiModel: string;
    aiDailyTokenLimit: number;
    lastSeenAt: string | null;
    trialEndsAt: string | null;
    createdAt: string;
    _count: {
      contacts: number;
      messages: number;
      broadcasts: number;
      flows: number;
      templates: number;
      segments: number;
      apiKeys: number;
    };
  };
  recentMessages: Array<{
    id: string;
    direction: string;
    status: string;
    phone: string;
    content: string;
    createdAt: string;
  }>;
  recentBroadcasts: Array<{
    id: string;
    name: string;
    status: string;
    sentCount: number;
    failedCount: number;
    createdAt: string;
  }>;
  ai: { tokens30d: number; costUsd30d: number };
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [data, setData] = useState<TenantDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/admin/tenants/${id}`);
    if (res.ok) setData(await res.json());
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/tenants/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, [id]);

  async function toggleSuspend() {
    if (!data) return;
    const isSuspending = !data.user.suspended;

    const confirmMsg = isSuspending
      ? `${data.user.email} hesabı askıya alınacak. Kullanıcı giriş yapamayacak. Emin misiniz?`
      : `${data.user.email} hesabının askısı kaldırılacak. Tekrar erişim sağlayacak. Emin misiniz?`;
    if (!window.confirm(confirmMsg)) return;

    const reason = isSuspending
      ? prompt("Askıya alma sebebi (isteğe bağlı, audit log'a yazılacak):") || undefined
      : null;
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend: !data.user.suspended, reason }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    setMsg(data.user.suspended ? "Askı kaldırıldı" : "Askıya alındı");
    load();
  }

  async function togglePromote() {
    if (!data) return;
    if (
      !confirm(
        data.user.isSuperAdmin
          ? "Süper admin yetkisini kaldırmak istediğinizden emin misiniz?"
          : "Bu kullanıcıya süper admin yetkisi vermek istediğinizden emin misiniz?",
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${id}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSuperAdmin: !data.user.isSuperAdmin }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    setMsg("Yetki güncellendi");
    load();
  }

  async function changePlan(plan: string) {
    if (!data) return;
    if (plan === data.user.plan) return;
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${id}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    setMsg(`Plan ${plan} olarak güncellendi`);
    load();
  }

  async function extendTrial(days: number) {
    if (!data) return;
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${id}/extend-trial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    const result = await res.json();
    setMsg(
      `Trial ${days} gün uzatıldı (yeni bitiş: ${new Date(result.trialEndsAt).toLocaleDateString("tr-TR")})`,
    );
    load();
  }

  async function generatePasswordReset() {
    if (!data) return;
    if (
      !window.confirm(
        `${data.user.email} için şifre sıfırlama URL'i oluştur? Kullanıcının mevcut şifresi çalışmaya devam eder.`,
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${id}/reset-password`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    const result = await res.json();
    try {
      await navigator.clipboard.writeText(result.resetUrl);
    } catch {
      // clipboard erişimi yok, sadece göster
    }
    setResetUrl(result.resetUrl);
    setMsg("Sıfırlama URL'i panoya kopyalandı. Kullanıcıya güvenli kanaldan ilet (24 saat geçerli).");
  }

  async function clearFailed() {
    if (!data) return;
    if (
      !window.confirm(
        "Bu kullanıcının tüm başarısız mesajları silinecek. Devam?",
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${id}/clear-failed`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    const result = await res.json();
    setMsg(`${result.deleted} başarısız mesaj silindi`);
    load();
  }

  async function impersonate() {
    if (!data) return;
    if (
      !window.confirm(
        `${data.user.email} hesabına geçici olarak impersonate olacaksınız. İşlemleriniz bu hesap adına kaydedilir. Devam?`,
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/impersonate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    router.push("/dashboard");
  }

  if (!data)
    return <div className="text-[#86868b] text-[13px]">Yükleniyor...</div>;

  const u = data.user;

  return (
    <div>
      <button
        onClick={() => router.push("/admin/tenants")}
        className="inline-flex items-center gap-2 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] mb-4 tracking-tight"
      >
        <ArrowLeft size={16} /> Kiracılara dön
      </button>

      {msg && (
        <div className="mb-4 bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 text-[#ff9f0a] rounded-2xl px-4 py-3 text-[13px] tracking-tight">
          {msg}
        </div>
      )}

      {resetUrl && (
        <div className="mb-4 bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-2xl px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#0071e3] mb-1 tracking-tight">
                Şifre Sıfırlama URL&apos;i (24 saat)
              </p>
              <p className="text-[11px] text-[#0071e3] break-all font-mono">{resetUrl}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetUrl);
                  setMsg("URL kopyalandı");
                }}
                className="bg-[#1d1d1f] text-white px-3 h-8 rounded-full text-[12px] font-medium tracking-tight hover:bg-black transition inline-flex items-center gap-1"
              >
                <Copy size={12} /> Kopyala
              </button>
              <button
                onClick={() => setResetUrl(null)}
                className="text-[12px] px-3 h-8 text-[#0071e3] hover:bg-[#0071e3]/10 rounded-full transition"
              >
                Gizle
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="display-md text-[#1d1d1f]">
                {u.businessName || u.name}
              </h2>
              {u.isSuperAdmin && (
                <span className="text-[11px] bg-[#0071e3]/10 text-[#0071e3] px-2 py-0.5 rounded-full font-medium tracking-tight inline-flex items-center gap-1">
                  <Shield size={10} /> SUPER ADMIN
                </span>
              )}
              {u.suspended && (
                <span className="text-[11px] bg-[#ff453a]/10 text-[#ff453a] px-2 py-0.5 rounded-full font-medium tracking-tight inline-flex items-center gap-1">
                  <Ban size={10} /> ASKIDA
                </span>
              )}
            </div>
            <div className="text-[13px] text-[#6e6e73] tracking-tight flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Mail size={12} /> {u.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} /> {new Date(u.createdAt).toLocaleDateString("tr-TR")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Activity size={12} />
                {u.lastSeenAt
                  ? `Son: ${new Date(u.lastSeenAt).toLocaleDateString("tr-TR")}`
                  : "Hiç girmemiş"}
              </span>
            </div>
            {u.suspendReason && (
              <p className="text-[13px] text-[#ff453a] mt-2 tracking-tight">
                Askı sebebi: {u.suspendReason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSuspend}
              disabled={busy}
              className={
                "px-4 h-10 rounded-full text-[13px] font-medium tracking-tight inline-flex items-center gap-2 disabled:opacity-50 transition " +
                (u.suspended
                  ? "bg-[#1d1d1f] text-white hover:bg-black"
                  : "bg-[#ff453a] text-white hover:opacity-90")
              }
            >
              {u.suspended ? (
                <>
                  <CheckCircle2 size={14} /> Askıyı Kaldır
                </>
              ) : (
                <>
                  <Ban size={14} /> Askıya Al
                </>
              )}
            </button>
            <button
              onClick={togglePromote}
              disabled={busy}
              className="px-4 h-10 rounded-full text-[13px] font-medium tracking-tight border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] inline-flex items-center gap-2 disabled:opacity-50 transition"
            >
              {u.isSuperAdmin ? (
                <>
                  <ShieldOff size={14} /> Admin Kaldır
                </>
              ) : (
                <>
                  <Shield size={14} /> Admin Yap
                </>
              )}
            </button>
            {!u.isSuperAdmin && !u.suspended && (
              <button
                onClick={impersonate}
                disabled={busy}
                className="px-4 h-10 rounded-full text-[13px] font-medium tracking-tight bg-[#1d1d1f] text-white hover:bg-black inline-flex items-center gap-2 disabled:opacity-50 transition"
                title="Bu hesap adına geçici olarak panel kullan"
              >
                <UserCheck size={14} /> Impersonate
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#f5f5f7]">
          <Stat label="Kişi" value={u._count.contacts} />
          <Stat label="Mesaj" value={u._count.messages} />
          <Stat label="Broadcast" value={u._count.broadcasts} />
          <Stat label="Akış" value={u._count.flows} />
          <Stat label="Şablon" value={u._count.templates} />
          <Stat label="Segment" value={u._count.segments} />
          <Stat label="API Key" value={u._count.apiKeys} />
          <Stat label="AI Token (30g)" value={data.ai.tokens30d} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3 inline-flex items-center gap-2">
            <CreditCard size={16} /> Plan
          </h3>
          <div className="flex gap-2">
            {(["STARTER", "PRO", "BUSINESS"] as const).map((p) => (
              <button
                key={p}
                disabled={busy}
                onClick={() => changePlan(p)}
                className={
                  "px-4 h-10 rounded-full text-[13px] font-medium tracking-tight flex-1 disabled:opacity-50 transition " +
                  (u.plan === p
                    ? "bg-[#1d1d1f] text-white hover:bg-black"
                    : "border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7]")
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">Profil</h3>
          <dl className="text-[13px] space-y-1">
            <Row k="İşletme" v={u.businessName || "—"} />
            <Row k="Tür" v={u.businessType || "—"} />
            <Row k="Telefon" v={u.phone || "—"} />
            <Row k="Saat Dilimi" v={u.timezone} />
            <Row k="AI" v={u.aiEnabled ? `Aktif (${u.aiModel})` : "Kapalı"} />
            <Row
              k="Trial bitiş"
              v={u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString("tr-TR") : "—"}
            />
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5 mb-6">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3 inline-flex items-center gap-2">
          <Activity size={16} /> Admin İşlemleri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border border-[#d2d2d7] rounded-xl p-3">
            <h4 className="text-[13px] font-medium text-[#1d1d1f] mb-2 inline-flex items-center gap-1.5 tracking-tight">
              <Clock size={14} /> Trial Süresini Uzat
            </h4>
            <p className="text-[11px] text-[#6e6e73] mb-2 tracking-tight">
              Kullanıcıya ek deneme günü tanı.
            </p>
            <div className="flex gap-1.5">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => extendTrial(d)}
                  disabled={busy}
                  className="flex-1 text-[12px] px-2 h-8 border border-[#d2d2d7] text-[#1d1d1f] rounded-full hover:bg-[#f5f5f7] disabled:opacity-50 transition font-medium tracking-tight"
                >
                  +{d}g
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[#d2d2d7] rounded-xl p-3">
            <h4 className="text-[13px] font-medium text-[#1d1d1f] mb-2 inline-flex items-center gap-1.5 tracking-tight">
              <KeyRound size={14} /> Şifre Sıfırla
            </h4>
            <p className="text-[11px] text-[#6e6e73] mb-2 tracking-tight">
              24 saat geçerli URL. Kullanıcıya elle ilet.
            </p>
            <button
              onClick={generatePasswordReset}
              disabled={busy || u.isSuperAdmin}
              className="w-full text-[12px] px-2 h-8 bg-[#1d1d1f] text-white rounded-full hover:bg-black disabled:opacity-50 transition font-medium tracking-tight"
            >
              URL Oluştur
            </button>
          </div>

          <div className="border border-[#d2d2d7] rounded-xl p-3">
            <h4 className="text-[13px] font-medium text-[#1d1d1f] mb-2 inline-flex items-center gap-1.5 tracking-tight">
              <Trash2 size={14} /> Kuyruğu Temizle
            </h4>
            <p className="text-[11px] text-[#6e6e73] mb-2 tracking-tight">
              Failed mesajları sil. Retry engelini kaldırır.
            </p>
            <button
              onClick={clearFailed}
              disabled={busy}
              className="w-full text-[12px] px-2 h-8 border border-[#d2d2d7] text-[#1d1d1f] rounded-full hover:bg-[#f5f5f7] disabled:opacity-50 transition font-medium tracking-tight"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">Son 10 Mesaj</h3>
          {data.recentMessages.length === 0 ? (
            <p className="text-[13px] text-[#86868b]">Henüz mesaj yok</p>
          ) : (
            <ul className="divide-y divide-[#f5f5f7]">
              {data.recentMessages.map((m) => (
                <li key={m.id} className="py-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "text-[11px] px-1.5 py-0.5 rounded-full font-medium tracking-tight " +
                        (m.direction === "incoming"
                          ? "bg-[#0071e3]/10 text-[#0071e3]"
                          : "bg-[#30d158]/10 text-[#1d7a3a]")
                      }
                    >
                      {m.direction === "incoming" ? "IN" : "OUT"}
                    </span>
                    <span className="text-[11px] text-[#6e6e73]">{m.phone}</span>
                    <span className="text-[11px] text-[#86868b] ml-auto">
                      {new Date(m.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-[#1d1d1f] mt-1 truncate">{m.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">Son Broadcast&apos;ler</h3>
          {data.recentBroadcasts.length === 0 ? (
            <p className="text-[13px] text-[#86868b]">Henüz broadcast yok</p>
          ) : (
            <ul className="divide-y divide-[#f5f5f7]">
              {data.recentBroadcasts.map((b) => (
                <li key={b.id} className="py-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1d1d1f]">{b.name}</span>
                    <span className="text-[11px] bg-[#f5f5f7] text-[#6e6e73] px-2 py-0.5 rounded-full font-medium tracking-tight">
                      {b.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6e6e73] mt-1">
                    {b.sentCount} gönderildi, {b.failedCount} başarısız •{" "}
                    {new Date(b.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[11px] text-[#6e6e73] tracking-tight">{label}</div>
      <div className="text-[18px] font-semibold text-[#1d1d1f] tracking-tight">{typeof value === "number" ? value.toLocaleString("tr-TR") : value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[#6e6e73]">{k}</dt>
      <dd className="text-[#1d1d1f] text-right truncate">{v}</dd>
    </div>
  );
}

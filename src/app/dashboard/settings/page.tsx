"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { WhatsAppSetupGuide } from "@/components/whatsapp-setup-guide";
import { MetaEmbeddedSignupButton } from "@/components/meta-embedded-signup-button";

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [businessHoursStart, setBusinessHoursStart] = useState("");
  const [businessHoursEnd, setBusinessHoursEnd] = useState("");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [offHoursReply, setOffHoursReply] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiModel, setAiModel] = useState("claude-haiku-4-5");
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");
  const [aiDailyTokenLimit, setAiDailyTokenLimit] = useState(100000);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data) return;
        setBusinessName(data.businessName || "");
        setBusinessType(data.businessType || "");
        setPhone(data.phone || "");
        setTimezone(data.timezone || "Europe/Istanbul");
        setBusinessHoursStart(data.businessHoursStart || "");
        setBusinessHoursEnd(data.businessHoursEnd || "");
        setOffHoursReply(data.offHoursReply || "");
        setAiEnabled(!!data.aiEnabled);
        if (data.aiModel) setAiModel(data.aiModel);
        setAiSystemPrompt(data.aiSystemPrompt || "");
        if (typeof data.aiDailyTokenLimit === "number")
          setAiDailyTokenLimit(data.aiDailyTokenLimit);
        if (data.workDays) {
          const parsed = String(data.workDays)
            .split(",")
            .map((s: string) => Number(s.trim()))
            .filter((n: number) => !Number.isNaN(n));
          if (parsed.length) setWorkDays(parsed);
        }
      });
  }, []);

  function toggleDay(d: number) {
    setWorkDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    );
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        businessType,
        phone,
        timezone,
        businessHoursStart: businessHoursStart || null,
        businessHoursEnd: businessHoursEnd || null,
        workDays: workDays.length ? workDays.join(",") : null,
        offHoursReply: offHoursReply || null,
        aiEnabled,
        aiModel,
        aiSystemPrompt: aiSystemPrompt || null,
        aiDailyTokenLimit: Number(aiDailyTokenLimit) || 100000,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Kaydedilemedi");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ayarlar</h2>
        <p className="text-gray-500 text-sm mt-1">WhatsApp API ve hesap ayarları</p>
      </div>

      <div className="space-y-6">
        <WhatsAppSetupGuide />

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Meta ile Hızlı Bağla</h3>
              <p className="text-[13px] text-gray-500 mt-1 mb-4">
                Tek tıkla Meta Business hesabınla WhatsApp&apos;ını WaSend&apos;e bağla.
                Manuel token yapıştırmaya gerek yok — token, WABA ID ve webhook abone işlemi
                otomatik yapılır.
              </p>
              <MetaEmbeddedSignupButton label="Meta ile Bağlan" />
              <p className="text-[11px] text-gray-400 mt-3">
                Buton görünmüyorsa yöneticiniz Meta Embedded Signup yapılandırmasını
                henüz tamamlamamış demektir. Aşağıdaki manuel akışı kullanabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">WhatsApp Business API Bağlantısı</h3>
          <div className="bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 rounded-2xl px-4 py-3 mb-4">
            <p className="text-[13px] text-[#ff9f0a] tracking-tight">
              WhatsApp API bağlantısı için aşağıdaki adımları takip edin.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="font-medium text-gray-900">Meta Business Hesabı Oluşturun</p>
                <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline inline-flex items-center gap-1">
                  business.facebook.com <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <div>
                <p className="font-medium text-gray-900">WhatsApp Business API&apos;ye başvurun</p>
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline inline-flex items-center gap-1">
                  Cloud API Başlangıç Rehberi <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <div>
                <p className="font-medium text-gray-900">Phone Number ID&apos;nizi aşağıya girin</p>
                <p className="text-gray-400">Meta Developer panelinden alabilirsiniz</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Hesap ve API Bilgileri</h3>

          {saved && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">
              Ayarlar kaydedildi!
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="İşletme adınız"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Türü</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seçin...</option>
                <option value="kuafor">Kuaför / Güzellik Salonu</option>
                <option value="restoran">Restoran / Kafe</option>
                <option value="klinik">Klinik / Sağlık</option>
                <option value="esnaf">Esnaf / Dükkan</option>
                <option value="diger">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Phone Number ID</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Meta Developer panelinden alın"
              />
              <p className="text-xs text-gray-400 mt-1">
                Bu ID, WhatsApp Cloud API üzerinden mesaj gönderimi için gereklidir
              </p>
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Kaydet
            </button>
          </div>
        </form>

        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Saat Dilimi ve İş Saatleri</h3>
          <p className="text-sm text-gray-500 mb-4">
            Hatırlatmalar bu saat dilimine göre zamanlanır. İş saati dışı otomatik cevap
            mesajı, keyword eşleşmesi olmadığında gönderilir.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saat Dilimi</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Europe/Istanbul"
              />
              <p className="text-xs text-gray-400 mt-1">
                IANA formatı (örn. Europe/Istanbul, Europe/Berlin)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açılış Saati</label>
                <input
                  type="time"
                  value={businessHoursStart}
                  onChange={(e) => setBusinessHoursStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapanış Saati</label>
                <input
                  type="time"
                  value={businessHoursEnd}
                  onChange={(e) => setBusinessHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Çalışma Günleri</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, idx) => {
                  const active = workDays.includes(idx);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      className={
                        "px-3 py-1.5 rounded-lg text-sm border transition " +
                        (active
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İş Saati Dışı Otomatik Cevap (opsiyonel)
              </label>
              <textarea
                value={offHoursReply}
                onChange={(e) => setOffHoursReply(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Şu an kapalıyız. 09:00-18:00 saatleri arasında size dönüş yapacağız."
              />
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Kaydet
            </button>
          </div>
        </form>

        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">AI Otomatik Cevap (Opsiyonel)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Keyword eşleşmesi bulunmadığında Claude AI ile otomatik cevap üretilir.
            Anahtar için <code className="bg-gray-100 px-1 rounded">ANTHROPIC_API_KEY</code> env değişkeni zorunludur.
          </p>

          <div className="space-y-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">AI fallback&apos;i aktif et</span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="claude-haiku-4-5">Claude Haiku 4.5 (hızlı & ucuz)</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (daha yetenekli)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Günlük Token Limiti
                </label>
                <input
                  type="number"
                  min={1000}
                  max={10000000}
                  value={aiDailyTokenLimit}
                  onChange={(e) => setAiDailyTokenLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sistem Prompt (opsiyonel)
              </label>
              <textarea
                value={aiSystemPrompt}
                onChange={(e) => setAiSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Boş bırakılırsa varsayılan Türkçe müşteri hizmetleri prompt'u kullanılır."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                AI belirsiz bir soruya çarparsa <code className="bg-gray-100 px-1 rounded">#handoff</code>{" "}
                yazarak kişiye otomatik olarak <code className="bg-gray-100 px-1 rounded">needs-human</code>{" "}
                etiketi eklenir.
              </p>
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Kaydet
            </button>
          </div>
        </form>

        <WhatsAppCredentialsCard />

        <WebhookUrlCard />
      </div>
    </div>
  );
}

function WhatsAppCredentialsCard() {
  const [state, setState] = useState<{
    waApiTokenSet: boolean;
    waAppSecretSet: boolean;
    waWabaId: string;
    waVerifyToken: string;
  } | null>(null);
  const [apiToken, setApiToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    fetch("/api/settings/whatsapp")
      .then((r) => r.json())
      .then((d) => {
        setState({
          waApiTokenSet: !!d.waApiTokenSet,
          waAppSecretSet: !!d.waAppSecretSet,
          waWabaId: d.waWabaId || "",
          waVerifyToken: d.waVerifyToken || "",
        });
        setWabaId(d.waWabaId || "");
        setVerifyToken(d.waVerifyToken || "");
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setSaved(false);
    const body: Record<string, string | null> = {};
    if (apiToken) body.waApiToken = apiToken;
    if (appSecret) body.waAppSecret = appSecret;
    if (wabaId !== state?.waWabaId) body.waWabaId = wabaId;
    if (verifyToken !== state?.waVerifyToken) body.waVerifyToken = verifyToken;
    const res = await fetch("/api/settings/whatsapp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Kaydedilemedi");
      return;
    }
    setApiToken("");
    setAppSecret("");
    setSaved(true);
    // refresh mask state
    const refreshed = await fetch("/api/settings/whatsapp").then((r) => r.json());
    setState({
      waApiTokenSet: !!refreshed.waApiTokenSet,
      waAppSecretSet: !!refreshed.waAppSecretSet,
      waWabaId: refreshed.waWabaId || "",
      waVerifyToken: refreshed.waVerifyToken || "",
    });
    setTimeout(() => setSaved(false), 3000);
  }

  if (!state) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">
          Kendi WhatsApp Hesabın (BYO)
        </h3>
        <p className="text-[13px] text-gray-500 mt-1">
          Kendi Meta App&apos;ini bağlamak istersen API token, App Secret ve
          WABA ID&apos;ni buraya gir. Boş bırakırsan WaSend&apos;in ortak
          hesabı kullanılır.
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">
          Kaydedildi
        </div>
      )}
      {err && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {err}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Token
            {state.waApiTokenSet && (
              <span className="ml-2 text-[11px] text-green-600">✓ Kaydedildi</span>
            )}
          </label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            autoComplete="new-password"
            placeholder={
              state.waApiTokenSet
                ? "Yeni değer girmezsen mevcut token korunur"
                : "EAABw... (Meta Permanent Token)"
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-mono text-[13px]"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Meta for Developers → App → WhatsApp → API Setup → Permanent Token
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WABA ID (WhatsApp Business Account ID)
          </label>
          <input
            type="text"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="Örn. 123456789012345"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-mono text-[13px]"
          />
        </div>

        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-[12px] text-gray-500 hover:text-gray-800 underline underline-offset-2"
        >
          {advanced ? "Gelişmiş ayarları gizle" : "Gelişmiş ayarlar (App Secret, Verify Token)"}
        </button>

        {advanced && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Secret
                {state.waAppSecretSet && (
                  <span className="ml-2 text-[11px] text-green-600">✓ Kaydedildi</span>
                )}
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                autoComplete="new-password"
                placeholder={
                  state.waAppSecretSet ? "••••••••" : "Meta App → Basic Settings"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-mono text-[13px]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Gelen webhook imzalarını doğrulamak için kullanılır.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verify Token
              </label>
              <input
                type="text"
                value={verifyToken}
                onChange={(e) =>
                  setVerifyToken(e.target.value.replace(/[^A-Za-z0-9_\-]/g, ""))
                }
                placeholder="kendi belirlediğin rastgele string"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-mono text-[13px]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Meta Developer panelinde webhook subscribe ederken bu değeri
                girersin. Harf/rakam/_/-
              </p>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={busy}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {busy ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

function WebhookUrlCard() {
  const [url, setUrl] = useState<string>("https://wasend.tech/api/webhook");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window !== "undefined") {
        setUrl(`${window.location.origin}/api/webhook`);
      }
    });
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Webhook URL</h3>
      <p className="text-sm text-gray-500 mb-3">
        Meta Developer panelinde webhook URL olarak aşağıdaki adresi girin:
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm text-gray-700 break-all">
          {url}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Webhook URL'ini kopyala"
          className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800"
        >
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Güvenlik için{" "}
        <code className="bg-gray-100 px-1 rounded">WHATSAPP_APP_SECRET</code> ve{" "}
        <code className="bg-gray-100 px-1 rounded">WHATSAPP_VERIFY_TOKEN</code>{" "}
        env değişkenlerini ayarlayın.
      </p>
    </div>
  );
}

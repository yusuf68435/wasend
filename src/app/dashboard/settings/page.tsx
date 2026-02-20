"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setBusinessName(data.businessName || "");
        setBusinessType(data.businessType || "");
        setPhone(data.phone || "");
      });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, businessType, phone }),
    });
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">WhatsApp Business API Bağlantısı</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
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

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Webhook URL</h3>
          <p className="text-sm text-gray-500 mb-3">
            Meta Developer panelinde webhook URL olarak aşağıdaki adresi girin:
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm text-gray-700 break-all">
            https://SITENIZ.vercel.app/api/webhook
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Deploy ettikten sonra &quot;SITENIZ&quot; kısmı gerçek domain ile değişecek
          </p>
        </div>
      </div>
    </div>
  );
}

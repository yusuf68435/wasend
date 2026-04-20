"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2, ShieldAlert } from "lucide-react";

export default function AccountPage() {
  const [deletePassword, setDeletePassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirm !== "HESABIMI SIL") {
      setError("Onay metni doğru değil");
      return;
    }
    if (
      !window.confirm(
        "Hesabınız silinecek ve 30 gün sonra kalıcı olarak yok edilecek. Devam?",
      )
    )
      return;

    setDeleting(true);
    setError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword, confirm }),
    });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Hesap silinemedi");
      return;
    }
    setInfo("Hesap silindi. Çıkış yapılıyor...");
    setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Hesap Yönetimi</h2>
        <p className="text-gray-500 text-sm mt-1">
          KVKK / GDPR: Verilerinizi dışa aktarın veya hesabınızı kalıcı olarak silin.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          {info}
        </div>
      )}

      {/* Data export */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Download size={18} /> Verilerinizi indirin
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Tüm kişileriniz, mesajlarınız, şablonlarınız ve diğer verileriniz tek
          bir JSON dosyasında indirilir. KVKK Madde 11 / GDPR Article 20
          uyarınca sağlanan veri taşınabilirliği hakkıdır.
        </p>
        <a
          href="/api/account/export"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Download size={16} /> JSON olarak indir
        </a>
      </div>

      {/* Delete account */}
      <div className="bg-white border-2 border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
          <ShieldAlert size={18} /> Hesabımı sil
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Hesabınızı sildiğinizde hemen oturumunuz kapatılır ve 30 gün içinde
          tüm verileriniz kalıcı olarak silinir. Bu süre içinde destek ile
          iletişime geçerek geri alabilirsiniz. 30 gün sonra geri alınamaz.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mevcut şifreniz
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onay: <code className="bg-gray-100 px-1 rounded text-xs">HESABIMI SIL</code> yazın
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="HESABIMI SIL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              autoComplete="off"
            />
          </div>
          <button
            onClick={deleteAccount}
            disabled={deleting || confirm !== "HESABIMI SIL" || !deletePassword}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} /> {deleting ? "Siliniyor..." : "Hesabımı kalıcı olarak sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

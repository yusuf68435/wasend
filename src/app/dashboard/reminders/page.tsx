"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface Reminder {
  id: string;
  message: string;
  scheduledAt: string;
  status: string;
  contact: Contact;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reminders").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
    ]).then(([rem, con]) => {
      setReminders(rem);
      setContacts(con);
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: fd.get("message"),
        scheduledAt: fd.get("scheduledAt"),
        contactId: fd.get("contactId"),
      }),
    });
    if (res.ok) {
      // Refetch to get contact data included
      const updated = await fetch("/api/reminders").then((r) => r.json());
      setReminders(updated);
      setShowForm(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Bekliyor", color: "bg-yellow-50 text-yellow-700" },
    sent: { label: "Gönderildi", color: "bg-green-50 text-green-700" },
    failed: { label: "Başarısız", color: "bg-red-50 text-red-600" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hatırlatmalar</h2>
          <p className="text-gray-500 text-sm mt-1">Randevu ve hatırlatma mesajları</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
        >
          <Plus size={18} /> Hatırlatma Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kişi</label>
              {contacts.length === 0 ? (
                <p className="text-sm text-gray-400">Önce kişi eklemelisin</p>
              ) : (
                <select name="contactId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Kişi seç...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
              <textarea name="message" required rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Örn: Yarınki randevunuzu hatırlatmak isteriz" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gönderim Zamanı</label>
              <input name="scheduledAt" type="datetime-local" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition">Kaydet</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">İptal</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Yükleniyor...</p>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Clock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Henüz hatırlatma yok</p>
          <p className="text-gray-400 text-sm mt-1">Müşterilerinize randevu hatırlatmaları gönderin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => {
            const st = statusLabels[r.status] || statusLabels.pending;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">{r.contact.name}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{r.message}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.scheduledAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

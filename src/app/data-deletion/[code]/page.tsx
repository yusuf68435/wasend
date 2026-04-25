/**
 * Public data deletion request status page — /data-deletion/[code]
 *
 * Meta App Review için /api/meta/data-deletion endpoint'i
 * confirmation_code döndürür ve kullanıcıyı buraya yönlendirir.
 * Bu sayfa kullanıcıya silme talebinin durumunu gösterir.
 *
 * Auth gerektirmez (Meta tarafından zaten signed_request ile doğrulanmış).
 * Yine de sadece confirmation_code'u olan biri görebilir → kazara
 * yetkisiz erişim olabilir ama hassas veri sızdırmıyoruz.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { tr: string; color: string }> = {
  pending: { tr: "Beklemede", color: "bg-[#ff9f0a]/10 text-[#ff9f0a]" },
  processing: { tr: "İşleniyor", color: "bg-[#0071e3]/10 text-[#0071e3]" },
  completed: { tr: "Tamamlandı", color: "bg-[#30d158]/10 text-[#1d7a3a]" },
  errored: { tr: "Hata", color: "bg-[#ff453a]/10 text-[#ff453a]" },
};

export default async function DataDeletionStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  // Basic format check — id'ler cuid (yaklaşık 25 char alphanumeric)
  if (!/^[a-z0-9]{20,40}$/i.test(code)) notFound();

  const req = await prisma.metaDataDeletionRequest.findUnique({
    where: { id: code },
    select: {
      id: true,
      status: true,
      receivedAt: true,
      completedAt: true,
    },
  });

  if (!req) notFound();

  const label = STATUS_LABELS[req.status] || STATUS_LABELS.pending;

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] tracking-tight"
        >
          ← Ana sayfa
        </Link>
        <h1 className="text-[32px] font-semibold tracking-tight mt-6 mb-3">
          Veri Silme Talebi
        </h1>
        <p className="text-[15px] text-[#6e6e73] tracking-tight mb-8 leading-relaxed">
          Meta tarafından iletilen veri silme talebinizin durumu aşağıdadır.
          Talebiniz 30 gün içinde tamamlanır ve KVKK / GDPR uyumludur.
        </p>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-[#6e6e73] tracking-[0.08em] uppercase">
                Onay Kodu
              </p>
              <p className="font-mono text-[14px] text-[#1d1d1f] mt-1 break-all">
                {req.id}
              </p>
            </div>
            <span
              className={`text-[12px] px-3 py-1 rounded-full font-medium tracking-tight ${label.color}`}
            >
              {label.tr}
            </span>
          </div>

          <div className="flex justify-between text-[13px] pt-3 border-t border-[#f5f5f7]">
            <span className="text-[#6e6e73]">Talep alındı</span>
            <span className="text-[#1d1d1f]">
              {req.receivedAt.toLocaleDateString("tr-TR")}{" "}
              {req.receivedAt.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {req.completedAt && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6e6e73]">Tamamlandı</span>
              <span className="text-[#1d1d1f]">
                {req.completedAt.toLocaleDateString("tr-TR")}{" "}
                {req.completedAt.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 bg-[#f5f5f7] rounded-2xl p-5">
          <h2 className="text-[14px] font-medium text-[#1d1d1f] mb-2 tracking-tight">
            Sorularınız mı var?
          </h2>
          <p className="text-[13px] text-[#6e6e73] tracking-tight leading-relaxed">
            Talebinizle ilgili sorularınız için onay kodunuzu belirterek{" "}
            <a
              href="mailto:privacy@wasend.tech"
              className="text-[#0071e3] hover:underline"
            >
              privacy@wasend.tech
            </a>{" "}
            adresine yazabilirsiniz. Detaylı bilgi için{" "}
            <Link href="/privacy" className="text-[#0071e3] hover:underline">
              Gizlilik Politikası
            </Link>{" "}
            sayfasına bakın.
          </p>
        </div>
      </div>
    </div>
  );
}

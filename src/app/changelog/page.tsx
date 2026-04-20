import Link from "next/link";
import { getAllEntries } from "@/lib/changelog";
import { renderMarkdown } from "@/lib/blog";

export const metadata = {
  title: "Değişiklik Günlüğü",
  description: "WaSend'e eklenen yeni özellikler ve düzeltmeler.",
};

const TAG_COLOR: Record<string, string> = {
  new: "bg-green-100 text-green-700",
  fix: "bg-amber-100 text-amber-700",
  security: "bg-red-100 text-red-700",
  improvement: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
};

export default function ChangelogPage() {
  const entries = getAllEntries();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-green-600">
            WaSend
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Ana Sayfa
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">
              Blog
            </Link>
            <Link href="/changelog" className="text-green-600 font-medium">
              Değişiklikler
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Değişiklik Günlüğü
        </h1>
        <p className="text-gray-500 mb-12">
          Yeni özellikler, iyileştirmeler ve düzeltmeler. En yeni en üstte.
        </p>

        {entries.length === 0 ? (
          <p className="text-gray-400">Henüz kayıt yok.</p>
        ) : (
          <div className="space-y-10">
            {entries.map((e) => (
              <article
                key={e.version}
                className="border-b border-gray-100 pb-10 last:border-0"
              >
                <div className="flex items-baseline gap-3 flex-wrap mb-1">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {e.version}
                  </span>
                  <time className="text-xs text-gray-400">
                    {new Date(e.date).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {e.tags?.map((t) => (
                    <span
                      key={t}
                      className={
                        "text-xs px-2 py-0.5 rounded " +
                        (TAG_COLOR[t] || "bg-gray-100 text-gray-700")
                      }
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{e.title}</h2>
                <div
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(e.content) }}
                />
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

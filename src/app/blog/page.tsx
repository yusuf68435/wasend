import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description:
    "WhatsApp Business, otomasyon, müşteri iletişimi ve KOBİ dijitalleşmesi üzerine yazılar.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

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
            <Link href="/blog" className="text-green-600 font-medium">
              Blog
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Giriş
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Blog</h1>
        <p className="text-gray-500 mb-12">
          WhatsApp Business, otomasyon ve KOBİ dijitalleşmesi üzerine rehberler.
        </p>

        {posts.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">Henüz yazı yok. Yakında burada!</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="border-b border-gray-100 pb-6 last:border-0"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 mb-1">
                    {post.frontmatter.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(post.frontmatter.date).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-gray-700">{post.frontmatter.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

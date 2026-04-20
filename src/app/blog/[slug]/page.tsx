import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllSlugs, getPostBySlug, renderMarkdown } from "@/lib/blog";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.content);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-green-600">
            WaSend
          </Link>
          <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">
            Blog
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} /> Tüm yazılar
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          {post.frontmatter.title}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {new Date(post.frontmatter.date).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {post.frontmatter.author && ` · ${post.frontmatter.author}`}
        </p>

        <article
          className="text-gray-800"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="bg-green-50 rounded-xl p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              WhatsApp otomasyonunu bugün deneyin
            </p>
            <p className="text-sm text-gray-600 mb-4">
              14 gün ücretsiz, kredi kartı gerekmez.
            </p>
            <Link
              href="/register"
              className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

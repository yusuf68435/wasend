import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * Basit dosya-tabanlı blog motoru. Yeni yazı eklemek için:
 *   content/blog/<slug>.md yarat, üstüne frontmatter koy
 *
 * Frontmatter örnek:
 *   ---
 *   title: "WhatsApp Business API nasıl kurulur"
 *   description: "Meta Developer panelinden adım adım kurulum."
 *   date: "2026-04-20"
 *   tags: ["whatsapp", "kurulum"]
 *   ---
 *
 * Build sırasında generateStaticParams otomatik tüm slug'ları çıkarır.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  author?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const safe = slug.replace(/[^a-z0-9-]/gi, "");
  if (!safe || safe !== slug) return null;
  const candidates = [
    path.join(BLOG_DIR, `${safe}.md`),
    path.join(BLOG_DIR, `${safe}.mdx`),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      const { data, content } = matter(raw);
      return {
        slug: safe,
        frontmatter: data as BlogFrontmatter,
        content,
      };
    }
  }
  return null;
}

export function getAllPosts(): BlogPost[] {
  return getAllSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => !!p)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    );
}

/**
 * Çok basit markdown → HTML renderer. Güvenlik için escape eder.
 * İleride remark/rehype'a geçilebilir; şu an dependency minimumda.
 */
export function renderMarkdown(md: string): string {
  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let inList = false;

  function closeList() {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(
          `<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`,
        );
        inCode = false;
        codeBuf = [];
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      closeList();
      const level = line.match(/^(#{1,6})/)![1].length;
      const text = escapeHtml(line.replace(/^#{1,6}\s/, ""));
      const cls =
        level === 1
          ? "text-3xl font-bold mt-6 mb-4"
          : level === 2
            ? "text-2xl font-bold mt-6 mb-3"
            : "text-xl font-semibold mt-4 mb-2";
      out.push(`<h${level} class="${cls}">${text}</h${level}>`);
      continue;
    }

    if (/^-\s/.test(line)) {
      if (!inList) {
        out.push('<ul class="list-disc list-inside my-3 space-y-1">');
        inList = true;
      }
      out.push(`<li>${inlineMd(escapeHtml(line.slice(2)))}</li>`);
      continue;
    }

    closeList();

    if (line.trim() === "") {
      out.push("");
      continue;
    }

    out.push(`<p class="my-3 leading-relaxed">${inlineMd(escapeHtml(line))}</p>`);
  }
  closeList();
  if (inCode) {
    out.push(
      `<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`,
    );
  }
  return out.join("\n");
}

function inlineMd(s: string): string {
  // **bold**, *italic*, `code`, [link](url)
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-green-600 underline hover:text-green-700">$1</a>',
    );
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CL_DIR = path.join(process.cwd(), "content", "changelog");

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  tags?: string[];
  content: string;
}

export function getAllEntries(): ChangelogEntry[] {
  if (!fs.existsSync(CL_DIR)) return [];
  return fs
    .readdirSync(CL_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(CL_DIR, f), "utf8");
      const { data, content } = matter(raw);
      return {
        version: data.version || f.replace(/\.md$/, ""),
        date: data.date || "",
        title: data.title || "",
        tags: data.tags,
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

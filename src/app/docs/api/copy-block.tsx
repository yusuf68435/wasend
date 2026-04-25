"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  language?: string;
}

export default function CopyBlock({ code, language = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard API yok (eski browser / iframe)
    }
  }

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed whitespace-pre">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition"
        aria-label="Kopyala"
      >
        {copied ? (
          <>
            <Check size={12} /> Kopyalandı
          </>
        ) : (
          <>
            <Copy size={12} /> Kopyala
          </>
        )}
      </button>
    </div>
  );
}

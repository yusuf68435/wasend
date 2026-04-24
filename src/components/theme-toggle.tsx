"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Apple macOS segmented control — light / dark / system.
 * Rounded-full kapsayıcı, aktif yaprak white surface + hafif gölge.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-7 w-[84px] bg-[#f5f5f7] rounded-full animate-pulse"
        aria-hidden="true"
      />
    );
  }

  const options = [
    { value: "light", icon: Sun, label: "Aydınlık" },
    { value: "dark", icon: Moon, label: "Karanlık" },
    { value: "system", icon: Monitor, label: "Sistem" },
  ] as const;

  return (
    <div
      className="inline-flex items-center gap-0.5 bg-[#f5f5f7] p-0.5 rounded-full"
      role="radiogroup"
      aria-label="Tema seçimi"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={
              "h-6 w-6 inline-flex items-center justify-center rounded-full transition " +
              (selected
                ? "bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-[#86868b] hover:text-[#1d1d1f]")
            }
          >
            <Icon size={13} strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}

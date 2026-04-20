"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Üç-modlu theme toggle: light / dark / system.
 * Sidebar footer'da ya da settings'te kullanılır.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration mismatch önle — theme mount sonrası render
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) {
    return <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" aria-hidden="true" />;
  }

  const options = [
    { value: "light", icon: Sun, label: "Aydınlık" },
    { value: "dark", icon: Moon, label: "Karanlık" },
    { value: "system", icon: Monitor, label: "Sistem" },
  ] as const;

  return (
    <div
      className="inline-flex gap-0.5 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg"
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
              "p-1.5 rounded-md transition " +
              (selected
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200")
            }
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

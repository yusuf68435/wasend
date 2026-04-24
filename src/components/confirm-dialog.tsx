"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * A11y-uyumlu confirm dialog. Native window.confirm() yerine kullanılır.
 *
 * A11y:
 *   - role=dialog + aria-modal
 *   - aria-labelledby + aria-describedby
 *   - Escape ile kapanır
 *   - Focus trap: Tab sadece dialog içindeki butonlar arasında dönüyor
 *   - Açılışta cancel'a focus (yanlışlıkla Enter basınca destruction olmasın)
 *   - Kapanınca opener'a focus geri gider
 *   - focus-visible ring (klavye kullanıcıları için görünür)
 *   - prefers-reduced-motion respektlı (animation utility'ler yok zaten)
 *
 * Apple palette: #ff3b30 (danger), #1d1d1f (primary text), #6e6e73 (secondary),
 * #f5f5f7 (hover bg), #d2d2d7 (border).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "İptal",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Önceden odaklı elementi sakla — kapanınca geri dönsün
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onCancel();
        return;
      }
      // Focus trap — Tab sadece cancel↔confirm arası dönsün
      if (e.key === "Tab") {
        const cancel = cancelBtnRef.current;
        const confirm = confirmBtnRef.current;
        if (!cancel || !confirm) return;
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === cancel) {
            e.preventDefault();
            confirm.focus();
          }
        } else {
          if (active === confirm) {
            e.preventDefault();
            cancel.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKey);
    // Güvenli default: cancel odaklı — yanlış Enter destructive eylem tetiklemesin
    const t = setTimeout(() => cancelBtnRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      // Focus'u geri ver (kullanıcı klavyeyle context'ini kaybetmesin)
      previouslyFocused.current?.focus?.();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmCls =
    variant === "danger"
      ? "bg-[#ff3b30] hover:bg-[#e0342a] focus-visible:ring-[#ff3b30]/40"
      : "bg-[#1d1d1f] hover:bg-black focus-visible:ring-[#1d1d1f]/30";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#d2d2d7]"
        onClick={(e) => e.stopPropagation()}
      >
        {variant === "danger" && (
          <div className="inline-flex items-center justify-center w-10 h-10 bg-[#ff3b30]/10 rounded-full mb-3">
            <AlertTriangle size={20} className="text-[#ff3b30]" aria-hidden />
          </div>
        )}
        <h2
          id="confirm-title"
          className="text-[17px] font-semibold text-[#1d1d1f] mb-2 tracking-tight"
        >
          {title}
        </h2>
        <p
          id="confirm-message"
          className="text-[14px] text-[#6e6e73] mb-6 whitespace-pre-wrap tracking-tight"
        >
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 h-10 rounded-full text-[14px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-50 tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 transition"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 h-10 rounded-full text-[14px] font-medium text-white ${confirmCls} disabled:opacity-50 tracking-tight outline-none focus-visible:ring-2 transition`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

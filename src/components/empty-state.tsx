import type { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

/**
 * Apple HIG empty state — nötr yüzey, dark pill birincil CTA, outline
 * ikincil CTA. Dark modda CSS override katmanı otomatik yüzey/metin
 * token'larına çevirir.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-14 px-6 bg-white rounded-3xl border border-[#d2d2d7]">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-[#f5f5f7] rounded-2xl mb-5 text-[#1d1d1f]">
        {icon}
      </div>
      <h3 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[14px] text-[#6e6e73] mb-7 max-w-md mx-auto tracking-tight leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="flex gap-2 justify-center flex-wrap">
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 bg-[#1d1d1f] text-white px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
            >
              {actionLabel}
            </Link>
          ) : actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 bg-[#1d1d1f] text-white px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
            >
              {actionLabel}
            </button>
          ) : null}
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 border border-[#d2d2d7] text-[#1d1d1f] px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-[#f5f5f7] transition"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

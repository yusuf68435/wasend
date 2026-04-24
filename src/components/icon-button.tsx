"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Icon-only button — aria-label ZORUNLU (a11y).
 * Klavye navigation + screen reader uyumlu.
 *
 * Örnek:
 *   <IconButton aria-label="Sil" onClick={remove}>
 *     <Trash2 size={14} />
 *   </IconButton>
 */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  children: ReactNode;
  variant?: "default" | "danger" | "primary" | "ghost";
}

const VARIANT_CLS: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  default: "text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]",
  danger: "text-[#ff3b30] hover:bg-[#ff3b30]/10",
  primary: "text-[#1d1d1f] hover:bg-[#f5f5f7]",
  ghost: "text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, variant = "default", className = "", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`p-2 rounded-xl transition outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:opacity-50 ${VARIANT_CLS[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

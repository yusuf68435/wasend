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
  default: "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
  danger: "text-red-600 hover:bg-red-50",
  primary: "text-green-600 hover:bg-green-50",
  ghost: "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, variant = "default", className = "", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`p-2 rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 ${VARIANT_CLS[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

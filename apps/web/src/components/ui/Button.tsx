"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "accent" | "brand" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 rounded-(--radius-btn) disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer";

const variants: Record<Variant, string> = {
  // White pill on dark background — "Я нашёл(ла) вещь"
  primary: "bg-white text-ink-900 hover:bg-slate-100",
  // Dark card pill — "Я владелец вещи"
  secondary:
    "bg-card text-white border border-card-border hover:bg-[#16233d]",
  accent: "bg-accent text-white hover:bg-[#2f68d8]",
  brand: "bg-brand-gradient text-white hover:brightness-110",
  ghost:
    "bg-transparent text-muted hover:text-white border border-transparent hover:border-line",
  danger: "bg-danger text-white hover:bg-red-600",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-[50px] px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

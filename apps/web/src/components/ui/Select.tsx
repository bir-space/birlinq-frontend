"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

/*
 * The field skin is the one `Input.tsx` uses, repeated here as a string
 * because that file exports only its components, and its API is frozen
 * (CLAUDE.md: the props of components/ui/* do not change). Keep the two in
 * step when the field look changes.
 */
const fieldCls =
  "w-full rounded-(--radius-btn) bg-card border border-card-border px-4 text-[15px] text-white placeholder:text-muted-2 focus:border-accent focus:outline-none transition-colors";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  /** `<option>` elements. */
  children: ReactNode;
}

/**
 * A native `<select>` in the dark field skin. Native on purpose: the phone
 * picker sheet beats any custom dropdown at 390 px, and it needs no extra
 * focus or keyboard handling.
 */
export function Select({
  label,
  error,
  hint,
  className = "",
  children,
  ...rest
}: SelectProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`${fieldCls} h-[50px] appearance-none pr-10 ${
            error ? "border-danger" : ""
          } ${className}`}
          aria-invalid={Boolean(error)}
          {...rest}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-2">{hint}</p>
      ) : null}
    </div>
  );
}

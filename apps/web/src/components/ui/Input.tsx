"use client";

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const fieldCls =
  "w-full rounded-(--radius-btn) bg-card border border-card-border px-4 text-[15px] text-white placeholder:text-muted-2 focus:border-accent focus:outline-none transition-colors";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
}

export function Input({ label, error, hint, className = "", ...rest }: InputProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${fieldCls} h-[50px] ${error ? "border-danger" : ""} ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-2">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

export function Textarea({ label, error, className = "", ...rest }: TextareaProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-muted">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${fieldCls} min-h-28 py-3 resize-y ${error ? "border-danger" : ""} ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}

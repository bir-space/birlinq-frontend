"use client";

import type { AuthMethod } from "./helpers";

/** Segmented email / phone switch used by login and register forms. */
export function MethodToggle({
  value,
  onChange,
  emailLabel,
  phoneLabel,
}: {
  value: AuthMethod;
  onChange: (v: AuthMethod) => void;
  emailLabel: string;
  phoneLabel: string;
}) {
  const options: { id: AuthMethod; label: string }[] = [
    { id: "email", label: emailLabel },
    { id: "phone", label: phoneLabel },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-(--radius-btn) border border-card-border bg-card p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-9 cursor-pointer rounded-xl text-[13px] font-semibold transition-colors ${
            value === o.id
              ? "bg-white text-ink-900"
              : "text-muted hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

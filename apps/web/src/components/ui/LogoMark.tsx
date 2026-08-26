"use client";

import { useId } from "react";

/**
 * The "bq" signal monogram — b (ascender + bowl) mirrors q (bowl + descender),
 * a visual handshake of 10 → 01 ("первый сигнал → отклик"). Single diagonal
 * gradient (brand-blue → ice → brand-violet) sweeps across both letterforms,
 * matching the final logo sheet exactly.
 */
export function LogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const gradId = useId();
  const height = Math.round(size * (46 / 64));

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 46"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2="64"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2e63e0" />
          <stop offset="55%" stopColor="#eef1fc" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* b — ascender + bowl */}
      <rect x="4" y="2" width="9" height="32" rx="4.5" fill={`url(#${gradId})`} />
      <circle
        cx="21"
        cy="28"
        r="11"
        stroke={`url(#${gradId})`}
        strokeWidth="9"
        fill="none"
      />
      {/* q — bowl + descender */}
      <circle
        cx="43"
        cy="16"
        r="11"
        stroke={`url(#${gradId})`}
        strokeWidth="9"
        fill="none"
      />
      <rect x="51" y="8" width="9" height="34" rx="4.5" fill={`url(#${gradId})`} />
    </svg>
  );
}

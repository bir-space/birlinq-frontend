import type { PartnerCode } from "@birlinq/api";
import { PARTNERS } from "./partners";

const sizes = {
  sm: "text-[15px] tracking-[0.22em]",
  md: "text-[19px] tracking-[0.24em]",
  lg: "text-[26px] tracking-[0.26em]",
} as const;

const tiles = {
  sm: "h-3.5 w-5",
  md: "h-4 w-6",
  lg: "h-5 w-8",
} as const;

/**
 * Partner lockup: a "borderless blue" gradient tile (light top-left → deep
 * bottom-right, the direction of Geely's 2023 identity) beside the wordmark
 * in squarish, wide-tracked caps, the way the brand sets it. The tile is a
 * colour swatch, not the six-panel shield — the crest is the partner's
 * trademark and is theirs to supply (brand kit / dealer agreement), not ours
 * to redraw. When the official SVG arrives, drop it into
 * `apps/web/public/partners/<code>.svg` and replace the tile + span with an
 * <img> here — this is the single place the mark is drawn.
 */
export function PartnerMark({
  partner,
  size = "md",
  className = "",
}: {
  partner: PartnerCode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { name } = PARTNERS[partner];
  return (
    <span
      className={`inline-flex items-center gap-2 font-extrabold uppercase text-white ${sizes[size]} ${className}`}
      aria-label={name}
    >
      <span
        aria-hidden
        className={`shrink-0 rounded-[3px] bg-brand-gradient ${tiles[size]}`}
      />
      {name}
    </span>
  );
}

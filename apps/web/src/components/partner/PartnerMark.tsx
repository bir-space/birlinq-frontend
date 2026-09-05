import type { PartnerCode } from "@birlinq/api";
import { PARTNERS } from "./partners";

const sizes = {
  sm: "text-[15px] tracking-[0.22em]",
  md: "text-[19px] tracking-[0.24em]",
  lg: "text-[26px] tracking-[0.26em]",
} as const;

/**
 * Partner lockup. Rendered as a set wordmark on purpose: the partner's
 * trademark artwork is theirs to supply (brand kit / dealer agreement), not
 * ours to redraw. When the official SVG arrives, drop it into
 * `apps/web/public/partners/<code>.svg` and swap the <span> for an <img>
 * here — this is the single place the mark is drawn.
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
      className={`inline-flex items-center font-extrabold uppercase text-white ${sizes[size]} ${className}`}
      aria-label={name}
    >
      {name}
    </span>
  );
}

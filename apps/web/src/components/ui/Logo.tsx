import { Link } from "@/i18n/navigation";
import { LogoMark } from "./LogoMark";

const textSizes = {
  sm: "text-[16px]",
  md: "text-[20px]",
  lg: "text-[26px]",
} as const;

const markSizes = {
  sm: 22,
  md: 27,
  lg: 34,
} as const;

export function Logo({
  size = "md",
  href = "/",
  markOnly = false,
  className = "",
}: {
  size?: keyof typeof textSizes;
  href?: string;
  /** Icon-only lockup — for tight header slots, favicons-in-app, avatars. */
  markOnly?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="birlinq"
    >
      <LogoMark size={markSizes[size]} className="shrink-0" />
      {!markOnly && (
        <span
          className={`font-semibold tracking-tight text-white ${textSizes[size]}`}
        >
          birlinq
        </span>
      )}
    </Link>
  );
}

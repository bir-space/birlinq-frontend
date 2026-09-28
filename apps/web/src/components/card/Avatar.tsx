import { initials } from "./initials";

const SIZES = {
  sm: "size-10 text-[13px]",
  md: "size-14 text-[17px]",
  lg: "size-20 text-[24px]",
  xl: "size-24 text-[28px]",
} as const;

export type AvatarSize = keyof typeof SIZES;

/**
 * A round photo, or the person's initials when there is none. Colours come
 * from `className` so the same component sits on the dark cabinet
 * (`bg-card text-white`) and inside a themed card (`bg-(--card-surface)
 * text-(--card-text)`) alike. `src` is expected to have passed `imageSrc`.
 */
export function Avatar({
  name,
  src = null,
  alt,
  size = "md",
  className = "bg-card text-white",
}: {
  name: string;
  src?: string | null;
  /** Alt text for the photo; the initials fallback is decorative. */
  alt?: string;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-bold leading-none ${SIZES[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

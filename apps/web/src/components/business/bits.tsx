"use client";

import type { ComponentProps, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Entity, EntityStatus } from "@birlinq/api";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/card/Avatar";
import { imageSrc } from "@/components/card/hrefs";
import { IconChevronRight } from "@/components/dashboard/bits";

type BadgeTone = "accent" | "muted" | "warn" | "danger" | "info";

/** Published → brand accent; hidden → muted; blocked by moderation → danger. */
export function cardStatusTone(status: EntityStatus): BadgeTone {
  switch (status) {
    case "active":
      return "accent";
    case "blocked":
      return "danger";
    default:
      return "muted";
  }
}

export function CardStatusBadge({
  status,
  className = "",
}: {
  status: EntityStatus;
  className?: string;
}) {
  const t = useTranslations("cards.status");
  return (
    <Badge tone={cardStatusTone(status)} className={className}>
      {t(status)}
    </Badge>
  );
}

/*
 * The small pill of `ui/Button.tsx` on a link, repeated because that file's
 * API is frozen and a <button> may not sit inside an <a>. Keep in step with
 * `base`, `variants.accent`/`variants.ghost` and `sizes.sm` there.
 */
const linkButtonBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-(--radius-btn) px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const linkButtonVariants = {
  accent: "bg-accent text-white hover:bg-[#2f68d8]",
  ghost:
    "bg-transparent text-muted border border-transparent hover:text-white hover:border-line",
} as const;

/** A `Link` that looks like `<Button size="sm">` — the list's per-card actions and the create CTA. */
export function LinkButton({
  variant = "ghost",
  className = "",
  ...rest
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof linkButtonVariants;
}) {
  return (
    <Link
      className={`${linkButtonBase} ${linkButtonVariants[variant]} ${className}`}
      {...rest}
    />
  );
}

/**
 * Thirty (or however many) bars in a row, tallest = the maximum. Pure
 * presentation: `bars` carry a label for the tooltip and a value; the
 * caller picks views or clicks, formats the label and sums the chart up in
 * `ariaLabel` — the bars themselves say nothing to a screen reader.
 */
export function MiniBars({
  bars,
  ariaLabel,
  className = "",
  barClassName = "bg-accent",
  height = 56,
}: {
  bars: readonly { label: string; value: number }[];
  /** What the chart shows, with its total — the accessible name of the image. */
  ariaLabel: string;
  className?: string;
  barClassName?: string;
  /** Height of the track in px. */
  height?: number;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div
      className={`flex items-end gap-px ${className}`}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      {bars.map((bar, i) => (
        <span
          key={i}
          title={`${bar.label}: ${bar.value}`}
          className="group relative flex h-full flex-1 items-end"
        >
          <span
            className={`w-full rounded-t-sm transition-opacity ${barClassName} ${
              bar.value === 0 ? "opacity-20" : "opacity-80 group-hover:opacity-100"
            }`}
            style={{
              height: `${Math.max(bar.value === 0 ? 4 : 8, (bar.value / max) * 100)}%`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

/** Name, title · company, link and status of one card, on the dark cabinet surface. */
export function CardTile({
  entity,
  href,
  children,
}: {
  entity: Entity;
  /** Where the tile's head leads — the edit page; already prefix-aware. */
  href: string;
  /** Actions rendered under a divider. */
  children?: ReactNode;
}) {
  const t = useTranslations("cards.list");
  const profile = entity.contact_profile;
  const name = profile?.display_name?.trim() || t("noName");
  const line = [profile?.title, profile?.company].filter(Boolean).join(" · ");

  return (
    <Card className="flex w-full flex-col gap-4">
      <Link href={href} className="group flex items-center gap-3">
        <Avatar
          name={name}
          src={imageSrc(profile?.photo_url)}
          size="md"
          className="border border-card-border bg-ink-soft text-white"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold">{name}</span>
            <CardStatusBadge status={entity.status} />
          </div>
          {line && (
            <p className="mt-0.5 truncate text-[13px] text-muted">{line}</p>
          )}
          <p className="mt-0.5 truncate font-mono text-[12px] text-muted-2">
            {entity.alias ? `/p/${entity.alias}` : t("linkClosed")}
          </p>
        </div>
        <IconChevronRight className="size-5 shrink-0 text-muted-2 transition-colors group-hover:text-white" />
      </Link>
      {children && (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-card-border pt-3">
          {children}
        </div>
      )}
    </Card>
  );
}

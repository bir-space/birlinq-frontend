"use client";

import { useTranslations } from "next-intl";
import {
  CONTACT_CHANNELS,
  type ContactChannel,
  type PublicContact,
} from "@birlinq/api";
import { IconChevronRight } from "@/components/public/icons";
import { formatKzPhoneDisplay } from "@/components/business/phone";
import { contactHref, displayUrl, isExternalHref } from "./hrefs";
import { ChannelIcon } from "./icons";

interface Tile {
  channel: ContactChannel;
  value: string;
  href: string | null;
}

/**
 * The channels present in the payload, in the card's fixed order. Presence
 * is the only test: the backend's PrivacyFilter *omits* a hidden channel,
 * so nothing here ever asks whether the owner allows it.
 */
export function contactTiles(contact: PublicContact): Tile[] {
  const out: Tile[] = [];
  for (const channel of CONTACT_CHANNELS) {
    const raw = contact[channel];
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    out.push({ channel, value, href: contactHref(channel, value) });
  }
  return out;
}

function shown(channel: ContactChannel, value: string): string {
  switch (channel) {
    case "phone":
    case "phone2":
    case "whatsapp":
      return formatKzPhoneDisplay(value);
    case "website":
    case "linkedin":
      return displayUrl(value);
    case "telegram":
    case "instagram":
      return /^[\w.]+$/.test(value) ? `@${value}` : value;
    default:
      return value;
  }
}

const tileCls =
  "flex w-full items-center gap-3 rounded-(--radius-card) border border-(--card-border) bg-(--card-surface) p-3.5 text-left";

/** One tappable tile per contact channel the payload carries. */
export function ContactTiles({
  contact,
  onClick,
}: {
  contact: PublicContact;
  /** Fired before the link opens — the page reports a `contact_click`. */
  onClick?: (channel: ContactChannel) => void;
}) {
  const t = useTranslations("card.channels");
  const tiles = contactTiles(contact);
  if (tiles.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-2">
      {tiles.map((tile) => {
        const inner = (
          <>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--card-accent) text-(--card-accent-fg)">
              <ChannelIcon channel={tile.channel} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] uppercase tracking-wide text-(--card-muted)">
                {t(tile.channel)}
              </span>
              <span className="block truncate text-[14px] font-medium">
                {shown(tile.channel, tile.value)}
              </span>
            </span>
            {tile.href && (
              <IconChevronRight className="size-4 shrink-0 text-(--card-muted)" />
            )}
          </>
        );
        return (
          <li key={tile.channel}>
            {tile.href ? (
              <a
                href={tile.href}
                onClick={() => onClick?.(tile.channel)}
                className={`${tileCls} transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--card-accent)`}
                {...(isExternalHref(tile.href)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {inner}
              </a>
            ) : (
              <div className={tileCls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

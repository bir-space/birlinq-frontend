"use client";

import { useTranslations } from "next-intl";
import type { SocialLink, SocialPlatform } from "@birlinq/api";
import { webHref } from "./hrefs";
import { SocialIcon } from "./icons";

/** The extra networks as a row of pills; each opens in a new tab. */
export function SocialPills({
  socials,
  onClick,
}: {
  socials: SocialLink[];
  /** Fired before the link opens — the page reports `social:<platform>`. */
  onClick?: (platform: SocialPlatform) => void;
}) {
  const t = useTranslations("card.socials");
  const links = socials
    .map((s) => ({ platform: s.platform, href: webHref(s.url) }))
    .filter((s): s is { platform: SocialPlatform; href: string } => s.href !== null);
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => (
        <li key={link.platform}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onClick?.(link.platform)}
            className="inline-flex items-center gap-2 rounded-full border border-(--card-border) bg-(--card-surface) py-2 pl-3 pr-3.5 text-[13px] font-medium transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--card-accent)"
          >
            <SocialIcon
              platform={link.platform}
              className="size-4 text-(--card-accent)"
            />
            {t(link.platform)}
          </a>
        </li>
      ))}
    </ul>
  );
}

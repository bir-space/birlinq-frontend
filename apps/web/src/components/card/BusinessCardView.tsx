"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type {
  CardTheme,
  PublicEntityPayload,
  PublicEventRequest,
  PublicScenario,
  PublicTarget,
} from "@birlinq/api";
import { useApi, useHref } from "@birlinq/platform";
import { cardUrl } from "@/lib/public-url";
import { shareOrCopy } from "@/lib/share";
import {
  IconChevronRight,
  IconShieldCheck,
  ScenarioIcon,
} from "@/components/public/icons";
import { formatBirthday } from "@/components/business/dates";
import { Avatar } from "./Avatar";
import { CardTags } from "./CardTags";
import { ContactTiles } from "./ContactTiles";
import { SocialPills } from "./SocialPills";
import { imageSrc } from "./hrefs";
import {
  IconCake,
  IconDownload,
  IconQrSmall,
  IconShare,
} from "./icons";
import { THEMES, headGradient, themeOf, themeStyle } from "./themes";

type ShareNotice = "copied" | "failed" | null;

const NOTICE_MS = 2200;

/**
 * The public business card. Everything visible is exactly what the payload
 * carries — the backend's PrivacyFilter omits hidden fields, so every
 * section here renders on presence alone and none of them consults a flag.
 *
 * The `<article>` is the one themed element on the page (FE-012): its
 * palette arrives as CSS custom properties from `themeStyle`, and the
 * children read `--card-*`. The app chrome around it stays dark.
 *
 * Taps on contacts and shares are reported through `trackEvent`,
 * fire-and-forget: analytics never delays a `tel:` link.
 */
export function BusinessCardView({
  payload,
  target,
  themeOverride = null,
  onSelectScenario,
}: {
  payload: PublicEntityPayload;
  target: PublicTarget;
  /** `?theme=` preview — presentation only, never persisted. */
  themeOverride?: CardTheme | null;
  /** Scenarios exist behind the sticker door only; absent means no section. */
  onSelectScenario?: (scenario: PublicScenario) => void;
}) {
  const t = useTranslations("card");
  const tp = useTranslations("public");
  const locale = useLocale();
  const api = useApi();
  const href = useHref();

  const contact = payload.entity.contact ?? {};
  const theme = themeOverride ?? themeOf(contact.theme);
  const palette = THEMES[theme];
  const name = contact.display_name?.trim() || t("fallbackName");
  const alias = payload.entity.alias;
  const photo = imageSrc(contact.photo_url);
  const cover = imageSrc(contact.cover_url);
  const showScenarios =
    target.kind === "qr" &&
    onSelectScenario !== undefined &&
    payload.scenarios.length > 0;

  const track = useCallback(
    (body: PublicEventRequest) => {
      void api.public.trackEvent(target, body).catch(() => {
        // Analytics only — a failed ping must never reach the visitor.
      });
    },
    [api, target]
  );

  const [shareNotice, setShareNotice] = useState<ShareNotice>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const flash = (next: ShareNotice) => {
    if (timer.current) clearTimeout(timer.current);
    setShareNotice(next);
    if (next) timer.current = setTimeout(() => setShareNotice(null), NOTICE_MS);
  };

  const handleShare = async () => {
    // The card's own link when it has one; the sticker page otherwise.
    const url = alias ? cardUrl(alias) : window.location.href;
    const outcome = await shareOrCopy({
      title: t("share.title", { name }),
      text: t("share.text", { name }),
      url,
    });
    if (outcome === "shared") {
      track({ type: "share", channel: "native" });
      flash(null);
    } else if (outcome === "copied") {
      track({ type: "share", channel: "copy" });
      flash("copied");
    } else if (outcome === "failed") {
      flash("failed");
    }
  };

  const secondaryBtn =
    "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-(--radius-btn) border border-(--card-border) bg-(--card-surface) px-4 text-[14px] font-semibold transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--card-accent)";

  return (
    <article
      data-scheme={palette.scheme}
      style={themeStyle(theme)}
      className="overflow-hidden rounded-(--radius-panel) border border-(--card-border) bg-(--card-bg) text-(--card-text)"
    >
      {/* Cover: the owner's image, or the theme's gradient */}
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-36 w-full object-cover"
        />
      ) : (
        <div
          className="h-28"
          style={{ backgroundImage: headGradient(theme) }}
          aria-hidden="true"
        />
      )}

      <div className="px-5 pb-6">
        {/* Identity */}
        <div className="-mt-12 flex items-end justify-between gap-3">
          <Avatar
            name={name}
            src={photo}
            alt={t("photoAlt", { name })}
            size="xl"
            className="border-4 border-(--card-bg) bg-(--card-surface) text-(--card-text)"
          />
          {payload.meta.privacy_badge !== false && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-(--card-border) bg-(--card-surface) px-2.5 py-1 text-[11px] font-semibold text-(--card-muted)">
              <IconShieldCheck className="size-3 text-(--card-accent)" />
              {tp("card.hiddenBadge")}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-[22px] font-bold leading-tight">{name}</h1>
        {contact.title && (
          <p className="mt-0.5 text-[14px] text-(--card-muted)">
            {contact.title}
          </p>
        )}
        {contact.company && (
          <p className="text-[14px] font-medium">{contact.company}</p>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          {/* No click tracking here: the backend records the download itself
              as a `vcard_download` event when it serves the file. */}
          <a
            href={api.public.vcardUrl(target)}
            download
            className="inline-flex h-12 items-center justify-center gap-2 rounded-(--radius-btn) bg-(--card-accent) px-5 text-[15px] font-semibold text-(--card-accent-fg) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--card-accent)"
          >
            <IconDownload className="size-5" />
            {t("actions.save")}
          </a>
          <div className={`grid gap-2 ${alias ? "grid-cols-2" : "grid-cols-1"}`}>
            <button type="button" onClick={handleShare} className={secondaryBtn}>
              <IconShare className="size-4" />
              {t("actions.share")}
            </button>
            {alias && (
              <Link href={href(`/p/${alias}/qr`)} className={secondaryBtn}>
                <IconQrSmall className="size-4" />
                {t("actions.qr")}
              </Link>
            )}
          </div>
          <p
            aria-live="polite"
            className={`min-h-4 text-center text-[12px] ${
              shareNotice === "copied" ? "text-(--card-accent)" : "text-danger"
            }`}
          >
            {shareNotice === "copied"
              ? t("share.copied")
              : shareNotice === "failed"
                ? t("share.failed")
                : ""}
          </p>
        </div>

        <Section title={t("sections.contacts")} when={hasContacts(contact)}>
          <ContactTiles
            contact={contact}
            onClick={(channel) => track({ type: "contact_click", channel })}
          />
        </Section>

        <Section
          title={t("sections.socials")}
          when={Boolean(contact.socials && contact.socials.length > 0)}
        >
          <SocialPills
            socials={contact.socials ?? []}
            onClick={(platform) =>
              track({ type: "contact_click", channel: `social:${platform}` })
            }
          />
        </Section>

        <Section title={t("sections.about")} when={Boolean(contact.bio)}>
          <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
            {contact.bio}
          </p>
        </Section>

        <Section
          title={t("sections.tags")}
          when={Boolean(contact.tags && contact.tags.length > 0)}
        >
          <CardTags tags={contact.tags ?? []} />
        </Section>

        <Section title={t("sections.birthday")} when={Boolean(contact.birthday)}>
          <p className="inline-flex items-center gap-2 text-[14px]">
            <IconCake className="size-5 text-(--card-accent)" />
            {contact.birthday ? formatBirthday(contact.birthday, locale) : null}
          </p>
        </Section>

        {showScenarios && (
          <section className="mt-7">
            <h2 className="text-[18px] font-bold">{t("sections.scenarios")}</h2>
            <p className="mt-1 text-[13px] text-(--card-muted)">
              {t("scenarios.choose")}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {payload.scenarios.map((scenario) => (
                <li key={scenario.id}>
                  <button
                    type="button"
                    onClick={() => onSelectScenario?.(scenario)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-(--radius-card) border border-(--card-border) bg-(--card-surface) p-3.5 text-left transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--card-accent)"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--card-accent)/15 text-(--card-accent)">
                      <ScenarioIcon
                        hint={`${scenario.icon ?? ""} ${scenario.code}`}
                        className="size-5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium">
                        {scenario.title}
                      </span>
                      {scenario.description && (
                        <span className="mt-0.5 block text-[12px] text-(--card-muted)">
                          {scenario.description}
                        </span>
                      )}
                    </span>
                    <IconChevronRight className="size-4 shrink-0 text-(--card-muted)" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Privacy banner */}
        <div className="mt-7 flex items-start gap-3 rounded-(--radius-card) border border-(--card-accent)/25 bg-(--card-accent)/10 p-4">
          <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-(--card-accent)" />
          <div>
            <p className="text-[13px] font-semibold text-(--card-accent)">
              {tp("card.privacyTitle")}
            </p>
            <p className="mt-0.5 text-[12px] text-(--card-muted)">
              {tp("card.privacyText")}
            </p>
          </div>
        </div>

        {/* "Make your own" */}
        <div className="mt-6 border-t border-(--card-border) pt-5 text-center">
          <p className="text-[14px] font-bold">{t("cta.title")}</p>
          <p className="mt-0.5 text-[12px] text-(--card-muted)">{t("cta.text")}</p>
          <Link
            href={href("/dashboard/cards/new")}
            className="mt-3 inline-flex h-10 items-center justify-center rounded-(--radius-btn) border border-(--card-accent) px-5 text-[13px] font-semibold text-(--card-accent) transition-opacity hover:opacity-85"
          >
            {t("cta.button")}
          </Link>
          <p className="mt-4 text-[11px] text-(--card-muted)">{t("footer.note")}</p>
        </div>
      </div>
    </article>
  );
}

function hasContacts(contact: PublicEntityPayload["entity"]["contact"]): boolean {
  if (!contact) return false;
  return Boolean(
    contact.phone ||
      contact.phone2 ||
      contact.email ||
      contact.whatsapp ||
      contact.telegram ||
      contact.website ||
      contact.linkedin ||
      contact.instagram
  );
}

/** A titled block that renders only when `when` holds — one per payload key. */
function Section({
  title,
  when,
  children,
}: {
  title: string;
  when: boolean;
  children: ReactNode;
}) {
  if (!when) return null;
  return (
    <section className="mt-6">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-(--card-muted)">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

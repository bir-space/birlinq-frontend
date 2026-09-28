"use client";

import { useLocale, useTranslations } from "next-intl";
import { CONTACT_CHANNELS, SOCIAL_PLATFORMS } from "@birlinq/api";
import { useCardStats } from "@birlinq/core";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/dashboard/bits";
import { MiniBars } from "@/components/business/bits";
import { formatDateTime, formatShortDay } from "@/components/business/dates";
import { Section } from "./shared";

const CONTACT_SET = new Set<string>(CONTACT_CHANNELS);
const SOCIAL_SET = new Set<string>(SOCIAL_PLATFORMS);

/**
 * Thirty days of one card: views split by door, unique visitors, clicks
 * split the way the overview does, saves and shares, the daily bars and
 * the clicks per channel. Read-only — it has no writes, so it takes the
 * id rather than the editor's section props.
 */
export function StatsSection({ id }: { id: string }) {
  const t = useTranslations("cards.stats");
  const tSections = useTranslations("cards.sections");
  const tOverview = useTranslations("cards.overview.stats");
  const tSocial = useTranslations("card.socials");
  const locale = useLocale();
  const { stats, clickSplit, loading, error, retry } = useCardStats(id);

  const channelLabel = (key: string): string => {
    if (key.startsWith("social:")) {
      const platform = key.slice("social:".length);
      const name = SOCIAL_SET.has(platform) ? tSocial(platform) : platform;
      return `${t("channels.social")} · ${name}`;
    }
    return CONTACT_SET.has(key) ? t(`channels.${key}`) : key;
  };

  return (
    <Section id="stats" title={tSections("stats")} hint={t("hint")}>
      {loading ? (
        <PageSpinner />
      ) : error || !stats || !clickSplit ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-[14px] text-muted">{t("error")}</p>
          <Button variant="secondary" size="sm" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label={t("views")}
              value={stats.views_30d}
              sub={t("viewsSplit", {
                qr: stats.views_30d_by_source.qr,
                link: stats.views_30d_by_source.link,
              })}
              tone="accent"
            />
            <StatCard label={t("unique")} value={stats.unique_visitors_30d} />
            <StatCard
              label={t("clicks")}
              value={stats.clicks_30d}
              sub={tOverview("clicksSplit", {
                calls: clickSplit.calls,
                social: clickSplit.social,
                website: clickSplit.website,
              })}
            />
            <StatCard
              label={t("vcard")}
              value={stats.vcard_downloads_30d}
              sub={`${t("totals")}: ${stats.vcard_downloads_total}`}
            />
            <StatCard
              label={t("shares")}
              value={stats.shares_30d}
              sub={`${t("totals")}: ${stats.shares_total}`}
            />
          </div>

          <p className="text-[13px] text-muted">
            {t("lastView")}:{" "}
            <span className="text-white">
              {stats.last_view_at
                ? formatDateTime(stats.last_view_at, locale)
                : t("never")}
            </span>
          </p>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-2">
                {t("daily")}
              </p>
              <p className="flex items-center gap-3 text-[11px] text-muted-2">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-accent" aria-hidden="true" />
                  {t("views")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-white/60" aria-hidden="true" />
                  {t("clicks")}
                </span>
              </p>
            </div>
            <MiniBars
              bars={stats.daily.map((d) => ({
                label: formatShortDay(d.date, locale),
                value: d.views,
              }))}
              height={64}
            />
            <MiniBars
              bars={stats.daily.map((d) => ({
                label: formatShortDay(d.date, locale),
                value: d.clicks,
              }))}
              barClassName="bg-white/60"
              height={28}
              className="mt-1"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-2">
              <span>{formatShortDay(stats.daily[0]?.date ?? "", locale)}</span>
              <span>
                {formatShortDay(stats.daily[stats.daily.length - 1]?.date ?? "", locale)}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-2">
              {t("byChannel")}
            </p>
            <ChannelList
              byChannel={stats.clicks_30d_by_channel}
              label={channelLabel}
              empty={t("noClicks")}
            />
          </div>
        </>
      )}
    </Section>
  );
}

function ChannelList({
  byChannel,
  label,
  empty,
}: {
  byChannel: Record<string, number>;
  label: (key: string) => string;
  empty: string;
}) {
  const rows = Object.entries(byChannel)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    return <p className="text-[13px] text-muted">{empty}</p>;
  }
  const max = rows[0][1];
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(([key, count]) => (
        <li key={key} className="flex items-center gap-3 text-[13px]">
          <span className="w-40 shrink-0 truncate text-muted sm:w-52">
            {label(key)}
          </span>
          <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-semibold tabular-nums">
            {count}
          </span>
        </li>
      ))}
    </ul>
  );
}

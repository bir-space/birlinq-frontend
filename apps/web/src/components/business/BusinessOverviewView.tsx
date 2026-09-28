"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useHref } from "@birlinq/platform";
import { useBusinessOverview } from "@birlinq/core";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  EmptyState,
  ErrorCard,
  IconBubble,
  IconCard,
  IconChevronRight,
  IconPlus,
  StatCard,
} from "@/components/dashboard/bits";
import { IconChart } from "@/components/card/icons";
import { CardTile } from "@/components/business/bits";

export function BusinessOverviewView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <BusinessOverview />
    </DashboardShell>
  );
}

/**
 * The Business home: thirty-day totals over the owner's cards, the cards
 * themselves with their own figures, and the quick actions. Totals cover
 * the first page of cards only — the hook says so with `hasMoreCards`.
 */
function BusinessOverview() {
  const t = useTranslations("cards");
  const tStats = useTranslations("cards.stats");
  const tc = useTranslations("common");
  const href = useHref();
  const { cards, hasMoreCards, statsById, totals, partial, loading, error, retry } =
    useBusinessOverview();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">
          {t("overview.title")}
        </h1>
        <p className="mt-1 text-[13px] text-muted-2">{t("overview.subtitle")}</p>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorCard
          message={tc("error")}
          retryLabel={tc("retry")}
          onRetry={retry}
        />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={<IconCard className="size-6" />}
          title={t("overview.cards.empty")}
          hint={t("overview.cards.emptyHint")}
          cta={
            <Link href={href("/dashboard/cards/new")}>
              <Button variant="accent" size="sm">
                {t("overview.cards.create")}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label={t("overview.stats.views")}
              value={totals.views}
              sub={t("overview.stats.period")}
              tone="accent"
            />
            <StatCard
              label={t("overview.stats.clicks")}
              value={totals.clicks}
              sub={t("overview.stats.clicksSplit", {
                calls: totals.clickSplit.calls,
                social: totals.clickSplit.social,
                website: totals.clickSplit.website,
              })}
            />
            <StatCard
              label={t("overview.stats.vcard")}
              value={totals.vcardDownloads}
              sub={t("overview.stats.period")}
            />
            <StatCard
              label={t("overview.stats.shares")}
              value={totals.shares}
              sub={t("overview.stats.period")}
            />
          </div>

          {partial && (
            <p className="-mt-4 text-[12px] text-warn">
              {t("overview.stats.partial")}
            </p>
          )}

          {/* See OverviewView for why every track is minmax(0, …). */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <section className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold">
                  {t("overview.cards.title")}
                </h2>
                <Link
                  href={href("/dashboard/cards")}
                  className="text-[13px] font-semibold text-accent transition-colors hover:text-white"
                >
                  {t("overview.cards.all")} →
                </Link>
              </div>
              <ul className="flex flex-col gap-3">
                {cards.map((entity) => {
                  const stats = statsById[entity.id];
                  return (
                    <li key={entity.id} className="min-w-0">
                      <CardTile
                        entity={entity}
                        href={href(`/dashboard/cards/${entity.id}`)}
                      >
                        {stats && (
                          <p className="flex items-center gap-1.5 text-[12px] text-muted-2">
                            <IconChart className="size-4" />
                            <span>
                              {tStats("views")}: {stats.views_30d}
                              {" · "}
                              {tStats("clicks")}: {stats.clicks_30d}
                            </span>
                          </p>
                        )}
                      </CardTile>
                    </li>
                  );
                })}
              </ul>
              {hasMoreCards && (
                <p className="mt-2 text-[12px] text-muted-2">
                  {t("overview.cards.more", { count: cards.length })}
                </p>
              )}
            </section>

            <section className="min-w-0">
              <h2 className="mb-3 text-[15px] font-bold">
                {t("overview.quick.title")}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <QuickLink
                  href={href("/dashboard/cards/new")}
                  icon={<IconPlus className="size-5" />}
                  title={t("overview.quick.createTitle")}
                  hint={t("overview.quick.createHint")}
                />
                <QuickLink
                  href={href("/dashboard/cards")}
                  icon={<IconCard />}
                  title={t("overview.quick.cardsTitle")}
                  hint={t("overview.quick.cardsHint")}
                />
                <QuickLink
                  href={href("/dashboard/pricing")}
                  icon={<IconChart className="size-5" />}
                  title={t("overview.quick.pricingTitle")}
                  hint={t("overview.quick.pricingHint")}
                />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link href={href} className="block min-w-0">
      <Card className="flex items-center gap-3 !p-4 transition-colors hover:border-line">
        <IconBubble tone="accent">{icon}</IconBubble>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">{title}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted-2">{hint}</p>
        </div>
        <IconChevronRight className="size-5 shrink-0 text-muted-2" />
      </Card>
    </Link>
  );
}

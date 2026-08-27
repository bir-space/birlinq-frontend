"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useHref } from "@birlinq/platform";
import { useInteractions } from "@birlinq/core";
import type { Interaction } from "@birlinq/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  EmptyState,
  ErrorCard,
  IconBubble,
  IconChat,
  IconCheck,
} from "@/components/dashboard/bits";
import {
  dayGroup,
  formatRelativeTime,
  interactionBadgeTone,
  scenarioLabel,
} from "@/components/dashboard/format";

export function InteractionsView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <InteractionsList />
    </DashboardShell>
  );
}

type Filter = "all" | "new";

function InteractionsList() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const href = useHref();

  const [filter, setFilter] = useState<Filter>("all");

  const {
    items,
    loading,
    error,
    hasMore,
    loadingMore,
    resolving,
    actionError,
    retry,
    loadMore,
    resolve,
  } = useInteractions();

  const newCount = items.filter((i) => i.status === "new").length;
  const visible = filter === "new" ? items.filter((i) => i.status === "new") : items;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">
          {t("interactions.title")}
        </h1>
        <p className="mt-1 text-[13px] text-muted-2">
          {t("interactions.subtitle")}
        </p>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorCard
          message={tc("error")}
          retryLabel={tc("retry")}
          onRetry={retry}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconChat className="size-6" />}
          title={t("interactions.empty")}
          hint={t("interactions.emptyHint")}
          cta={
            <Link href={href("/dashboard/qr")}>
              <Button variant="secondary" size="sm">
                {t("interactions.emptyCta")}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Filter chips */}
          <div className="flex gap-2">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label={`${t("interactions.filterAll")} · ${items.length}`}
            />
            <FilterChip
              active={filter === "new"}
              onClick={() => setFilter("new")}
              label={`${t("interactions.filterNew")} · ${newCount}`}
            />
          </div>

          {actionError && (
            <p className="rounded-(--radius-btn) border border-danger/30 bg-danger/10 px-4 py-2.5 text-[13px] text-danger">
              {actionError === "resolve"
                ? t("interactions.resolveError")
                : tc("error")}
            </p>
          )}

          {visible.length === 0 ? (
            <EmptyState
              icon={<IconCheck className="size-6" />}
              title={t("interactions.newFilterEmpty")}
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visible.map((item, idx) => {
                const group = dayGroup(item.created_at);
                const prevGroup =
                  idx > 0 ? dayGroup(visible[idx - 1].created_at) : null;
                return (
                  <Fragment key={item.id}>
                    {group !== prevGroup && (
                      <li
                        aria-hidden
                        className={`text-[11px] font-bold uppercase tracking-wider text-muted-2 ${
                          idx > 0 ? "mt-3" : ""
                        }`}
                      >
                        {t(`interactions.groups.${group}`)}
                      </li>
                    )}
                    <li>
                      <InteractionCard
                        item={item}
                        busy={resolving.has(item.id)}
                        onResolve={() => resolve(item.id)}
                      />
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          )}

          {hasMore && filter === "all" && (
            <Button
              variant="secondary"
              onClick={loadMore}
              loading={loadingMore}
              className="mx-auto w-full sm:w-auto sm:min-w-56"
            >
              {t("interactions.loadMore")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? "bg-white text-ink-900"
          : "border border-line text-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function InteractionCard({
  item,
  busy,
  onResolve,
}: {
  item: Interaction;
  busy: boolean;
  onResolve: () => void;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const isNew = item.status === "new";

  return (
    <Card
      className={`!p-4 ${isNew ? "border-warn/30" : ""}`}
    >
      <div className="flex items-start gap-3">
        <IconBubble tone={isNew ? "warn" : item.status === "spam" ? "danger" : "muted"}>
          <IconChat />
        </IconBubble>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold">
              {scenarioLabel(item.scenario_code, t)}
            </span>
            <Badge tone={interactionBadgeTone[item.status]}>
              {t(`interactionStatus.${item.status}`)}
            </Badge>
            <span className="ml-auto shrink-0 text-[11px] text-muted-2">
              {formatRelativeTime(item.created_at, t, locale)}
            </span>
          </div>
          {/* Cap the measure: on the full-width track an uncapped line would
              run past a comfortable reading length. */}
          <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-muted">
            {item.message ? `«${item.message}»` : t("interactions.noMessage")}
          </p>
          {isNew && (
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                loading={busy}
                onClick={onResolve}
              >
                <IconCheck />
                {t("interactions.resolve")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

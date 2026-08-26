"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useApi, useHref } from "@birlinq/platform";
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

const PAGE_SIZE = 20;

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
  const api = useApi();
  const href = useHref();

  const [items, setItems] = useState<Interaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const res = await api.owner.interactions({ limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(res.data);
        setCursor(res.meta.next_cursor);
        setHasMore(res.meta.has_more);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setActionError(null);
    try {
      const res = await api.owner.interactions({
        limit: PAGE_SIZE,
        cursor,
      });
      setItems((cur) => [...cur, ...res.data]);
      setCursor(res.meta.next_cursor);
      setHasMore(res.meta.has_more);
    } catch {
      setActionError(tc("error"));
    } finally {
      setLoadingMore(false);
    }
  };

  const resolve = async (id: string) => {
    if (resolving.has(id)) return;
    setResolving((prev) => new Set(prev).add(id));
    setActionError(null);
    // Optimistic, and it stays that way: the endpoint answers 204 with no
    // body. Per D-033 `status` is the only field resolving can change, so the
    // local flip below is the whole truth — there is nothing to read back.
    setItems((cur) =>
      cur.map((i) => (i.id === id ? { ...i, status: "resolved" as const } : i))
    );
    try {
      await api.owner.resolveInteraction(id);
    } catch {
      // Revert on failure.
      setItems((cur) =>
        cur.map((i) => (i.id === id ? { ...i, status: "new" as const } : i))
      );
      setActionError(t("interactions.resolveError"));
    } finally {
      setResolving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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
          onRetry={() => setAttempt((n) => n + 1)}
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
              {actionError}
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

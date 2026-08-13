"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { entityLabel } from "@/lib/api/endpoints";
import { useApi, useHref } from "@/lib/app-env";
import type { Entity, QrCode, QrStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  EmptyState,
  ErrorCard,
  IconBubble,
  IconCar,
  IconChevronRight,
  IconQr,
} from "@/components/dashboard/bits";
import { formatRelativeTime, qrBadgeTone } from "@/components/dashboard/format";

export function QrListView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <QrList />
    </DashboardShell>
  );
}

function QrList() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const api = useApi();
  const href = useHref();

  const [items, setItems] = useState<QrCode[]>([]);
  const [entities, setEntities] = useState<Record<string, Entity>>({});
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        // Entities are optional context (titles); don't fail the page on them.
        const [qrRes, entRes] = await Promise.allSettled([
          api.qr.list(),
          api.entities.listAll(),
        ]);
        if (cancelled) return;
        if (qrRes.status === "rejected") {
          setError(true);
          return;
        }
        setItems(qrRes.value.data);
        setCursor(qrRes.value.meta.next_cursor);
        setHasMore(qrRes.value.meta.has_more);
        if (entRes.status === "fulfilled") {
          setEntities(Object.fromEntries(entRes.value.map((e) => [e.id, e])));
        }
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
      const res = await api.qr.list(cursor);
      setItems((cur) => [...cur, ...res.data]);
      setCursor(res.meta.next_cursor);
      setHasMore(res.meta.has_more);
    } catch {
      setActionError(tc("error"));
    } finally {
      setLoadingMore(false);
    }
  };

  const togglePause = async (qr: QrCode) => {
    if (busyId) return;
    const pausing = qr.status === "activated";
    const prevStatus: QrStatus = qr.status;
    setBusyId(qr.id);
    setActionError(null);
    // Optimistic status flip.
    setItems((cur) =>
      cur.map((i) =>
        i.id === qr.id
          ? { ...i, status: (pausing ? "paused" : "activated") as QrStatus }
          : i
      )
    );
    try {
      const { qr_code } = pausing
        ? await api.qr.pause(qr.id)
        : await api.qr.resume(qr.id);
      setItems((cur) => cur.map((i) => (i.id === qr.id ? qr_code : i)));
    } catch {
      setItems((cur) =>
        cur.map((i) => (i.id === qr.id ? { ...i, status: prevStatus } : i))
      );
      setActionError(t("qrList.actionError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">
          {t("qrList.title")}
        </h1>
        <p className="mt-1 text-[13px] text-muted-2">{t("qrList.subtitle")}</p>
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
          icon={<IconQr className="size-6" />}
          title={t("qrList.empty")}
          hint={t("qrList.emptyHint")}
          cta={
            <Link href={href("/activate")}>
              <Button variant="accent" size="sm">
                {t("qrList.emptyCta")}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {actionError && (
            <p className="rounded-(--radius-btn) border border-danger/30 bg-danger/10 px-4 py-2.5 text-[13px] text-danger">
              {actionError}
            </p>
          )}

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((qr) => {
              const entity = qr.entity_id ? entities[qr.entity_id] : undefined;
              const canPause = qr.status === "activated";
              const canResume = qr.status === "paused";
              return (
                <li key={qr.id} className="flex">
                  <Card className="flex w-full flex-col gap-4">
                    <Link
                      href={href(`/dashboard/qr/${qr.id}`)}
                      className="group flex items-center gap-3"
                    >
                      <IconBubble
                        tone={
                          qr.status === "activated"
                            ? "accent"
                            : qr.status === "paused"
                              ? "warn"
                              : "muted"
                        }
                      >
                        <IconQr />
                      </IconBubble>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-mono text-[15px] font-semibold tracking-wide">
                            {qr.code}
                          </span>
                          <Badge tone={qrBadgeTone(qr.status)}>
                            {t(`qrStatus.${qr.status}`)}
                          </Badge>
                        </div>
                        {entity && (
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
                            <IconCar className="size-4 shrink-0" />
                            <span className="truncate">
                              {entityLabel(entity)}
                            </span>
                          </p>
                        )}
                        <p className="mt-0.5 text-[12px] text-muted-2">
                          {t("qrList.scans", { count: qr.scan_count })}
                          {" · "}
                          {qr.last_scan_at
                            ? t("qrList.lastScan", {
                                time: formatRelativeTime(
                                  qr.last_scan_at,
                                  t,
                                  locale
                                ),
                              })
                            : t("qrList.noScans")}
                        </p>
                      </div>
                      <IconChevronRight className="size-5 shrink-0 text-muted-2 transition-colors group-hover:text-white" />
                    </Link>

                    {(canPause || canResume) && (
                      <div className="mt-auto flex justify-end border-t border-card-border pt-3">
                        <Button
                          variant={canPause ? "ghost" : "accent"}
                          size="sm"
                          loading={busyId === qr.id}
                          onClick={() => togglePause(qr)}
                        >
                          {canPause ? t("qrList.pause") : t("qrList.resume")}
                        </Button>
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <Button
              variant="secondary"
              onClick={loadMore}
              loading={loadingMore}
              className="mx-auto w-full sm:w-auto sm:min-w-56"
            >
              {t("qrList.loadMore")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

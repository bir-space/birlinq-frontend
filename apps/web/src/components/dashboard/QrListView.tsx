"use client";

import { type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { entityLabel } from "@birlinq/api";
import { useHref } from "@birlinq/platform";
import { useQrList } from "@birlinq/core";
import type { QrCode } from "@birlinq/api";
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
  const href = useHref();

  const {
    items,
    entities,
    loading,
    error,
    hasMore,
    loadingMore,
    busyId,
    actionError,
    retry,
    loadMore,
    togglePause,
  } = useQrList();

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
          onRetry={retry}
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
              {actionError === "toggle" ? t("qrList.actionError") : tc("error")}
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

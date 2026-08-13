"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useApi, useHref } from "@/lib/app-env";
import type { Interaction, OwnerDashboard } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/use-auth";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  EmptyState,
  ErrorCard,
  IconBubble,
  IconChat,
  IconChevronRight,
  IconPlus,
  IconQr,
} from "@/components/dashboard/bits";
import {
  formatRelativeTime,
  interactionBadgeTone,
  scenarioLabel,
} from "@/components/dashboard/format";

export function OverviewView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <Overview />
    </DashboardShell>
  );
}

function Overview() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();
  const api = useApi();
  const href = useHref();

  /** Counts we can always derive from GET /qr. */
  const [qrStats, setQrStats] = useState<{
    total: number;
    active: number;
    scans: number;
  } | null>(null);
  /** Analytics from /owner/dashboard — not implemented on the backend yet. */
  const [stats, setStats] = useState<OwnerDashboard | null>(null);
  const [latest, setLatest] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const codes = await api.qr.listAll();
        if (cancelled) return;
        setQrStats({
          total: codes.length,
          active: codes.filter((q) => q.status === "activated").length,
          scans: codes.reduce((sum, q) => sum + q.scan_count, 0),
        });
      } catch {
        if (!cancelled) setError(true);
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Analytics and interactions are optional: the endpoints answer 404
      // until the backend ships them, and the page must still render.
      const [dash, inter] = await Promise.allSettled([
        api.owner.dashboard(),
        api.owner.interactions({ limit: 5 }),
      ]);
      if (cancelled) return;
      if (dash.status === "fulfilled") setStats(dash.value);
      if (inter.status === "fulfilled") setLatest(inter.value.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">
          {t("overview.greeting", { name: user?.name ?? "" })}
        </h1>
        <p className="mt-1 text-[13px] text-muted-2">{t("overview.subtitle")}</p>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error || !qrStats ? (
        <ErrorCard
          message={tc("error")}
          retryLabel={tc("retry")}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label={t("overview.stats.activeQr")}
              value={stats?.active_qrs ?? qrStats.active}
              sub={t("overview.stats.ofTotal", {
                total: stats?.total_qrs ?? qrStats.total,
              })}
              tone="accent"
            />
            {stats ? (
              <StatCard
                label={t("overview.stats.scans7d")}
                value={stats.scans_7d}
                sub={t("overview.stats.scans30d", { count: stats.scans_30d })}
              />
            ) : (
              <StatCard
                label={t("overview.stats.totalScans")}
                value={qrStats.scans}
              />
            )}
            {stats && (
              <>
                <StatCard
                  label={t("overview.stats.submissions7d")}
                  value={stats.submissions_7d}
                />
                <StatCard
                  label={t("overview.stats.unresolved")}
                  value={stats.unresolved_interactions}
                  dot={stats.unresolved_interactions > 0}
                />
              </>
            )}
          </div>

          {/* On the full-width track these two sit side by side from lg up,
              so the page doesn't become one long stretched column. */}
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            {/* Latest interactions */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold">
                  {t("overview.latest.title")}
                </h2>
                <Link
                  href={href("/dashboard/interactions")}
                  className="text-[13px] font-semibold text-accent transition-colors hover:text-white"
                >
                  {t("overview.latest.all")} →
                </Link>
              </div>
              {latest.length === 0 ? (
                <EmptyState
                  icon={<IconChat className="size-6" />}
                  title={t("overview.latest.empty")}
                  hint={t("overview.latest.emptyHint")}
                />
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {latest.map((item) => (
                    <li key={item.id}>
                      <Link href={href("/dashboard/interactions")} className="block">
                        <Card className="flex items-center gap-3 !p-4 transition-colors hover:border-line">
                          <IconBubble
                            tone={item.status === "new" ? "warn" : "muted"}
                          >
                            <IconChat />
                          </IconBubble>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[14px] font-semibold">
                                {scenarioLabel(item.scenario_code, t)}
                              </span>
                              {item.status !== "resolved" && (
                                <Badge tone={interactionBadgeTone[item.status]}>
                                  {t(`interactionStatus.${item.status}`)}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[13px] text-muted">
                              {item.message}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-2">
                            {formatRelativeTime(item.created_at, t, locale)}
                          </span>
                        </Card>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Quick links */}
            <section>
              <h2 className="mb-3 text-[15px] font-bold">
                {t("overview.quick.title")}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <QuickLink
                  href={href("/dashboard/qr")}
                  icon={<IconQr />}
                  title={t("overview.quick.qrTitle")}
                  hint={t("overview.quick.qrHint")}
                />
                <QuickLink
                  href={href("/activate")}
                  icon={<IconPlus className="size-5" />}
                  title={t("overview.quick.activateTitle")}
                  hint={t("overview.quick.activateHint")}
                />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = "default",
  dot = false,
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "default" | "accent";
  dot?: boolean;
}) {
  const toneCls =
    tone === "accent"
      ? "border-accent/30 bg-accent/10"
      : "border-card-border bg-card";
  return (
    <div className={`relative rounded-(--radius-card) border p-4 ${toneCls}`}>
      {dot && (
        <span className="absolute right-3.5 top-3.5 size-2 rounded-full bg-danger" />
      )}
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-2">
        {label}
      </p>
      <p
        className={`mt-1 text-[28px] font-bold leading-none ${
          tone === "accent" ? "text-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11px] text-muted-2">{sub}</p>}
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
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link href={href} className="block">
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

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IconCheck } from "@/components/dashboard/bits";

export function PricingView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <Pricing />
    </DashboardShell>
  );
}

/** Keys under `cards.pricing.plans`, in display order. */
const PLANS = ["free", "pro", "corporate"] as const;
type Plan = (typeof PLANS)[number];

const FEATURES = ["f1", "f2", "f3", "f4"] as const;

/**
 * Static plans. There is no billing yet (plan decision I): every account is
 * on Free, the paid tiers carry a "soon" badge, and their button leads to
 * the landing's lead form rather than to a checkout that does not exist.
 */
function Pricing() {
  const t = useTranslations("cards.pricing");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 max-w-xl text-[13px] text-muted-2">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan} plan={plan} />
        ))}
      </div>

      <p className="text-[13px] text-muted-2">{t("note")}</p>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const t = useTranslations("cards.pricing");
  const isFree = plan === "free";

  return (
    <Card
      className={`flex flex-col gap-5 ${plan === "pro" ? "border-accent/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-muted">
            {t(`plans.${plan}.name`)}
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none tracking-tight">
            {t(`plans.${plan}.price`)}
          </p>
          <p className="mt-1.5 text-[12px] text-muted-2">
            {isFree ? t("free") : t("perMonth")}
          </p>
        </div>
        <Badge tone={isFree ? "muted" : "accent"}>
          {isFree ? t("current") : t("soon")}
        </Badge>
      </div>

      <ul className="flex flex-col gap-2.5">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[14px] text-muted">
            <IconCheck className="mt-0.5 size-4 shrink-0 text-accent" />
            {t(`plans.${plan}.${f}`)}
          </li>
        ))}
      </ul>

      {!isFree && (
        <Link
          href="/#lead"
          className="mt-auto inline-flex h-9 items-center justify-center rounded-(--radius-btn) bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2f68d8]"
        >
          {t("cta")}
        </Link>
      )}
    </Card>
  );
}

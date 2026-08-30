"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePush } from "@/lib/push";

/**
 * Owner-facing control for web push (backend D-034).
 *
 * Most of this component is instructions rather than controls, and that is the
 * point: on iOS a push subscription is impossible until the site is installed
 * to the Home Screen, and Apple gives no prompt saying so. Showing a button
 * that cannot work is worse than explaining why it is not there yet.
 */
export function NotificationsCard() {
  const t = useTranslations("dashboard.notifications");
  const { state, platform, busy, failed, enable, disable } = usePush();

  // A missing VAPID key is a deployment gap; nothing useful to say to an owner.
  if (state === "loading" || state === "unconfigured") return null;

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">{t("title")}</h2>
            <p className="mt-1 text-[13px] text-muted-2">{t("subtitle")}</p>
          </div>

          {state === "on" && (
            <Button variant="secondary" size="sm" onClick={disable} loading={busy}>
              {t("disable")}
            </Button>
          )}
          {state === "off" && (
            <Button variant="accent" size="sm" onClick={enable} loading={busy}>
              {busy ? t("enabling") : t("enable")}
            </Button>
          )}
        </div>

        {state === "on" && (
          <p className="text-[13px] text-success">{t("enabled")}</p>
        )}

        {state === "off" && (
          <p className="text-[13px] text-muted-2">
            {platform === "android"
              ? t("androidHint")
              : platform === "ios"
                ? t("iosStep4")
                : t("desktopHint")}
          </p>
        )}

        {state === "needs-install" && <IosInstallSteps />}

        {state === "denied" && (
          <div className="rounded-(--radius-btn) border border-warn/30 bg-warn/15 p-3">
            <p className="text-[13px] font-medium text-warn">
              {t("blockedTitle")}
            </p>
            <p className="mt-1 text-[13px] text-muted-2">
              {platform === "ios"
                ? t("blockedIos")
                : platform === "android"
                  ? t("blockedAndroid")
                  : t("blockedDesktop")}
            </p>
          </div>
        )}

        {state === "unsupported" && (
          <p className="text-[13px] text-muted-2">{t("unsupported")}</p>
        )}

        {failed && <p className="text-[13px] text-danger">{t("error")}</p>}

        <p className="text-[12px] text-muted">{t("emailNote")}</p>
      </div>
    </Card>
  );
}

function IosInstallSteps() {
  const t = useTranslations("dashboard.notifications");

  return (
    <div className="rounded-(--radius-btn) border border-card-border bg-ink-soft p-3">
      <p className="text-[13px] font-medium">{t("iosInstallTitle")}</p>
      <ol className="mt-2 flex list-inside list-decimal flex-col gap-1 text-[13px] text-muted-2">
        <li>{t("iosStep1")}</li>
        <li>{t("iosStep2")}</li>
        <li>{t("iosStep3")}</li>
        <li>{t("iosStep4")}</li>
      </ol>
      <p className="mt-2 text-[12px] text-muted">{t("iosInstallHint")}</p>
    </div>
  );
}

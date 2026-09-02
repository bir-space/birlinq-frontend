"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PushInstructions } from "@/components/public/PushInstructions";
import { usePush } from "@/lib/push";

/**
 * Owner-facing control for web push (backend D-034, FE-009).
 *
 * Often there is no button to show, and that is the interesting part. On iOS
 * the Push API does not exist until the site is on the Home Screen, and Apple
 * offers no way to trigger that from a page — so the card carries the manual
 * steps instead of a control that could not work. Inside another app's
 * WebView the answer is "open it in the browser"; on an old iPhone it is
 * "update iOS". Each gets its own text rather than a shared shrug.
 *
 * The card is never blank once the VAPID key exists: an empty space is what
 * made "no notifications on phones" indistinguishable from a stale deploy.
 */
export function NotificationsCard() {
  const t = useTranslations("dashboard.notifications");
  const { state, platform, standalone, busy, failed, enable, disable } =
    usePush();

  // A missing VAPID key is a deployment gap; nothing useful to say to an owner.
  if (state === "unconfigured") return null;

  const offHint =
    platform === "android"
      ? t("androidHint")
      : platform === "ios"
        ? t("iosHint")
        : t("desktopHint");

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

        {state === "loading" && (
          <p className="flex items-center gap-2 text-[13px] text-muted-2">
            <Spinner className="size-4" />
            {t("checking")}
          </p>
        )}

        {state === "on" && (
          <p className="text-[13px] text-success">{t("enabled")}</p>
        )}

        {state === "off" && <p className="text-[13px] text-muted-2">{offHint}</p>}

        {state === "needs-install" && <PushInstructions platform="ios" />}

        {state === "in-app" && (
          <p className="text-[13px] text-muted-2">
            {platform === "ios" ? t("inAppIos") : t("inAppAndroid")}
          </p>
        )}

        {state === "ios-outdated" && (
          <p className="text-[13px] text-muted-2">{t("iosOutdated")}</p>
        )}

        {state === "insecure" && (
          <p className="text-[13px] text-muted-2">{t("insecure")}</p>
        )}

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

        {/* A phone has no console. Dev builds say which branch it landed in. */}
        {process.env.NODE_ENV !== "production" && (
          <p className="font-mono text-[11px] text-muted">
            push: {state} · {platform} · standalone={String(standalone)}
          </p>
        )}
      </div>
    </Card>
  );
}

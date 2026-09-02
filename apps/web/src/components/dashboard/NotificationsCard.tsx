"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PushInstructions } from "@/components/public/PushInstructions";
import { usePush, type UsePush } from "@/lib/push";

/**
 * Owner-facing control for web push (backend D-034, FE-009).
 *
 * Three scenarios, chosen by device, because the honest answer to "how do I
 * turn this on?" is different on each:
 *
 *  - desktop: a button; notifications arrive while the browser runs
 *  - Android: a button; nothing to install, but not inside another app's WebView
 *  - iOS: no button in a Safari tab, ever — the card carries the manual
 *    "Add to Home Screen" steps, and the button appears inside that app
 *
 * The card is never blank once the VAPID key exists: an empty space is what
 * made "no notifications on phones" indistinguishable from a stale deploy.
 * The device badge in the header says which scenario rendered, so a screenshot
 * from a phone answers that question too.
 */
export function NotificationsCard() {
  const t = useTranslations("dashboard.notifications");
  const push = usePush();
  const { state, platform, standalone } = push;

  // A missing VAPID key is a deployment gap; nothing useful to say to an owner.
  if (state === "unconfigured") return null;

  const deviceLabel =
    platform === "ios"
      ? t("deviceIos")
      : platform === "android"
        ? t("deviceAndroid")
        : t("deviceDesktop");

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold">{t("title")}</h2>
              <Badge>{deviceLabel}</Badge>
            </div>
            <p className="mt-1 text-[13px] text-muted-2">{t("subtitle")}</p>
          </div>
          <Toggle push={push} />
        </div>

        {platform === "ios" ? (
          <IosScenario push={push} />
        ) : platform === "android" ? (
          <AndroidScenario push={push} />
        ) : (
          <DesktopScenario push={push} />
        )}

        {push.failed && <p className="text-[13px] text-danger">{t("error")}</p>}

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

/** The enable/disable control. Rendered only in the two states that have one. */
function Toggle({ push }: { push: UsePush }) {
  const t = useTranslations("dashboard.notifications");
  const { state, busy, enable, disable } = push;

  if (state === "on") {
    return (
      <Button variant="secondary" size="sm" onClick={disable} loading={busy}>
        {t("disable")}
      </Button>
    );
  }
  if (state === "off") {
    return (
      <Button variant="accent" size="sm" onClick={enable} loading={busy}>
        {busy ? t("enabling") : t("enable")}
      </Button>
    );
  }
  return null;
}

function DesktopScenario({ push }: { push: UsePush }) {
  const t = useTranslations("dashboard.notifications");

  switch (push.state) {
    case "loading":
      return <Checking />;
    case "off":
      return <Note>{t("desktopHint")}</Note>;
    case "on":
      return <p className="text-[13px] text-success">{t("enabled")}</p>;
    case "denied":
      return <Blocked>{t("blockedDesktop")}</Blocked>;
    case "insecure":
      return <Note>{t("insecure")}</Note>;
    default:
      return <Note>{t("unsupported")}</Note>;
  }
}

function AndroidScenario({ push }: { push: UsePush }) {
  const t = useTranslations("dashboard.notifications");

  switch (push.state) {
    case "loading":
      return <Checking />;
    case "off":
      return <Note>{t("androidHint")}</Note>;
    case "on":
      return <p className="text-[13px] text-success">{t("enabled")}</p>;
    case "denied":
      return <Blocked>{t("blockedAndroid")}</Blocked>;
    case "in-app":
      return (
        <>
          <Note>{t("inAppAndroid")}</Note>
          <GuideLink />
        </>
      );
    case "insecure":
      return <Note>{t("insecure")}</Note>;
    default:
      return (
        <>
          <Note>{t("unsupported")}</Note>
          <GuideLink />
        </>
      );
  }
}

/**
 * Two halves: a Safari tab, where the only content is the install steps, and
 * the Home Screen app, which behaves like a phone with a button.
 */
function IosScenario({ push }: { push: UsePush }) {
  const t = useTranslations("dashboard.notifications");

  switch (push.state) {
    case "needs-install":
      return (
        <>
          <PushInstructions platform="ios" />
          <GuideLink />
        </>
      );
    case "in-app":
      return (
        <>
          <Note>{t("inAppIos")}</Note>
          <GuideLink />
        </>
      );
    case "ios-outdated":
      return <Note>{t("iosOutdated")}</Note>;
    case "loading":
      return <Checking />;
    case "off":
      return <Note>{t("iosHint")}</Note>;
    case "on":
      return <p className="text-[13px] text-success">{t("enabled")}</p>;
    case "denied":
      return <Blocked>{t("blockedIos")}</Blocked>;
    case "insecure":
      return <Note>{t("insecure")}</Note>;
    default:
      return <Note>{t("unsupported")}</Note>;
  }
}

function Checking() {
  const t = useTranslations("dashboard.notifications");
  return (
    <p className="flex items-center gap-2 text-[13px] text-muted-2">
      <Spinner className="size-4" />
      {t("checking")}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-muted-2">{children}</p>;
}

function Blocked({ children }: { children: React.ReactNode }) {
  const t = useTranslations("dashboard.notifications");
  return (
    <div className="rounded-(--radius-btn) border border-warn/30 bg-warn/15 p-3">
      <p className="text-[13px] font-medium text-warn">{t("blockedTitle")}</p>
      <p className="mt-1 text-[13px] text-muted-2">{children}</p>
    </div>
  );
}

/** The same steps with a URL, so they can be sent to someone. */
function GuideLink() {
  const t = useTranslations("dashboard.notifications");
  return (
    <Link
      href="/guide#push"
      className="text-[13px] font-semibold text-accent hover:underline"
    >
      {t("installCta")} →
    </Link>
  );
}

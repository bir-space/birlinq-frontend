"use client";

import { useTranslations } from "next-intl";

/**
 * How to turn notifications on, per platform.
 *
 * iOS gets the long version because it needs one: Apple exposes no way to
 * trigger "Add to Home Screen" from a page — `beforeinstallprompt` is a
 * Chrome/Android API and Safari has no equivalent — so the only path is the
 * person doing it by hand. That makes the Share glyph the important part of
 * the instruction: people look for the icon, not for its name.
 *
 * Shared by the cabinet's notifications card and `/guide`, so the steps exist
 * once and there is a URL to send someone.
 */
export function PushInstructions({
  platform = "both",
}: {
  /** "both" is for the guide, where the reader's device is unknown. */
  platform?: "ios" | "android" | "both";
}) {
  return (
    <div className="flex flex-col gap-3">
      {(platform === "ios" || platform === "both") && <IosSteps />}
      {(platform === "android" || platform === "both") && <AndroidSteps />}
    </div>
  );
}

function IosSteps() {
  const t = useTranslations("guide.push");

  return (
    <div className="rounded-(--radius-card) border border-card-border bg-ink-soft p-4">
      <h3 className="text-[15px] font-semibold">{t("iosTitle")}</h3>
      <p className="mt-1 text-[13px] text-muted-2">{t("iosLead")}</p>

      <ol className="mt-3 flex flex-col gap-3">
        <Step n={1}>{t("iosStep1")}</Step>
        <Step n={2}>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {t("iosStep2")}
            <ShareIcon />
          </span>
        </Step>
        <Step n={3}>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {t("iosStep3")}
            <AddToHomeIcon />
          </span>
        </Step>
        <Step n={4}>{t("iosStep4")}</Step>
        <Step n={5}>{t("iosStep5")}</Step>
      </ol>

      <p className="mt-3 text-[12px] text-muted">{t("iosNote")}</p>
    </div>
  );
}

function AndroidSteps() {
  const t = useTranslations("guide.push");

  return (
    <div className="rounded-(--radius-card) border border-card-border bg-ink-soft p-4">
      <h3 className="text-[15px] font-semibold">{t("androidTitle")}</h3>
      <p className="mt-1 text-[13px] text-muted-2">{t("androidLead")}</p>

      <ol className="mt-3 flex flex-col gap-3">
        <Step n={1}>{t("androidStep1")}</Step>
        <Step n={2}>{t("androidStep2")}</Step>
      </ol>

      <p className="mt-3 text-[12px] text-muted">{t("androidNote")}</p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-[12px] font-semibold text-white">
        {n}
      </span>
      <span className="text-[13px] leading-relaxed text-muted-2">{children}</span>
    </li>
  );
}

/** The iOS Share glyph: a box with an arrow leaving the top. */
function ShareIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-card align-middle"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <path
          d="M12 3.5v11M12 3.5 8.5 7M12 3.5 15.5 7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 11H5.5v9h13v-9h-1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** "Add to Home Screen": a plus inside a rounded square. */
function AddToHomeIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-card align-middle"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M12 8.5v7M8.5 12h7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

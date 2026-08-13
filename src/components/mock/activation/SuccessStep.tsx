"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";

/** A5 — activation success screen (mock: links stay within /mock). */
export function SuccessStep() {
  const t = useTranslations("activation.success");

  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-accent/15">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent text-ink-900">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>

      <h1 className="mt-6 text-[26px] font-bold">{t("title")}</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
        {t("subtitle")}
      </p>

      <Card className="mt-8 w-full text-left">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 9l2-4h12l2 4M4 9h16M4 9v9a1 1 0 001 1h14a1 1 0 001-1V9"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="7.5"
                y="12"
                width="6"
                height="4"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>
          </span>
          <div className="text-[13px] leading-snug">
            <p className="font-semibold text-white">{t("whereTitle")}</p>
            <p className="mt-1 text-muted">{t("whereText")}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-3 w-full text-left">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warn/15 text-warn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 8a1 1 0 011-1h2l1.5-2h7L17 7h2a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <div className="text-[13px] leading-snug">
            <p className="font-semibold text-white">{t("checkTitle")}</p>
            <p className="mt-1 text-muted">{t("checkText")}</p>
          </div>
        </div>
      </Card>

      <Link
        href="/mock/dashboard"
        className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
      >
        {t("dashboard")}
      </Link>
      <Link
        href="/mock"
        className="mt-4 text-sm text-muted underline-offset-4 hover:text-white hover:underline"
      >
        {t("skip")}
      </Link>
    </div>
  );
}

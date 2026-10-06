"use client";

import { useTranslations } from "next-intl";
import { Toggle } from "@/components/dashboard/bits";
import { Section, type SectionProps } from "./shared";

/**
 * Published or hidden — one switch over `status`. A card held by
 * moderation (`blocked`, D-042) cannot be published by its owner, so the
 * switch gives way to an explanation instead of a 409 after every tap.
 */
export function PublishSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const blocked = entity.status === "blocked";
  const published = entity.status === "active";

  const error =
    feedback === "error"
      ? card.actionError === "blocked"
        ? t("edit.blocked")
        : card.actionError === "rateLimited"
          ? t("edit.rateLimited")
          : t("publish.error")
      : null;

  return (
    <Section id="publish" title={t("sections.publish")} hint={t("publish.hint")}>
      {blocked ? (
        <div className="rounded-(--radius-btn) border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-[14px] font-semibold text-danger">
            {t("publish.blockedTitle")}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {t("publish.blockedText")}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">
              {published ? t("publish.on") : t("publish.off")}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-2">
              {published ? t("publish.onHint") : t("publish.offHint")}
            </p>
          </div>
          <span className="flex items-center gap-2">
            {card.busy === "publish" && (
              <span
                className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-accent"
                aria-hidden="true"
              />
            )}
            <Toggle
              checked={published}
              disabled={card.busy !== null}
              onToggle={() => {
                void run(() => card.setPublished(!published));
              }}
              label={t("publish.label")}
            />
          </span>
        </div>
      )}
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </Section>
  );
}

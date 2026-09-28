"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useHref } from "@birlinq/platform";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Section, type SectionProps } from "./shared";

/** Delete the card — after a confirmation, then back to the list. */
export function DangerSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const router = useRouter();
  const href = useHref();
  const [open, setOpen] = useState(false);
  const blocked = entity.status === "blocked";

  const confirm = async () => {
    const ok = await run(() => card.remove());
    if (ok) router.replace(href("/dashboard/cards"));
  };

  const error =
    feedback === "error"
      ? card.actionError === "blocked"
        ? t("danger.blocked")
        : card.actionError === "rateLimited"
          ? t("edit.rateLimited")
          : t("danger.error")
      : null;

  return (
    <Section id="danger" danger title={t("sections.danger")} hint={t("danger.hint")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold">{t("danger.deleteTitle")}</p>
          <p className="mt-0.5 text-[12px] text-muted-2">
            {blocked ? t("danger.blocked") : t("danger.deleteHint")}
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          disabled={blocked || card.busy !== null}
          onClick={() => setOpen(true)}
        >
          {t("danger.delete")}
        </Button>
      </div>
      {!open && error && <p className="text-[13px] text-danger">{error}</p>}

      {open && (
        <ConfirmModal
          title={t("danger.confirmTitle")}
          text={t("danger.confirmText")}
          confirmLabel={t("danger.confirm")}
          cancelLabel={tc("cancel")}
          onConfirm={confirm}
          onClose={() => setOpen(false)}
          loading={card.busy === "remove"}
          danger
          error={error}
        />
      )}
    </Section>
  );
}

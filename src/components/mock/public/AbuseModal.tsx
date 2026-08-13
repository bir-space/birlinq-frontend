"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { mockPublicApi as publicApi } from "@/lib/mock/mock-endpoints";
import { ApiRequestError } from "@/lib/api/client";
import type { AbuseReason } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { IconCheck, IconFlag } from "./icons";

const REASONS: AbuseReason[] = ["spam", "harassment", "impersonation", "other"];

/**
 * Abuse report modal: reason radio group + optional note →
 * publicApi.reportAbuse. Closes on backdrop click / Escape.
 */
export function AbuseModal({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const t = useTranslations("public");
  const [reason, setReason] = useState<AbuseReason>("spam");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await publicApi.reportAbuse(code, {
        reason,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setDone(true);
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        (err.status === 429 || err.code === "RATE_LIMITED")
      ) {
        setError(t("scenario.rateLimited"));
      } else {
        setError(t("errors.genericText"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("abuse.title")}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="rounded-(--radius-panel) p-6">
          {done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-accent/15">
                <div className="flex size-9 items-center justify-center rounded-full bg-accent text-ink-900">
                  <IconCheck className="size-5" strokeWidth={2.4} />
                </div>
              </div>
              <p className="mt-4 text-[16px] font-bold">
                {t("abuse.successTitle")}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {t("abuse.successText")}
              </p>
              <Button className="mt-5 w-full" onClick={onClose}>
                {t("abuse.close")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex items-center gap-2.5">
                <IconFlag className="size-5 shrink-0 text-danger" />
                <h2 className="text-[17px] font-bold">{t("abuse.title")}</h2>
              </div>
              <p className="mt-1 text-[13px] text-muted">{t("abuse.text")}</p>

              <div
                role="radiogroup"
                aria-label={t("abuse.reasonLabel")}
                className="mt-4 flex flex-col gap-2"
              >
                {REASONS.map((r) => {
                  const selected = reason === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setReason(r)}
                      className={`flex cursor-pointer items-center gap-3 rounded-(--radius-btn) border p-3.5 text-left text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        selected
                          ? "border-accent bg-accent/10 text-white"
                          : "border-card-border bg-ink-soft text-muted hover:border-line hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                          selected ? "border-accent" : "border-muted-2"
                        }`}
                        aria-hidden
                      >
                        {selected && (
                          <span className="size-2 rounded-full bg-accent" />
                        )}
                      </span>
                      {t(`abuse.reasons.${r}`)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <Textarea
                  label={t("abuse.noteLabel")}
                  placeholder={t("abuse.notePlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  maxLength={500}
                  className="min-h-24"
                  error={error}
                />
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  type="submit"
                  variant="danger"
                  className="w-full"
                  loading={submitting}
                >
                  {t("abuse.submit")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onClose}
                >
                  {t("abuse.cancel")}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

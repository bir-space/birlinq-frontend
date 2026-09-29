"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Entity } from "@birlinq/api";
import type { CardActionError, UseCard } from "@birlinq/core";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/dashboard/bits";

/** The sections of the card editor, in page order; also the `id` of each `<section>`. */
export const SECTION_KEYS = [
  "profile",
  "images",
  "contacts",
  "socials",
  "tags",
  "theme",
  "privacy",
  "alias",
  "publish",
  "qr",
  "stats",
  "danger",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** What a section shows next to its button after its last write. */
export type SectionFeedback = "saved" | "error" | null;

/**
 * What every writing section receives. `useCard` has one `busy` and one
 * `actionError` for the whole page; `run` tags a write with the section that
 * made it, so only that section shows the outcome and the others stay quiet.
 */
export interface SectionProps {
  card: UseCard;
  /** Never null here — the editor renders sections only once it is loaded. */
  entity: Entity;
  feedback: SectionFeedback;
  run: (write: () => Promise<boolean>) => Promise<boolean>;
}

/** `""` → null, else the trimmed text — the shape PUT /contact wants for a cleared field. */
export function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** The one message for a failed write, from the hook's code. Field messages are shown by the inputs. */
export function useWriteError(): (error: CardActionError) => string {
  const t = useTranslations("cards");
  return (error) => {
    switch (error) {
      case "validation":
        return t("errors.validation");
      case "blocked":
        return t("edit.blocked");
      case "aliasTaken":
        return t("alias.errors.taken");
      case "rateLimited":
        return t("edit.rateLimited");
      default:
        return t("edit.saveError");
    }
  };
}

/** Which alias write failed: an address the owner typed, or one the server made. */
export type AliasWriteKind = "save" | "generate";

/**
 * The message for a failed alias write — shared by the alias section and
 * the QR section's "open the link" button, which generate through the same
 * hook call. A 422 carries the server's own words for the field. A taken
 * address is only worth saying about one the owner chose; a generated one
 * was never theirs, so a 409 there is just a failed attempt.
 */
export function useAliasError(): (
  card: UseCard,
  kind: AliasWriteKind
) => string {
  const t = useTranslations("cards");
  return (card, kind) => {
    switch (card.actionError) {
      case "aliasTaken":
        return kind === "generate"
          ? t("alias.errors.generic")
          : t("alias.errors.taken");
      case "blocked":
        return t("alias.errors.blocked");
      case "validation":
        return card.fieldErrors.alias ?? t("alias.errors.invalid");
      case "rateLimited":
        return t("edit.rateLimited");
      default:
        return t("alias.errors.generic");
    }
  };
}

/** Label + card, anchored by its key so a `#qr` link from the list lands here. */
export function Section({
  id,
  title,
  hint,
  danger = false,
  children,
}: {
  id: SectionKey;
  title: string;
  hint?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-40 lg:scroll-mt-24">
      <SectionLabel>
        {danger ? <span className="text-danger">{title}</span> : title}
      </SectionLabel>
      <Card className={`flex flex-col gap-4 ${danger ? "border-danger/30" : ""}`}>
        {hint && <p className="text-[13px] text-muted-2">{hint}</p>}
        {children}
      </Card>
    </section>
  );
}

/**
 * The save button with its inline outcome, the way `QrDetailView` does it:
 * "Сохранено" in accent after a success, the failure in red, nothing while
 * the form has been edited since.
 */
export function SaveRow({
  label,
  loading,
  disabled = false,
  feedback,
  savedMessage,
  errorMessage,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
  feedback: SectionFeedback;
  savedMessage: string;
  errorMessage: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" size="sm" loading={loading} disabled={disabled}>
        {label}
      </Button>
      {feedback === "saved" && (
        <span className="text-[13px] font-medium text-accent">
          {savedMessage}
        </span>
      )}
      {feedback === "error" && errorMessage && (
        <span className="text-[13px] text-danger">{errorMessage}</span>
      )}
    </div>
  );
}

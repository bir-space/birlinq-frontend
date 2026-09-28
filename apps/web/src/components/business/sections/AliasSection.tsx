"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { cardUrl } from "@/lib/public-url";
import { copyText } from "@/lib/share";
import { Button } from "@/components/ui/Button";
import {
  AliasInput,
  aliasIssue,
  trimAliasDashes,
} from "@/components/forms/AliasInput";
import { IconCopy } from "@/components/card/icons";
import { Section, type SectionProps } from "./shared";

const COPIED_MS = 2200;

/**
 * The public link `/p/{alias}`. Saving a slug opens or moves the link,
 * "close" sends `alias: null` (D-040). A move is warned about before the
 * button: the old address stops working at once, and a printed QR with it.
 */
export function AliasSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards.alias");
  const tEdit = useTranslations("cards.edit");
  const [draft, setDraft] = useState(entity.alias ?? "");
  const [dirty, setDirty] = useState(false);
  // Typed since the last write: a server answer is about the value that was
  // sent, so it hides as soon as the owner edits and the local hints return.
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState<"save" | "close" | null>(null);
  // Built on the client only — `appOrigin()` is empty on the server.
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty) setDraft(entity.alias ?? "");
  }, [entity.alias, dirty]);

  useEffect(() => {
    setUrl(entity.alias ? cardUrl(entity.alias) : null);
  }, [entity.alias]);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const issue = aliasIssue(draft);
  const changed = draft !== (entity.alias ?? "");
  const canSave = draft !== "" && issue === null && changed;
  const busyElsewhere = card.busy !== null && saving === null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;
    const alias = trimAliasDashes(draft);
    if (alias !== draft) setDraft(alias);
    if (alias === "") return;
    setEdited(false);
    setSaving("save");
    const ok = await run(() => card.saveAlias(alias));
    if (ok) setDirty(false);
    setSaving(null);
  };

  const close = async () => {
    if (saving) return;
    setEdited(false);
    setSaving("close");
    const ok = await run(() => card.saveAlias(null));
    if (ok) setDirty(false);
    setSaving(null);
  };

  const copy = async () => {
    if (!url) return;
    const ok = await copyText(url);
    if (!ok) return;
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const failed = feedback === "error";
  const serverError = failed
    ? card.actionError === "aliasTaken"
      ? t("errors.taken")
      : card.actionError === "blocked"
        ? t("errors.blocked")
        : card.actionError === "validation"
          ? (card.fieldErrors.alias ?? t("errors.invalid"))
          : card.actionError === "rateLimited"
            ? tEdit("rateLimited")
            : t("errors.generic")
    : null;

  return (
    <Section id="alias" title={t("label")} hint={t("hint")}>
      {entity.alias && url ? (
        <div className="rounded-(--radius-btn) border border-card-border bg-ink-soft px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-2">
            {t("current")}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 break-all font-mono text-[13px] text-accent underline-offset-2 hover:underline"
            >
              {url}
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copy}
              className="-my-1 shrink-0"
            >
              <IconCopy className="size-4" />
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-(--radius-btn) border border-warn/30 bg-warn/10 px-4 py-3">
          <p className="text-[14px] font-semibold text-warn">{t("closed")}</p>
          <p className="mt-0.5 text-[13px] text-muted">{t("closedHint")}</p>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <AliasInput
          value={draft}
          onChange={(alias) => {
            setDraft(alias);
            setDirty(true);
            setEdited(true);
          }}
          error={edited ? null : serverError}
          disabled={busyElsewhere}
        />

        {entity.alias && changed && draft !== "" && issue === null && (
          <p className="rounded-(--radius-btn) border border-warn/30 bg-warn/10 px-4 py-2.5 text-[13px] text-warn">
            {t("changeWarning")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="sm"
            loading={saving === "save"}
            disabled={!canSave || busyElsewhere}
          >
            {entity.alias ? t("save") : t("reopen")}
          </Button>
          {entity.alias && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={saving === "close"}
              disabled={busyElsewhere}
              onClick={close}
            >
              {t("close")}
            </Button>
          )}
          {feedback === "saved" && !dirty && (
            <span className="text-[13px] font-medium text-accent">
              {t("saved")}
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

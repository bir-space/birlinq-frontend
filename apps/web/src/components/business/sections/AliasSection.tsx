"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { cardUrl } from "@/lib/public-url";
import { copyText } from "@/lib/share";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  AliasInput,
  aliasIssue,
  trimAliasDashes,
} from "@/components/forms/AliasInput";
import { IconCopy } from "@/components/card/icons";
import { Section, useAliasError, type SectionProps } from "./shared";

const COPIED_MS = 2200;

type AliasWrite = "save" | "close" | "generate";

/**
 * The public link `/p/{alias}`. The owner never has to invent it: a closed
 * link opens with one tap, which asks the server for an alias by the
 * creation rule (POST …/alias), and an open one can be regenerated the same
 * way — behind a confirmation, because the old address stops working at
 * once, and a printed QR with it. Typing an address of one's own stays the
 * secondary path (PATCH with `alias`); "close" sends `alias: null` (D-040).
 */
export function AliasSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards.alias");
  const tc = useTranslations("common");
  const aliasError = useAliasError();
  const [draft, setDraft] = useState(entity.alias ?? "");
  const [dirty, setDirty] = useState(false);
  // Typed since the last write: a server answer is about the value that was
  // sent, so it hides as soon as the owner edits and the local hints return.
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState<AliasWrite | null>(null);
  // Which write answered last — the outcome is shown in that write's words.
  const [lastWrite, setLastWrite] = useState<AliasWrite | null>(null);
  // While the link is closed the field is folded away — opening the link
  // needs no typing — and unfolds only on request.
  const [manual, setManual] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  const showField = entity.alias !== null || manual;

  const write = async (kind: AliasWrite, call: () => Promise<boolean>) => {
    if (saving) return false;
    setEdited(false);
    setSaving(kind);
    setLastWrite(kind);
    const ok = await run(call);
    if (ok) setDirty(false);
    setSaving(null);
    return ok;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;
    const alias = trimAliasDashes(draft);
    if (alias !== draft) setDraft(alias);
    if (alias === "") return;
    await write("save", () => card.saveAlias(alias));
  };

  const close = () => write("close", () => card.saveAlias(null));

  const generate = async () => {
    const ok = await write("generate", () => card.generateAlias());
    if (ok) {
      setManual(false);
      setConfirmOpen(false);
    }
  };

  const cancelManual = () => {
    setManual(false);
    setDraft("");
    setDirty(false);
    setEdited(false);
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
  const serverError = failed ? aliasError(card) : null;
  // A refused slug belongs under the field and goes away once the owner
  // edits; a failed close or generate sits by the buttons, or in the sheet
  // while it is the sheet's own action that failed.
  const fieldError = lastWrite === "save" && !edited ? serverError : null;
  const sheetError =
    confirmOpen && lastWrite === "generate" ? serverError : null;
  const rowError = lastWrite === "save" || sheetError ? null : serverError;
  const savedMessage =
    feedback === "saved" && !dirty
      ? lastWrite === "generate"
        ? t("generated")
        : t("saved")
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

      {!entity.alias && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="accent"
              loading={saving === "generate"}
              disabled={busyElsewhere}
              onClick={generate}
            >
              {t("generate")}
            </Button>
            {!manual && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyElsewhere}
                onClick={() => setManual(true)}
              >
                {t("custom")}
              </Button>
            )}
            {!showField && savedMessage && (
              <span className="text-[13px] font-medium text-accent">
                {savedMessage}
              </span>
            )}
            {!showField && rowError && (
              <span className="text-[13px] text-danger">{rowError}</span>
            )}
          </div>
          <p className="text-[12px] text-muted-2">{t("generateHint")}</p>
        </div>
      )}

      {showField && (
        <form
          onSubmit={submit}
          className={`flex flex-col gap-4 ${
            entity.alias ? "" : "border-t border-card-border pt-4"
          }`}
          noValidate
        >
          {!entity.alias && (
            <p className="text-[14px] font-semibold">{t("custom")}</p>
          )}
          <AliasInput
            value={draft}
            onChange={(alias) => {
              setDraft(alias);
              setDirty(true);
              setEdited(true);
            }}
            error={fieldError}
            disabled={busyElsewhere}
            autoFocus={manual && !entity.alias}
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
            {entity.alias ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busyElsewhere || saving !== null}
                  onClick={() => setConfirmOpen(true)}
                >
                  {t("regenerate")}
                </Button>
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
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyElsewhere || saving !== null}
                onClick={cancelManual}
              >
                {tc("cancel")}
              </Button>
            )}
            {savedMessage && (
              <span className="text-[13px] font-medium text-accent">
                {savedMessage}
              </span>
            )}
            {rowError && (
              <span className="text-[13px] text-danger">{rowError}</span>
            )}
          </div>
        </form>
      )}

      {confirmOpen && (
        <ConfirmModal
          title={t("regenerateTitle")}
          text={t("regenerateText")}
          confirmLabel={t("regenerateConfirm")}
          cancelLabel={tc("cancel")}
          onConfirm={generate}
          onClose={() => setConfirmOpen(false)}
          loading={saving === "generate"}
          error={sheetError}
        >
          <p className="rounded-(--radius-btn) border border-warn/30 bg-warn/10 px-4 py-2.5 text-[13px] text-warn">
            {t("changeWarning")}
          </p>
        </ConfirmModal>
      )}
    </Section>
  );
}

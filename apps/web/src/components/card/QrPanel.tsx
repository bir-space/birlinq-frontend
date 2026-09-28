"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ShareChannel } from "@birlinq/api";
import { qrPngDataUrl } from "@/lib/qr";
import { copyText, downloadDataUrl, shareOrCopy } from "@/lib/share";
import { Button } from "@/components/ui/Button";
import { QrImage } from "./QrImage";
import { IconCopy, IconDownload, IconShare } from "./icons";

type Notice = "copied" | "shareFailed" | "downloadFailed" | null;

const NOTICE_MS = 2200;

/*
 * Icon above the label: three cells of a phone-wide panel are too narrow for
 * "Скопировать ссылку" on one line, so the label wraps under the icon instead
 * of being truncated.
 */
const actionCls = "!h-auto flex-col !px-2 py-2.5";
const actionLabelCls = "text-center text-[12px] leading-tight";

/**
 * The QR of a link with the three things people do with it: copy the link,
 * share it, download a 512 px PNG. Used on the public QR page and in the
 * cabinet's QR section; button labels come from `card.qrPage`, the optional
 * `hint` line (print advice, etc.) is the caller's.
 *
 * `onShare` is how the public page tracks a share event — the panel itself
 * knows nothing about analytics.
 */
export function QrPanel({
  url,
  filename,
  alt,
  shareTitle,
  shareText,
  hint,
  onShare,
  className = "",
}: {
  /** What the code encodes and the buttons copy/share. */
  url: string;
  /** Name of the downloaded PNG, extension included. */
  filename: string;
  alt: string;
  shareTitle?: string;
  shareText?: string;
  hint?: ReactNode;
  onShare?: (channel: ShareChannel) => void;
  className?: string;
}) {
  const t = useTranslations("card");
  const [notice, setNotice] = useState<Notice>(null);
  const [downloading, setDownloading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const flash = (next: Notice) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice(next);
    if (next) timer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  };

  const handleCopy = async () => {
    const ok = await copyText(url);
    if (ok) {
      onShare?.("copy");
      flash("copied");
    } else {
      flash("shareFailed");
    }
  };

  const handleShare = async () => {
    const outcome = await shareOrCopy({
      title: shareTitle,
      text: shareText,
      url,
    });
    if (outcome === "shared") {
      onShare?.("native");
      flash(null);
    } else if (outcome === "copied") {
      onShare?.("copy");
      flash("copied");
    } else if (outcome === "failed") {
      flash("shareFailed");
    }
    // "cancelled" is the visitor closing the sheet — nothing to say.
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      downloadDataUrl(await qrPngDataUrl(url), filename);
    } catch {
      flash("downloadFailed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <QrImage text={url} alt={alt} />

      <div className="flex w-full flex-col items-center gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-2">
          {t("qrPage.linkLabel")}
        </span>
        <a
          href={url}
          className="max-w-full break-all text-center text-[13px] font-medium text-accent underline-offset-2 hover:underline"
        >
          {url}
        </a>
      </div>

      <div className="grid w-full grid-cols-3 gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className={actionCls}
        >
          <IconCopy className="size-4" />
          <span className={actionLabelCls}>{t("qrPage.copy")}</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className={actionCls}
        >
          <IconShare className="size-4" />
          <span className={actionLabelCls}>{t("qrPage.share")}</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          loading={downloading}
          className={actionCls}
        >
          {!downloading && <IconDownload className="size-4" />}
          <span className={actionLabelCls}>{t("qrPage.download")}</span>
        </Button>
      </div>

      <p
        aria-live="polite"
        className={`min-h-4 text-center text-[12px] ${
          notice === "copied" ? "text-accent" : "text-danger"
        }`}
      >
        {notice === "copied"
          ? t("qrPage.copied")
          : notice === "shareFailed"
            ? t("errors.shareFailed")
            : notice === "downloadFailed"
              ? t("errors.downloadFailed")
              : ""}
      </p>

      {hint && (
        <p className="text-center text-[12px] leading-relaxed text-muted-2">
          {hint}
        </p>
      )}
    </div>
  );
}

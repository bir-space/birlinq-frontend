"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { qrSvgDataUrl } from "@/lib/qr";
import { Spinner } from "@/components/ui/Spinner";

/**
 * A QR code for `text`, rendered as an `<img>` over an SVG data URL inside a
 * white rounded panel. Always dark on white whatever the theme around it —
 * a code has to scan from a phone screen and from paper alike. The size is
 * CSS: `className` sets the panel, the image fills it.
 */
export function QrImage({
  text,
  alt,
  className = "size-60",
}: {
  text: string;
  alt: string;
  className?: string;
}) {
  const t = useTranslations("card");
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    qrSvgDataUrl(text).then(
      (url) => {
        if (!cancelled) setSrc(url);
      },
      () => {
        if (!cancelled) setFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-(--radius-card) bg-white p-3 ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full" draggable={false} />
      ) : failed ? (
        <p className="px-4 text-center text-[12px] text-ink-900">
          {t("errors.qrFailed")}
        </p>
      ) : (
        <Spinner className="border-paper-border border-t-ink-900" />
      )}
    </div>
  );
}

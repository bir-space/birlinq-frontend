"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { LIMITS, type ContactImageKind } from "@birlinq/api";
import { Button } from "@/components/ui/Button";
import { IconImage, IconTrash, IconUpload } from "@/components/card/icons";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp";

/** Longest edge after the client-side downscale. */
export const MAX_EDGE = 2048;

type LocalError = "badType" | "tooLarge" | "read" | null;

/** The card's two images, or the account avatar (D-045) — the same control, its own copy. */
export type UploadKind = ContactImageKind | "avatar";

/**
 * A photo, cover or avatar picker. The file is checked and, when it is over
 * the upload limit or larger than 2048 px on a side, downscaled on a canvas
 * before `onUpload` sees it — a 12 MB phone photo becomes a ~1 MB JPEG
 * without the owner learning what a megabyte is. The server still
 * validates; this only spares the round trip.
 */
export function ImageUpload({
  kind,
  label,
  src,
  busy,
  disabled: disabledByPage = false,
  onUpload,
  onRemove,
  error = null,
}: {
  kind: UploadKind;
  label: string;
  /** The stored image, already passed through `imageSrc`. */
  src: string | null;
  /** This control's own write is in flight — shows the spinner. */
  busy: boolean;
  /** Another write on the page is in flight — pick, upload and remove wait, without a spinner. */
  disabled?: boolean;
  onUpload: (file: Blob, filename: string) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  /** A message from the server (upload/remove failure), shown under the control. */
  error?: string | null;
}) {
  const t = useTranslations(
    kind === "avatar" ? "dashboard.profile.avatar" : "cards.images"
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState<LocalError>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // The object URL of the file being uploaded, released when it is replaced.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const disabled = busy || disabledByPage || processing;

  const pick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLocalError(null);
    if (!ACCEPTED.has(file.type)) {
      setLocalError("badType");
      return;
    }
    setProcessing(true);
    try {
      const prepared = await prepareImage(file);
      if (prepared === null) {
        setLocalError("tooLarge");
        return;
      }
      const url = URL.createObjectURL(prepared.blob);
      setPreview(url);
      const ok = await onUpload(prepared.blob, prepared.filename);
      if (!ok) setPreview(null);
    } catch {
      setLocalError("read");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async () => {
    if (disabled) return;
    setLocalError(null);
    const ok = await onRemove();
    if (ok) setPreview(null);
  };

  const shown = preview ?? src;
  const message = localError ? t(`errors.${localError}`) : error;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={pick}
          disabled={disabled}
          aria-label={shown ? t("replace") : t("upload")}
          className={`flex shrink-0 cursor-pointer items-center justify-center overflow-hidden border border-card-border bg-ink-soft text-muted-2 transition-colors hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
            kind === "cover"
              ? "h-20 w-40 rounded-(--radius-btn)"
              : "size-24 rounded-full"
          }`}
        >
          {shown ? (
            <img
              src={shown}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          ) : (
            <IconImage className="size-7" />
          )}
        </button>

        <div className="flex min-w-0 flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={pick}
            loading={processing || (busy && !shown)}
            disabled={disabled}
          >
            {!processing && <IconUpload className="size-4" />}
            {processing ? t("processing") : shown ? t("replace") : t("upload")}
          </Button>
          {shown && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
            >
              <IconTrash className="size-4" />
              {t("remove")}
            </Button>
          )}
        </div>
      </div>
      {message ? (
        <p className="text-[12px] text-danger">{message}</p>
      ) : (
        <p className="text-[12px] text-muted-2">{t("hint")}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleChange}
        tabIndex={-1}
      />
    </div>
  );
}

/**
 * The file as it will be uploaded: untouched when it is small enough, else
 * redrawn at most `MAX_EDGE` on the long side. A PNG keeps its format (and
 * transparency) unless that still does not fit, in which case it becomes a
 * JPEG; a JPEG or WebP is re-encoded as JPEG. Null when even that is too big.
 */
async function prepareImage(
  file: File
): Promise<{ blob: Blob; filename: string } | null> {
  const bitmap = await decode(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const needsResize = longest > MAX_EDGE;
  if (!needsResize && file.size <= LIMITS.imageMaxBytes) {
    release(bitmap);
    return { blob: file, filename: file.name };
  }

  const scale = needsResize ? MAX_EDGE / longest : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    release(bitmap);
    throw new Error("canvas unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  release(bitmap);

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const attempts: { type: string; quality?: number; ext: string }[] =
    file.type === "image/png"
      ? [
          { type: "image/png", ext: "png" },
          { type: "image/jpeg", quality: 0.86, ext: "jpg" },
          { type: "image/jpeg", quality: 0.72, ext: "jpg" },
        ]
      : [
          { type: "image/jpeg", quality: 0.86, ext: "jpg" },
          { type: "image/jpeg", quality: 0.72, ext: "jpg" },
        ];

  for (const attempt of attempts) {
    const blob = await toBlob(canvas, attempt.type, attempt.quality);
    if (blob && blob.size <= LIMITS.imageMaxBytes) {
      return { blob, filename: `${base}.${attempt.ext}` };
    }
  }
  return null;
}

type Decoded = ImageBitmap | HTMLImageElement;

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Older Safari: fall through to the <img> route.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
  } finally {
    // The element keeps its decoded pixels; the URL can go once it loaded.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function release(decoded: Decoded) {
  if ("close" in decoded && typeof decoded.close === "function") decoded.close();
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

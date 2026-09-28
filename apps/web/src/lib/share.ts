/**
 * Copy, share and download from the card pages — the browser-only bits the
 * hooks in `@birlinq/core` deliberately stay away from. Every function here
 * touches `navigator` or `document`, so they are called from event handlers
 * in client components only.
 */

/**
 * Copy text to the clipboard. The async Clipboard API needs a secure context,
 * which a phone on `http://192.168.x.x` does not have; the hidden-textarea
 * path covers that and the older in-app WebViews.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or no focus — try the legacy path below.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/**
 * `cancelled` is the visitor closing the share sheet — not an error, and
 * not a reason to copy behind their back. The view shows nothing for it.
 */
export type ShareOutcome = "shared" | "copied" | "failed" | "cancelled";

/**
 * The native share sheet where the browser has one (phones, Safari), else
 * the URL goes to the clipboard so the button always does something.
 */
export async function shareOrCopy(data: {
  title?: string;
  text?: string;
  url: string;
}): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      if (typeof navigator.canShare !== "function" || navigator.canShare(data)) {
        await navigator.share(data);
        return "shared";
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // NotAllowedError (no user gesture left), DataError: fall back to copying.
    }
  }
  return (await copyText(data.url)) ? "copied" : "failed";
}

/** Save a `data:` URL under a filename — how the QR PNG reaches the camera roll. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Absolute public URLs — what goes into a QR code, a share sheet or the
 * clipboard, where a relative path is useless.
 *
 * `NEXT_PUBLIC_APP_URL` is the production origin, inlined at `next build`.
 * Without it the browser's own origin is used, which is right for local and
 * LAN testing, and the server side yields "" — a server component never
 * needs one of these (page metadata goes through `metadataBase` instead).
 *
 * Deliberately no locale prefix and no `/mock`: a card lives at `/p/{alias}`
 * for every visitor, and the locale they read it in comes from the browser
 * or the switcher, not from the link printed on a sticker.
 */
export function appOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** The card's link — the value behind its QR code. */
export function cardUrl(alias: string): string {
  return `${appOrigin()}/p/${encodeURIComponent(alias)}`;
}

/** What a physical sticker resolves to. */
export function qrScanUrl(code: string): string {
  return `${appOrigin()}/q/${encodeURIComponent(code)}`;
}

/**
 * Set once the referrer has reached the server. Module state lives exactly
 * as long as the document: client-side navigation and a language switch keep
 * it, a full load starts over — which is when `document.referrer` changes.
 */
let referrerSent = false;

/**
 * The host of the page that sent the visitor here, for `?ref=` on the public
 * fetch (D-045) — the hostname only, never the URL, so the path and query of
 * the visitor's previous page stay in the browser. Undefined when there is
 * nothing worth sending: no referrer (a camera app, a typed address, a
 * private window), one that does not parse, our own host, or a referrer this
 * document already reported. Take it before the fetch and call
 * `markReferrerSent()` once the fetch succeeds, so a retry after a failure
 * still carries it and nothing afterwards does.
 */
export function pendingReferrerHost(): string | undefined {
  if (referrerSent || typeof document === "undefined") return undefined;
  const referrer = document.referrer;
  if (!referrer) return undefined;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  if (!host || host === window.location.hostname.toLowerCase()) return undefined;
  return host;
}

/** The referrer of this document has been reported; `pendingReferrerHost()` answers undefined from now on. */
export function markReferrerSent(): void {
  referrerSent = true;
}

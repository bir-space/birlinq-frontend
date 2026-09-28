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

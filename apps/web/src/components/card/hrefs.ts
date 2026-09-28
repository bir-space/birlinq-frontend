import { apiBaseUrl, type ContactChannel } from "@birlinq/api";

/**
 * Links a contact value opens. Each helper takes the raw stored string and
 * returns a safe href — the digits of a phone, a messenger deep link, an
 * absolute web URL — so no component ever interpolates user text into a
 * scheme itself.
 */

/** Strip everything but digits and a leading + — safe for tel: links. */
export function telHref(raw: string): string {
  return `tel:${raw.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(raw: string): string {
  return `https://wa.me/${raw.replace(/\D/g, "")}`;
}

export function telegramHref(raw: string): string {
  const handle = raw.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
  return `https://t.me/${encodeURIComponent(handle)}`;
}

/** The handle is stored without "@"; a pasted profile URL is tolerated. */
export function instagramHref(raw: string): string {
  const handle = raw
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/.*$/, "");
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

export function mailtoHref(raw: string): string {
  return `mailto:${raw.trim()}`;
}

/**
 * An absolute http(s) URL for a website or LinkedIn field: a bare host gets
 * https://, and anything with another scheme (javascript:, data:) is refused
 * and rendered as text instead.
 */
export function webHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  return `https://${value}`;
}

/** What to open for one contact channel, or null when it only reads as text. */
export function contactHref(channel: ContactChannel, value: string): string | null {
  switch (channel) {
    case "phone":
    case "phone2":
      return telHref(value);
    case "email":
      return mailtoHref(value);
    case "whatsapp":
      return whatsappHref(value);
    case "telegram":
      return telegramHref(value);
    case "instagram":
      return instagramHref(value);
    case "linkedin":
    case "website":
      return webHref(value);
  }
}

/** True for an href that leaves the page — opened in a new tab with noopener. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** "https://www.example.com/path/" → "example.com/path" for display. */
export function displayUrl(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

/**
 * The `src` a card image may render, or null.
 *
 * The backend only ever hands out images it stored itself (D-041), so a
 * photo URL on another host means a tampered payload, and rendering it
 * would leak every visitor's IP to that host. Only the API's own origin
 * passes; `blob:` is allowed for the local preview of a file just chosen.
 */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  try {
    const target = new URL(url);
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return null;
    }
    return target.origin === new URL(apiBaseUrl()).origin ? url : null;
  } catch {
    return null;
  }
}

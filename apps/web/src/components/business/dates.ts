/**
 * Date helpers for the card pages. Everything here takes the wire shapes —
 * `Y-m-d` for a birthday or a stats bucket, ISO for a timestamp — and hands
 * back text in the reader's locale. Y-m-d values are parsed as calendar
 * dates, not instants, so `1990-05-14` stays the 14th in every time zone.
 */

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A local-time `Date` for a `Y-m-d` string, or null when it is not one. */
export function parseYmd(value: string): Date | null {
  const match = YMD_RE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today as `Y-m-d` in local time — the upper bound of a birthday field. */
export function todayYmd(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** "14 мая" — a birthday is a day, not an age; the year is not shown. */
export function formatBirthday(ymd: string, locale: string): string {
  const date = parseYmd(ymd);
  if (!date) return ymd;
  return date.toLocaleDateString(locale, { day: "numeric", month: "long" });
}

/** "14 мая 1990" — the full date, for the editor's own display. */
export function formatYmd(ymd: string, locale: string): string {
  const date = parseYmd(ymd);
  if (!date) return ymd;
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "14.05" style short label for a chart bucket. */
export function formatShortDay(ymd: string, locale: string): string {
  const date = parseYmd(ymd);
  if (!date) return ymd;
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** "14 мая 2026, 12:34" for an ISO timestamp; "—" when it is null. */
export function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Contact phones on a card are free text (≤ 30 characters — a foreign
 * number, an extension, "+7 700 …"). The one thing done for the owner is
 * tidying a recognisable Kazakhstan mobile on blur: `87001234567`,
 * `+7(700)123-45-67` and `77001234567` all become `+7 700 123 45 67`.
 * Anything else is left exactly as typed.
 */

const KZ_MOBILE_RE = /^(?:\+?7|8)?(7\d{9})$/;

/** The ten national digits of a Kazakhstan mobile, or null. */
export function kzMobileDigits(raw: string): string | null {
  const compact = raw.replace(/[\s()-]/g, "");
  const match = KZ_MOBILE_RE.exec(compact);
  return match ? match[1] : null;
}

export function isKzMobile(raw: string): boolean {
  return kzMobileDigits(raw) !== null;
}

/** `+7 XXX XXX XX XX` for a Kazakhstan mobile, the input unchanged otherwise. */
export function formatKzPhoneDisplay(raw: string): string {
  const digits = kzMobileDigits(raw);
  if (!digits) return raw;
  return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

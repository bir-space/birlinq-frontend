/**
 * Small shared helpers for auth forms (login/register pages + inline wizard forms).
 */

import { LIMITS } from "@birlinq/api";

/** Kazakhstan mobile format required by the backend. */
export const PHONE_RE = /^77\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Register and reset agree on 8..100 — see `LIMITS`. */
export const PASSWORD_MIN = LIMITS.passwordMin;
export const PASSWORD_MAX = LIMITS.password;

export type AuthMethod = "email" | "phone";

/** Strip spaces, dashes, parentheses and a leading "+" from a phone input. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s()+-]/g, "");
}

/**
 * Validate an email-or-phone identifier.
 * Returns an error key from the `auth.errors` namespace or null when valid.
 */
export function validateIdentifier(
  method: AuthMethod,
  value: string
): "required" | "invalidEmail" | "invalidPhone" | null {
  const v = value.trim();
  if (!v) return "required";
  if (method === "email") {
    return EMAIL_RE.test(v) ? null : "invalidEmail";
  }
  return PHONE_RE.test(normalizePhone(v)) ? null : "invalidPhone";
}

/** Build the `{ email }` or `{ phone }` part of a login/register payload. */
export function identifierPayload(
  method: AuthMethod,
  value: string
): { email: string } | { phone: string } {
  return method === "email"
    ? { email: value.trim() }
    : { phone: normalizePhone(value) };
}

/**
 * The 422 -> field-map flattening lives in `@birlinq/core` so the card and
 * profile hooks share it; re-exported here so the auth forms keep importing
 * it from the place they always did.
 */
export { detailsToFieldErrors } from "@birlinq/core";
export type { FieldErrors } from "@birlinq/core";

/** Only allow same-origin relative redirects for ?next=. */
export function safeNext(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}

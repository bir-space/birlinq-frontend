/**
 * Small shared helpers for auth forms (login/register pages + inline wizard forms).
 */

import { LIMITS } from "@/lib/api/limits";

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

export type FieldErrors = Record<string, string>;

/**
 * Flatten `VALIDATION_ERROR` details (`{ field: ["msg", ...] }` from Laravel)
 * into a `{ field: message }` map for inline display.
 */
export function detailsToFieldErrors(
  details?: Record<string, unknown>
): FieldErrors {
  const out: FieldErrors = {};
  if (!details) return out;
  for (const [key, value] of Object.entries(details)) {
    // Backend may nest keys like "vehicle.make" — keep the last segment too.
    const short = key.split(".").pop() ?? key;
    let message: string | null = null;
    if (typeof value === "string") message = value;
    else if (Array.isArray(value) && typeof value[0] === "string")
      message = value[0];
    if (message) {
      out[key] = message;
      out[short] = message;
    }
  }
  return out;
}

/** Only allow same-origin relative redirects for ?next=. */
export function safeNext(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}

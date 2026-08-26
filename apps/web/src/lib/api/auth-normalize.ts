import type { AuthResponse, RawAuthResponse } from "./types";

/**
 * Token validation and auth-body normalization.
 *
 * Deliberately a leaf module: both `client.ts` and `auth/token-store.ts` need
 * it, and importing it from either of those would create a cycle between them.
 */

/** A JWT is always far longer than this; the backend refresh token is 64 hex chars. */
const MIN_TOKEN_LENGTH = 32;

/** Reject the classic footguns: undefined coerced to a string, empty, too short. */
export function isUsableToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= MIN_TOKEN_LENGTH &&
    value !== "undefined" &&
    value !== "null"
  );
}

/**
 * Accept the auth body and fail loudly instead of persisting garbage.
 *
 * Current backend: { user, tokens: { access_token, refresh_token, ... } }
 * An older AuthController spread the tokens flat next to `user`; that shape is
 * still accepted so a rolled-back deploy doesn't break sign-in.
 *
 * Returns null when neither yields usable tokens — the caller must treat that
 * as a failed sign-in rather than writing "undefined" into localStorage.
 */
export function normalizeAuthResponse(body: unknown): AuthResponse | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as RawAuthResponse;
  const t = raw.tokens ?? raw;

  if (!isUsableToken(t.access_token) || !isUsableToken(t.refresh_token)) {
    return null;
  }
  if (!raw.user?.id) return null;

  return {
    user: raw.user,
    tokens: {
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      token_type: t.token_type ?? "Bearer",
      expires_in: typeof t.expires_in === "number" ? t.expires_in : 900,
    },
  };
}

/** Thrown when a 2xx auth response carries no usable token pair. */
export class MalformedAuthResponseError extends Error {
  constructor() {
    super("Auth response did not contain a usable token pair.");
    this.name = "MalformedAuthResponseError";
  }
}

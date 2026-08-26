import type { ApiError, ApiLocale } from "./types";
import { normalizeAuthResponse } from "./auth-normalize";
import { apiBaseUrl, tokens } from "./config";

export {
  MalformedAuthResponseError,
  isUsableToken,
  normalizeAuthResponse,
} from "./auth-normalize";

/**
 * Error codes emitted by the backend (bootstrap/app.php + the QR controller).
 * NB: validation failures are `VALIDATION_ERROR` — not `VALIDATION_FAILED`.
 */
export const ErrorCode = {
  ValidationError: "VALIDATION_ERROR",
  Unauthenticated: "UNAUTHENTICATED",
  InvalidCredentials: "INVALID_CREDENTIALS",
  TokenExpired: "TOKEN_EXPIRED",
  TokenInvalid: "TOKEN_INVALID",
  TokenAbsent: "TOKEN_ABSENT",
  InvalidRefreshToken: "INVALID_REFRESH_TOKEN",
  RefreshTokenExpired: "REFRESH_TOKEN_EXPIRED",
  RefreshTokenStolen: "REFRESH_TOKEN_STOLEN",
  NotFound: "NOT_FOUND",
  QrNotFound: "QR_NOT_FOUND",
  /** 410 on a public endpoint: the code exists but is paused/blocked/inactive. */
  QrNotScannable: "QR_NOT_SCANNABLE",
  QrAlreadyActivated: "QR_ALREADY_ACTIVATED",
  QrNotActivated: "QR_NOT_ACTIVATED",
  QrNotPaused: "QR_NOT_PAUSED",
  EntityAlreadyHasQr: "ENTITY_ALREADY_HAS_QR",
  ScenarioNotFound: "SCENARIO_NOT_FOUND",
  InteractionNotFound: "INTERACTION_NOT_FOUND",
  InvalidResetToken: "INVALID_RESET_TOKEN",
  InvalidVerificationToken: "INVALID_VERIFICATION_TOKEN",
  Forbidden: "FORBIDDEN",
  /** All three are 422, NOT 400 — see `isValidationError`. */
  IdempotencyKeyMissing: "IDEMPOTENCY_KEY_MISSING",
  IdempotencyKeyInvalid: "IDEMPOTENCY_KEY_INVALID",
  IdempotencyKeyMisuse: "IDEMPOTENCY_KEY_MISUSE",
  RateLimited: "RATE_LIMITED",
  /**
   * Fallback the backend uses for any HttpException it does not map by hand —
   * notably a 403 from `Gate::authorize` on entity and QR policies.
   */
  HttpError: "HTTP_ERROR",
  ServerError: "SERVER_ERROR",
} as const;

/** The 422s that are NOT field-validation failures. */
const NON_VALIDATION_422 = new Set<string>([
  ErrorCode.IdempotencyKeyMissing,
  ErrorCode.IdempotencyKeyInvalid,
  ErrorCode.IdempotencyKeyMisuse,
]);

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;

  /**
   * `requestId` prefers the body, then the `X-Request-Id` response header the
   * AddRequestId middleware sets on *every* response. The header is the only
   * source left when the body is not our JSON envelope at all — a proxy 502,
   * an HTML 500 — which is exactly when someone needs the id to find the log
   * line.
   */
  constructor(
    status: number,
    body: Partial<ApiError> | null,
    headerRequestId?: string | null
  ) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body?.code ?? "UNKNOWN";
    this.requestId = body?.request_id ?? headerRequestId ?? undefined;
    this.details = body?.details;
  }
}

/**
 * 422 with a `details` map of field → messages. Deliberately not a type
 * predicate: narrowing here would collapse the `else` branch of an
 * `err instanceof ApiRequestError` check to `never`.
 *
 * The status alone is not enough. The idempotency middleware also answers 422
 * — with no `details` and nothing a form field could show — so treating every
 * 422 as a validation failure made a missing or reused Idempotency-Key surface
 * as a silent no-op form error.
 */
export function isValidationError(err: unknown): boolean {
  if (!(err instanceof ApiRequestError)) return false;
  if (err.code === ErrorCode.ValidationError) return true;
  // Unparsable body: fall back to the status, minus the known impostors.
  return err.status === 422 && !NON_VALIDATION_422.has(err.code);
}

/** A 422 from the idempotency middleware: a client bug, not user input. */
export function isIdempotencyError(err: unknown): boolean {
  return err instanceof ApiRequestError && NON_VALIDATION_422.has(err.code);
}

/**
 * 410 GONE on a public endpoint: the QR code is real but has nothing to show —
 * paused by the owner, blocked by an admin, or never activated. Distinct from
 * 404, which means no such code exists at all; the visitor gets a different
 * screen for each. `err.details.status` carries the current QR status.
 */
export function isQrNotScannable(err: unknown): boolean {
  return (
    err instanceof ApiRequestError &&
    (err.status === 410 || err.code === ErrorCode.QrNotScannable)
  );
}

/** 429 RATE_LIMITED, with `Retry-After` and the `X-RateLimit-*` trio set. */
export function isRateLimited(err: unknown): boolean {
  return (
    err instanceof ApiRequestError &&
    (err.status === 429 || err.code === ErrorCode.RateLimited)
  );
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Attach Authorization: Bearer header (default true for non-public paths) */
  auth?: boolean;
  /** Send an Idempotency-Key header (UUID v4 is accepted by backend as UUID). */
  idempotencyKey?: string;
  /**
   * Sets `Accept-Language`. The public endpoints resolve the visitor locale
   * with `getPreferredLanguage(['ru','kz','en'])`, i.e. from this header only
   * — without it the scan event and the payload's `meta.locale` follow the
   * browser rather than the locale the visitor is actually reading the page in.
   */
  locale?: ApiLocale;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export function newIdempotencyKey(): string {
  // Browser + Node 19+; fine for our supported targets.
  return crypto.randomUUID();
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

let refreshPromise: Promise<boolean> | null = null;

/** Try to refresh the token pair once; concurrent callers share the promise. */
async function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokens().getRefreshToken();
      // getRefreshToken already rejects unusable values, so a null here means
      // there is nothing to rotate — don't send a doomed request.
      if (!refreshToken) {
        tokens().clear();
        return false;
      }
      try {
        const res = await fetch(`${apiBaseUrl()}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        // 4xx means this token will never work again (invalid, expired,
        // rotated, or theft-revoked) — drop the session instead of looping.
        if (!res.ok) {
          tokens().clear();
          return false;
        }
        const auth = normalizeAuthResponse(await parseBody(res));
        if (!auth) {
          tokens().clear();
          return false;
        }
        tokens().setSession(auth);
        return true;
      } catch {
        // Network blip — keep the session so the next attempt can retry.
        return false;
      } finally {
        // allow next refresh cycle
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

/**
 * Core request helper. Automatically:
 *  - prefixes the configured base URL
 *  - serialises JSON
 *  - attaches Bearer token when `auth` is true
 *  - on 401 with auth — refreshes once and retries
 *  - throws ApiRequestError on non-2xx
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    auth = false,
    idempotencyKey,
    locale,
    signal,
  } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    if (locale) headers["Accept-Language"] = locale;
    if (auth) {
      const token = tokens().getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const errBody = (await parseBody(res)) as Partial<ApiError> | null;
    throw new ApiRequestError(
      res.status,
      errBody,
      res.headers.get("X-Request-Id")
    );
  }

  return (await parseBody(res)) as T;
}

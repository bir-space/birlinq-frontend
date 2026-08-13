import type { ApiError } from "./types";
import { normalizeAuthResponse } from "./auth-normalize";
import { tokenStore } from "../auth/token-store";

export {
  MalformedAuthResponseError,
  isUsableToken,
  normalizeAuthResponse,
} from "./auth-normalize";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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
  QrAlreadyActivated: "QR_ALREADY_ACTIVATED",
  QrNotActivated: "QR_NOT_ACTIVATED",
  QrNotPaused: "QR_NOT_PAUSED",
  EntityAlreadyHasQr: "ENTITY_ALREADY_HAS_QR",
  Forbidden: "FORBIDDEN",
  IdempotencyKeyMissing: "IDEMPOTENCY_KEY_MISSING",
  IdempotencyKeyInvalid: "IDEMPOTENCY_KEY_INVALID",
  IdempotencyKeyMisuse: "IDEMPOTENCY_KEY_MISUSE",
  ServerError: "SERVER_ERROR",
} as const;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, body: Partial<ApiError> | null) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body?.code ?? "UNKNOWN";
    this.requestId = body?.request_id;
    this.details = body?.details;
  }
}

/**
 * 422 with a `details` map of field → messages. Deliberately not a type
 * predicate: narrowing here would collapse the `else` branch of an
 * `err instanceof ApiRequestError` check to `never`.
 */
export function isValidationError(err: unknown): boolean {
  return (
    err instanceof ApiRequestError &&
    (err.code === ErrorCode.ValidationError || err.status === 422)
  );
}

/**
 * The route does not exist on this backend build. Laravel answers unknown
 * `/api/*` routes with 404 NOT_FOUND, so a missing endpoint is indistinguishable
 * from a missing record — callers that use this must be sure the path itself is
 * unimplemented (see the NOT IMPLEMENTED block in endpoints.ts).
 */
export function isMissingEndpoint(err: unknown): boolean {
  return err instanceof ApiRequestError && (err.status === 404 || err.status === 501);
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Attach Authorization: Bearer header (default true for non-public paths) */
  auth?: boolean;
  /** Send an Idempotency-Key header (UUID v4 is accepted by backend as UUID). */
  idempotencyKey?: string;
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
      const refreshToken = tokenStore.getRefreshToken();
      // getRefreshToken already rejects unusable values, so a null here means
      // there is nothing to rotate — don't send a doomed request.
      if (!refreshToken) {
        tokenStore.clear();
        return false;
      }
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
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
          tokenStore.clear();
          return false;
        }
        const auth = normalizeAuthResponse(await parseBody(res));
        if (!auth) {
          tokenStore.clear();
          return false;
        }
        tokenStore.setSession(auth);
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
 *  - prefixes API_URL
 *  - serialises JSON
 *  - attaches Bearer token when `auth` is true
 *  - on 401 with auth — refreshes once and retries
 *  - throws ApiRequestError on non-2xx
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = false, idempotencyKey, signal } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    if (auth) {
      const token = tokenStore.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${path}`, {
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
    throw new ApiRequestError(res.status, errBody);
  }

  return (await parseBody(res)) as T;
}

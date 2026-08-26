import type { AuthResponse } from "./types";

/**
 * Where the session lives.
 *
 * The client needs to read the access token, rotate the refresh token and drop
 * the session — but it must not know *how* any of that is stored. On the web
 * that is memory plus localStorage; on native it is memory plus Keychain or
 * Keystore. Both satisfy this interface, so neither leaks into this package.
 */
export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setSession(auth: AuthResponse): void;
  clear(): void;
  hasSession(): boolean;
}

export interface ApiConfig {
  /** Base URL of the backend, no trailing slash. */
  baseUrl: string;
  tokenStore: TokenStore;
}

let config: ApiConfig | null = null;

/**
 * Wire the package to its host. Call once at app boot, before any request.
 *
 * This exists because the two things this package cannot decide for itself —
 * where the API lives and where the session is kept — are the two things that
 * differ per platform. `NEXT_PUBLIC_API_URL` and `localStorage` are answers
 * that only make sense in one of the two apps, so the host supplies them.
 */
export function configureApi(next: ApiConfig): void {
  config = next;
}

function requireConfig(): ApiConfig {
  if (config === null) {
    throw new Error(
      "@birlinq/api is not configured — call configureApi({ baseUrl, tokenStore }) at app boot."
    );
  }
  return config;
}

export function apiBaseUrl(): string {
  return requireConfig().baseUrl;
}

export function tokens(): TokenStore {
  return requireConfig().tokenStore;
}

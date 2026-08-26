import type { AuthResponse, User } from "@birlinq/api";
import { isUsableToken } from "@birlinq/api";

/**
 * Token storage strategy (web):
 *  - access token: memory only (short-lived, 15 min)
 *  - refresh token: localStorage (pragmatic MVP choice; the backend rotates
 *    refresh tokens on every use and cascade-revokes on theft detection).
 *  - user snapshot: localStorage for instant hydration.
 *
 * Every write and every read is validated. `localStorage.setItem(k, undefined)`
 * silently stores the string "undefined", which then goes out on the wire and
 * comes back as `422 refresh_token must be at least 32 characters` — guarding
 * both directions makes an already-poisoned browser heal on the next load.
 */

const REFRESH_KEY = "birlinq.refresh_token";
const USER_KEY = "birlinq.user";

let accessToken: string | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private mode / storage disabled.
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota or disabled storage — session degrades to memory-only */
  }
}

function removeStorage(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const tokenStore = {
  getAccessToken(): string | null {
    return isUsableToken(accessToken) ? accessToken : null;
  },

  /** Returns null for anything unusable, and evicts the bad value. */
  getRefreshToken(): string | null {
    const raw = readStorage(REFRESH_KEY);
    if (raw === null) return null;
    if (!isUsableToken(raw)) {
      removeStorage(REFRESH_KEY);
      removeStorage(USER_KEY);
      return null;
    }
    return raw;
  },

  getUser(): User | null {
    const raw = readStorage(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as User;
      return parsed && typeof parsed.id === "string" ? parsed : null;
    } catch {
      removeStorage(USER_KEY);
      return null;
    }
  },

  /**
   * Persist a verified sign-in. Callers must pass a `normalizeAuthResponse`
   * result, so the tokens are already known-good by construction.
   */
  setSession(auth: AuthResponse) {
    accessToken = auth.tokens.access_token;
    writeStorage(REFRESH_KEY, auth.tokens.refresh_token);
    writeStorage(USER_KEY, JSON.stringify(auth.user));
    emit();
  },

  setUser(user: User) {
    writeStorage(USER_KEY, JSON.stringify(user));
    emit();
  },

  clear() {
    accessToken = null;
    removeStorage(REFRESH_KEY);
    removeStorage(USER_KEY);
    emit();
  },

  /** True when we have at least a usable refresh token to try. */
  hasSession(): boolean {
    return Boolean(this.getAccessToken() ?? this.getRefreshToken());
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

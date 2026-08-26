import * as SecureStore from "expo-secure-store";
import { isUsableToken, type AuthResponse, type TokenStore, type User } from "@birlinq/api";

/**
 * Session storage on device.
 *
 * Same shape as the web store — access token in memory only, refresh token
 * persisted — but the persisted half lives in Keychain (iOS) or Keystore
 * (Android) rather than localStorage. Invariant #3 in CLAUDE.md is unchanged;
 * only the refresh token's home differs.
 *
 * SecureStore is asynchronous and `TokenStore` is not, deliberately: making it
 * async would push a promise into every render path that reads a token. So the
 * persisted values are read once by `hydrate()` before the tree mounts, held in
 * memory afterwards, and written back fire-and-forget. A failed write costs the
 * session on next launch, never a crash mid-flight.
 */

const REFRESH_KEY = "birlinq.refresh_token";
const USER_KEY = "birlinq.user";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let user: User | null = null;
let hydrated = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

async function write(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Keychain unavailable (locked device, simulator quirk). The in-memory
    // session still works for this launch.
  }
}

async function remove(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* see write() */
  }
}

async function read(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/**
 * Load the persisted session into memory. Call once, before rendering anything
 * that reads a token — `app/_layout.tsx` gates the tree on it.
 */
export async function hydrate(): Promise<void> {
  if (hydrated) return;

  const [storedRefresh, storedUser] = await Promise.all([
    read(REFRESH_KEY),
    read(USER_KEY),
  ]);

  // Same defensive read as the web store: an unusable value is evicted rather
  // than sent to the backend, which would come back 422 on refresh.
  if (isUsableToken(storedRefresh)) {
    refreshToken = storedRefresh;
  } else if (storedRefresh !== null) {
    void remove(REFRESH_KEY);
    void remove(USER_KEY);
  }

  if (storedUser !== null) {
    try {
      const parsed = JSON.parse(storedUser) as User;
      user = typeof parsed?.id === "string" ? parsed : null;
    } catch {
      void remove(USER_KEY);
    }
  }

  hydrated = true;
  emit();
}

export const nativeTokenStore: TokenStore & {
  getUser(): User | null;
  setUser(next: User): void;
  subscribe(listener: Listener): () => void;
} = {
  getAccessToken() {
    return isUsableToken(accessToken) ? accessToken : null;
  },

  getRefreshToken() {
    return isUsableToken(refreshToken) ? refreshToken : null;
  },

  getUser() {
    return user;
  },

  setSession(auth: AuthResponse) {
    accessToken = auth.tokens.access_token;
    refreshToken = auth.tokens.refresh_token;
    user = auth.user;
    void write(REFRESH_KEY, auth.tokens.refresh_token);
    void write(USER_KEY, JSON.stringify(auth.user));
    emit();
  },

  setUser(next: User) {
    user = next;
    void write(USER_KEY, JSON.stringify(next));
    emit();
  },

  clear() {
    accessToken = null;
    refreshToken = null;
    user = null;
    void remove(REFRESH_KEY);
    void remove(USER_KEY);
    emit();
  },

  hasSession() {
    return Boolean(this.getAccessToken() ?? this.getRefreshToken());
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

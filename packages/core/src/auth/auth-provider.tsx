"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TokenStore, User } from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { AuthContext, type AuthContextValue } from "./auth-context";

/**
 * What the provider needs beyond the request-level `TokenStore`: the cached
 * user snapshot and a way to hear about sign-out from elsewhere.
 *
 * Passed in rather than imported, because where the session physically lives
 * is the one thing that genuinely differs between the two apps — localStorage
 * on the web, Keychain/Keystore on device — and it is bound before React
 * exists, so it cannot arrive through a context.
 */
export interface SessionStore extends TokenStore {
  getUser(): User | null;
  setUser(user: User): void;
  subscribe(listener: () => void): () => void;
}

export function AuthProvider({
  children,
  store,
}: {
  children: ReactNode;
  store: SessionStore;
}) {
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Verify the session against the API.
   *
   * `apiFetch` already rotates the token on 401 and clears the store when the
   * refresh token is dead, so the store is the source of truth about whether
   * we still have a session. A failed `/auth/me` with a surviving store means
   * a transient error (offline, 5xx) — keep the cached user rather than
   * bouncing a signed-in user to the login page.
   */
  const refresh = useCallback(async () => {
    if (!store.hasSession()) {
      setUser(null);
      return;
    }
    try {
      const { user: fresh } = await api.auth.me();
      store.setUser(fresh);
      setUser(fresh);
    } catch {
      setUser(store.hasSession() ? store.getUser() : null);
    }
  }, [api, store]);

  useEffect(() => {
    let cancelled = false;

    // Instant hydration from the cached snapshot, then verify in background.
    if (store.hasSession()) {
      const cached = store.getUser();
      if (cached) setUser(cached);
    }

    (async () => {
      if (store.hasSession()) {
        try {
          const { user: fresh } = await api.auth.me();
          if (cancelled) return;
          store.setUser(fresh);
          setUser(fresh);
        } catch {
          if (cancelled) return;
          setUser(store.hasSession() ? store.getUser() : null);
        }
      } else {
        setUser(null);
      }
      if (!cancelled) setLoading(false);
    })();

    const unsubscribe = store.subscribe(() => {
      if (!store.hasSession()) setUser(null);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [api, store]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, [api]);

  const logoutAll = useCallback(async () => {
    await api.auth.logoutAll();
    setUser(null);
  }, [api]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      refresh,
      logout,
      logoutAll,
    }),
    [user, loading, refresh, logout, logoutAll]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

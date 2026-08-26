"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../api/types";
import { useApi } from "../app-env";
import { tokenStore } from "./token-store";
import { AuthContext, type AuthContextValue } from "./auth-context";

export { useAuth } from "./auth-context";
export type { AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
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
    if (!tokenStore.hasSession()) {
      setUser(null);
      return;
    }
    try {
      const { user: fresh } = await api.auth.me();
      tokenStore.setUser(fresh);
      setUser(fresh);
    } catch {
      setUser(tokenStore.hasSession() ? tokenStore.getUser() : null);
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    // Instant hydration from the cached snapshot, then verify in background.
    if (tokenStore.hasSession()) {
      const cached = tokenStore.getUser();
      if (cached) setUser(cached);
    }

    (async () => {
      if (tokenStore.hasSession()) {
        try {
          const { user: fresh } = await api.auth.me();
          if (cancelled) return;
          tokenStore.setUser(fresh);
          setUser(fresh);
        } catch {
          if (cancelled) return;
          setUser(tokenStore.hasSession() ? tokenStore.getUser() : null);
        }
      } else {
        setUser(null);
      }
      if (!cancelled) setLoading(false);
    })();

    const unsubscribe = tokenStore.subscribe(() => {
      if (!tokenStore.hasSession()) setUser(null);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [api]);

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

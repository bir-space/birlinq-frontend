"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../api/types";
import { authApi } from "../api/endpoints";
import { tokenStore } from "./token-store";

interface AuthContextValue {
  user: User | null;
  /** true while we're trying to restore a session on first mount */
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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
      const { user: fresh } = await authApi.me();
      tokenStore.setUser(fresh);
      setUser(fresh);
    } catch {
      setUser(tokenStore.hasSession() ? tokenStore.getUser() : null);
    }
  }, []);

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
          const { user: fresh } = await authApi.me();
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
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      refresh,
      logout,
    }),
    [user, loading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

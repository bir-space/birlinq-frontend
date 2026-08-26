"use client";

/**
 * Mock session provider. Publishes to the SAME AuthContext as the real
 * `AuthProvider`, so every shared component's `useAuth()` works unchanged —
 * session state lives only in React state, no tokenStore and no fetch.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@birlinq/api";
import {
  AuthContext,
  type AuthContextValue,
} from "@/lib/auth/auth-context";
import { mockAuthApi } from "./mock-endpoints";

export function MockAuthProvider({
  children,
  initiallyAuthenticated = false,
}: {
  children: ReactNode;
  /** Start already "logged in" — used by dashboard/QR mock pages. */
  initiallyAuthenticated?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(!initiallyAuthenticated);

  useEffect(() => {
    if (!initiallyAuthenticated) return;
    let cancelled = false;
    mockAuthApi.me().then(({ user }) => {
      if (cancelled) return;
      setUser(user);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    const { user } = await mockAuthApi.me();
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await mockAuthApi.logout();
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    await mockAuthApi.logoutAll();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: !hydrated,
      isAuthenticated: user !== null,
      refresh,
      logout,
      logoutAll,
    }),
    [user, hydrated, refresh, logout, logoutAll]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

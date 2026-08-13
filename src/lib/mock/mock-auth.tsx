"use client";

/**
 * Drop-in mock replacement for src/lib/auth/use-auth.tsx. Same context shape
 * so duplicated components (mock activation wizard, mock auth pages) can
 * import { useAuth } from here instead of the real hook without any other
 * change. Session state lives only in React state — no tokenStore, no fetch.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/lib/api/types";
import { mockAuthApi } from "./mock-endpoints";

interface MockAuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

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

  const value = useMemo<MockAuthContextValue>(
    () => ({
      user,
      loading: !hydrated,
      isAuthenticated: user !== null,
      refresh,
      logout,
    }),
    [user, hydrated, refresh, logout]
  );

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useAuth(): MockAuthContextValue {
  const ctx = useContext(MockAuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <MockAuthProvider>");
  }
  return ctx;
}

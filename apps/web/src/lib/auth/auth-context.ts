"use client";

import { createContext, useContext } from "react";
import type { User } from "@birlinq/api";

/**
 * One context, two providers: `AuthProvider` (real, token-backed) and
 * `MockAuthProvider` (in-memory fixtures). Components import `useAuth` from
 * here and work unchanged under either tree.
 */
export interface AuthContextValue {
  user: User | null;
  /** true while we're trying to restore a session on first mount */
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  /** Ends this session only — other devices stay signed in. */
  logout: () => Promise<void>;
  /** Ends every session of this user (POST /auth/logout-all). */
  logoutAll: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth must be used within <AuthProvider> or <MockAuthProvider>"
    );
  }
  return ctx;
}

"use client";

import type { ReactNode } from "react";
import { AuthProvider as CoreAuthProvider } from "@birlinq/core";
import { tokenStore } from "./token-store";

/**
 * Binds the shared provider to the web's session store.
 *
 * The binding has to happen in a client component: the store is an object of
 * functions, and a server component cannot hand one to a client component —
 * props crossing that boundary must be serialisable. Same reason `WebPlatform`
 * exists next door.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <CoreAuthProvider store={tokenStore}>{children}</CoreAuthProvider>;
}

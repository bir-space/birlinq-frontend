"use client";

import type { ReactNode } from "react";
import { PlatformProvider } from "@birlinq/platform";
import { MockAuthProvider } from "@/lib/mock/mock-auth";
import { mockApi } from "@/lib/mock/mock-endpoints";

/**
 * Everything that makes a page part of the `/mock` preview tree:
 * fixture-backed API, "/mock" link prefix, and an in-memory session.
 *
 * Pages under /mock render the SAME components as the real app and only wrap
 * them in this — there is no duplicated component tree to keep in sync.
 */
export function MockShell({
  children,
  authenticated = false,
}: {
  children: ReactNode;
  /** Start already "logged in" — used by the dashboard pages. */
  authenticated?: boolean;
}) {
  return (
    <PlatformProvider api={mockApi} basePath="/mock">
      <MockAuthProvider initiallyAuthenticated={authenticated}>
        {children}
      </MockAuthProvider>
    </PlatformProvider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { type AppApi } from "@birlinq/api";

/**
 * Everything a feature component needs from the surface it happens to be
 * running on, in one object it can be handed.
 *
 * The point is that a component never asks *which* surface it is on. It asks
 * the platform for a capability and gets whatever the host provided — the real
 * API or the `/mock` fixtures today, and a native implementation once
 * `apps/mobile` exists.
 *
 * Fields are added when they have a consumer, not in advance. Push, the
 * barcode scanner and navigation belong here too, and land with the app that
 * needs them — see docs/architecture/monorepo.md.
 *
 * NB: the session store is deliberately *not* here. `@birlinq/api` is wired to
 * it through `configureApi()` at module load, which happens before any React
 * context exists, so routing it through this provider would be a lie.
 */
export interface Platform {
  /** Which API implementation this tree calls. */
  api: AppApi;
  /** Prefix every internal link carries: "" normally, "/mock" under preview. */
  basePath: string;
  /** True in the `/mock` preview tree, for the banner and its exits. */
  isMock: boolean;
}

const PlatformContext = createContext<Platform | null>(null);

export function PlatformProvider({
  children,
  api,
  basePath = "",
}: {
  children: ReactNode;
  api: AppApi;
  basePath?: string;
}) {
  const value = useMemo<Platform>(
    () => ({ api, basePath, isMock: basePath === "/mock" }),
    [api, basePath]
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform(): Platform {
  const value = useContext(PlatformContext);
  if (value === null) {
    throw new Error(
      "usePlatform() outside a PlatformProvider — wrap the tree in the host's provider."
    );
  }
  return value;
}

/** The API implementation for the current tree. */
export function useApi(): AppApi {
  return usePlatform().api;
}

/**
 * Prefix-aware link builder. `href("/dashboard")` yields "/dashboard" in the
 * real app and "/mock/dashboard" under the preview tree.
 */
export function useHref(): (path: string) => string {
  const { basePath } = usePlatform();
  return useMemo(
    () => (path: string) => (path === "/" ? basePath || "/" : basePath + path),
    [basePath]
  );
}

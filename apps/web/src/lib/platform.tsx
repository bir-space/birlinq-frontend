"use client";

import "./api-config";
import type { ReactNode } from "react";
import { realApi } from "@birlinq/api";
import { PlatformProvider } from "@birlinq/platform";

/**
 * The web's implementation of the platform contract: the real API, no link
 * prefix.
 *
 * It also carries the `./api-config` side effect, so `configureApi()` runs
 * before anything under this provider can issue a request. Wrapping the tree
 * explicitly — rather than leaning on a context default — is what lets
 * `usePlatform()` throw when a provider is missing instead of quietly serving
 * the web implementation to a tree that wanted a different one.
 */
export function WebPlatform({ children }: { children: ReactNode }) {
  return <PlatformProvider api={realApi}>{children}</PlatformProvider>;
}

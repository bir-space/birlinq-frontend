import "./api-config";
import type { ReactNode } from "react";
import { realApi } from "@birlinq/api";
import { PlatformProvider } from "@birlinq/platform";

/** The native implementation of the platform contract: real API, no prefix. */
export function NativePlatform({ children }: { children: ReactNode }) {
  return <PlatformProvider api={realApi}>{children}</PlatformProvider>;
}

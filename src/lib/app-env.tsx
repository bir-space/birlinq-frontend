"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  authApi,
  entitiesApi,
  ownerApi,
  publicApi,
  qrApi,
  unimplementedAuthApi,
} from "./api/endpoints";

/**
 * Single injection point for everything that differs between the real app and
 * the `/mock` preview: which API implementation is called, and which URL prefix
 * the internal links carry.
 *
 * Both trees render the *same* components — the mock pages only swap this
 * provider's value. That is what keeps `/mock` from drifting out of sync with
 * the real contract, which is exactly what happened when it was a copy-paste.
 */

export interface AppApi {
  auth: typeof authApi & typeof unimplementedAuthApi;
  entities: typeof entitiesApi;
  qr: typeof qrApi;
  public: typeof publicApi;
  owner: typeof ownerApi;
}

export const realApi: AppApi = {
  auth: { ...authApi, ...unimplementedAuthApi },
  entities: entitiesApi,
  qr: qrApi,
  public: publicApi,
  owner: ownerApi,
};

interface AppEnv {
  api: AppApi;
  /** "" for the real app, "/mock" for the preview tree. */
  basePath: string;
  isMock: boolean;
}

const AppEnvContext = createContext<AppEnv>({
  api: realApi,
  basePath: "",
  isMock: false,
});

export function AppEnvProvider({
  children,
  api = realApi,
  basePath = "",
}: {
  children: ReactNode;
  api?: AppApi;
  basePath?: string;
}) {
  const value = useMemo<AppEnv>(
    () => ({ api, basePath, isMock: basePath === "/mock" }),
    [api, basePath]
  );
  return (
    <AppEnvContext.Provider value={value}>{children}</AppEnvContext.Provider>
  );
}

export function useAppEnv(): AppEnv {
  return useContext(AppEnvContext);
}

/** The API implementation for the current tree. */
export function useApi(): AppApi {
  return useContext(AppEnvContext).api;
}

/**
 * Prefix-aware link builder. `href("/dashboard")` yields "/dashboard" in the
 * real app and "/mock/dashboard" under the preview tree.
 */
export function useHref(): (path: string) => string {
  const { basePath } = useContext(AppEnvContext);
  return useMemo(
    () => (path: string) => (path === "/" ? basePath || "/" : basePath + path),
    [basePath]
  );
}

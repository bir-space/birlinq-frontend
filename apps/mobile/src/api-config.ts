import { configureApi } from "@birlinq/api";
import { nativeTokenStore } from "./token-store";

/**
 * Binds `@birlinq/api` to the native app — the mirror of
 * `apps/web/src/lib/api-config.ts`, with the two platform-specific answers
 * swapped: Expo's env prefix instead of Next's, Keychain/Keystore instead of
 * localStorage. Nothing inside the package changes between the two.
 */
configureApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  tokenStore: nativeTokenStore,
});

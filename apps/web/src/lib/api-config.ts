import { configureApi } from "@birlinq/api";
import { tokenStore } from "./auth/token-store";

/**
 * Binds `@birlinq/api` to this app. The package deliberately knows neither
 * where the backend lives nor how the session is stored, because both answers
 * are platform-specific — `NEXT_PUBLIC_API_URL` and `localStorage` only mean
 * something here.
 *
 * Imported for its side effect from `platform.tsx`, which wraps every client
 * tree, so this runs before the first request.
 */
configureApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  tokenStore,
});

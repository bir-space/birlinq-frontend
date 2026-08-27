/**
 * Everything stateful that is not markup.
 *
 * A hook here returns state and callbacks, never JSX, never a translated
 * string, and never a DOM or native API. `apps/web` and `apps/mobile` each
 * render their own view over the same behaviour.
 */
export { AuthProvider } from "./auth/auth-provider";
export type { SessionStore } from "./auth/auth-provider";
export { AuthContext, useAuth } from "./auth/auth-context";
export type { AuthContextValue } from "./auth/auth-context";

export { useOverview } from "./owner/use-overview";
export type { UseOverview } from "./owner/use-overview";

export { useInteractions, PAGE_SIZE } from "./owner/use-interactions";
export type {
  UseInteractions,
  InteractionsActionError,
} from "./owner/use-interactions";

export { useQrList } from "./owner/use-qr-list";
export type { UseQrList, QrListActionError } from "./owner/use-qr-list";

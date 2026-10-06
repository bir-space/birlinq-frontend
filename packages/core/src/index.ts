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

export { detailsToFieldErrors } from "./shared/field-errors";
export type { FieldErrors } from "./shared/field-errors";

export { useOverview } from "./owner/use-overview";
export type { UseOverview } from "./owner/use-overview";

export { useInteractions, PAGE_SIZE } from "./owner/use-interactions";
export type {
  UseInteractions,
  InteractionsActionError,
} from "./owner/use-interactions";

export { useQrList } from "./owner/use-qr-list";
export type { UseQrList, QrListActionError } from "./owner/use-qr-list";

export {
  CARD_PRIVACY_KEYS,
  CARD_PRIVACY_GROUPS,
  CARD_PRIVACY_PRESETS,
  PRIVACY_PRESETS,
  activeCardPreset,
  cardPrivacy,
} from "./cards/privacy-presets";
export type {
  CardPrivacy,
  CardPrivacyGroup,
  CardPrivacyKey,
  CardPrivacyPreset,
} from "./cards/privacy-presets";

export { EMPTY_TOTALS, splitClicks, sumStats } from "./cards/stats";
export type { ClickSplit, StatsTotals } from "./cards/stats";

export { useCards, CARDS_PAGE_SIZE } from "./cards/use-cards";
export type { UseCards, CardsActionError } from "./cards/use-cards";

export { useCreateCard } from "./cards/use-create-card";
export type {
  UseCreateCard,
  CreateCardError,
  CreateCardRequest,
} from "./cards/use-create-card";

export { useCard } from "./cards/use-card";
export type {
  UseCard,
  CardActionError,
  CardBusy,
  CardLoadError,
} from "./cards/use-card";

export { useCardStats } from "./cards/use-card-stats";
export type { UseCardStats } from "./cards/use-card-stats";

export { useBusinessOverview } from "./cards/use-business-overview";
export type { UseBusinessOverview } from "./cards/use-business-overview";

export { useProfile } from "./account/use-profile";
export type {
  UseProfile,
  ProfileActionError,
  ProfileBusy,
} from "./account/use-profile";

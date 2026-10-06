import {
  ApiRequestError,
  ErrorCode,
  isEntityNotPublished,
  isQrNotScannable,
  isRateLimited,
} from "@birlinq/api";

/**
 * The screens a public page can end on. Two doors (sticker, link) and two
 * kinds of 410 give more cases than the old scan page had, and the visitor
 * gets a different sentence for each:
 *
 * - `not_found`   — 404 (QR_NOT_FOUND / CARD_NOT_FOUND), or a card that was
 *                   deleted behind a still-live sticker
 * - `unavailable` — 410 QR_NOT_SCANNABLE: the sticker itself is paused
 * - `unpublished` — 410 ENTITY_NOT_PUBLISHED {deactivated}: the owner hid it
 * - `blocked`     — 410 ENTITY_NOT_PUBLISHED {blocked}: moderation did
 */
export type PublicErrorKind =
  | "not_found"
  | "unavailable"
  | "unpublished"
  | "blocked"
  | "rate_limited"
  | "generic";

export function mapPublicError(err: unknown): PublicErrorKind {
  if (isEntityNotPublished(err)) {
    const status = (err as ApiRequestError).details?.status;
    if (status === "blocked") return "blocked";
    if (status === "deleted") return "not_found";
    return "unpublished";
  }
  if (isQrNotScannable(err)) return "unavailable";
  if (isRateLimited(err)) return "rate_limited";
  if (
    err instanceof ApiRequestError &&
    (err.status === 404 ||
      err.code === ErrorCode.CardNotFound ||
      err.code === ErrorCode.QrNotFound)
  ) {
    return "not_found";
  }
  return "generic";
}

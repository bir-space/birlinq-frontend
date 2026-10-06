import type { PublicEntityPayload, QrCode } from "./types";

/**
 * Partner co-branding.
 *
 * A QR card sold through a partner (today: Geely dealerships) carries a
 * partner code, and every surface that belongs to that card — the public scan
 * page, the owner's card editor — is themed after the partner instead of
 * birlinq.
 *
 * ASSUMPTION (backend contract not published yet): the code arrives as
 * `meta.partner` on `GET /public/q/{code}` and as `partner` on the QR resource.
 * Both readers below are the ONLY places that know the field names — when the
 * backend's openapi.yaml lands, adjust them here and nothing else moves.
 */
export const PARTNER_CODES = ["geely"] as const;

export type PartnerCode = (typeof PARTNER_CODES)[number];

export function isPartnerCode(value: unknown): value is PartnerCode {
  return (
    typeof value === "string" &&
    (PARTNER_CODES as readonly string[]).includes(value)
  );
}

/** Partner of a scanned card, or null for a plain birlinq card. */
export function publicPartner(payload: PublicEntityPayload): PartnerCode | null {
  const raw = payload.meta.partner;
  return isPartnerCode(raw) ? raw : null;
}

/** Partner of a QR code in the owner cabinet, or null. */
export function qrPartner(qr: QrCode): PartnerCode | null {
  return isPartnerCode(qr.partner) ? qr.partner : null;
}

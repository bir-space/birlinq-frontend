import type { PartnerCode } from "@birlinq/api";

/**
 * Presentation data per partner. Display names are brand names and therefore
 * never translated (CLAUDE.md invariant 5); everything around them goes
 * through messages with `{partner}` interpolated.
 */
export const PARTNERS: Record<PartnerCode, { name: string; site: string }> = {
  geely: { name: "Geely", site: "https://geely.kz" },
};

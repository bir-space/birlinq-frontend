import type { PrivacySettings } from "@birlinq/api";

/**
 * The privacy switches a business card has — every key of
 * `PrivacySettings` except the two that describe a vehicle. The backend
 * accepts the whole set on PATCH /entities/{id}/privacy; a card simply never
 * shows the other two.
 */
export const CARD_PRIVACY_KEYS = [
  "show_display_name",
  "show_title",
  "show_company",
  "show_bio",
  "show_birthday",
  "show_phone",
  "show_phone2",
  "show_email",
  "show_whatsapp",
  "show_telegram",
  "show_website",
  "show_linkedin",
  "show_instagram",
  "show_socials",
  "show_tags",
] as const satisfies readonly (keyof PrivacySettings)[];

export type CardPrivacyKey = (typeof CARD_PRIVACY_KEYS)[number];

/** The 15 card switches, all present — what a preset sets and what `activeCardPreset` compares. */
export type CardPrivacy = Pick<PrivacySettings, CardPrivacyKey>;

/**
 * How the cabinet groups the switches: who the owner is versus how to reach
 * them. Presentation only — the backend knows no groups.
 */
export const CARD_PRIVACY_GROUPS = {
  personal: [
    "show_display_name",
    "show_title",
    "show_company",
    "show_bio",
    "show_birthday",
    "show_tags",
  ],
  contacts: [
    "show_phone",
    "show_phone2",
    "show_email",
    "show_whatsapp",
    "show_telegram",
    "show_website",
    "show_linkedin",
    "show_instagram",
    "show_socials",
  ],
} as const satisfies Record<string, readonly CardPrivacyKey[]>;

export type CardPrivacyGroup = keyof typeof CARD_PRIVACY_GROUPS;

export type CardPrivacyPreset = "card" | "open" | "minimal";

/** Picker order. */
export const CARD_PRIVACY_PRESETS = [
  "card",
  "open",
  "minimal",
] as const satisfies readonly CardPrivacyPreset[];

function preset(on: readonly CardPrivacyKey[]): CardPrivacy {
  const set = new Set<CardPrivacyKey>(on);
  return Object.fromEntries(
    CARD_PRIVACY_KEYS.map((key) => [key, set.has(key)])
  ) as CardPrivacy;
}

/**
 * The three starting points a card is offered.
 *
 * `card` is what a business card usually says out loud — who you are and
 * the professional channels — with phone numbers and messengers left off;
 * the demo card (backend seeder, mock fixtures) is this plus `show_phone`.
 * `open` shows everything; `minimal` is a name badge. None of them is
 * enforced anywhere: a preset is a PATCH of these 15 flags, after which the
 * owner flips switches one by one.
 */
export const PRIVACY_PRESETS: Record<CardPrivacyPreset, CardPrivacy> = {
  card: preset([
    "show_display_name",
    "show_title",
    "show_company",
    "show_bio",
    "show_tags",
    "show_socials",
    "show_website",
    "show_linkedin",
    "show_instagram",
    "show_email",
  ]),
  open: preset(CARD_PRIVACY_KEYS),
  minimal: preset(["show_display_name", "show_title", "show_company"]),
};

/** Just the card's 15 switches out of a full settings object. */
export function cardPrivacy(settings: PrivacySettings): CardPrivacy {
  return Object.fromEntries(
    CARD_PRIVACY_KEYS.map((key) => [key, settings[key]])
  ) as CardPrivacy;
}

/**
 * Which preset the current switches equal, or null when the owner has made
 * their own mix (or nothing is loaded yet). A card created before D-041 comes
 * back with the missing flags normalised to false by the resource, so the
 * comparison is always over all 15.
 */
export function activeCardPreset(
  settings: PrivacySettings | null
): CardPrivacyPreset | null {
  if (!settings) return null;
  for (const name of CARD_PRIVACY_PRESETS) {
    const wanted = PRIVACY_PRESETS[name];
    if (CARD_PRIVACY_KEYS.every((key) => settings[key] === wanted[key])) {
      return name;
    }
  }
  return null;
}

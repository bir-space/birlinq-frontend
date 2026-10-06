import type { EntityStats } from "@birlinq/api";

/**
 * `clicks_30d_by_channel` folded into the three tiles the cabinet shows,
 * plus the remainder. The backend keys clicks by `ContactChannel` or
 * `social:<platform>`; how those group into "calls", "social" and "website"
 * is a presentation choice, so it lives here rather than in the contract.
 */
export interface ClickSplit {
  /** phone + phone2 */
  calls: number;
  /** Messengers, the two profile fields and every `social:*` link. */
  social: number;
  website: number;
  /** email, and any channel a newer backend adds before this list learns it. */
  other: number;
}

const CALL_CHANNELS = new Set(["phone", "phone2"]);
const SOCIAL_CHANNELS = new Set([
  "whatsapp",
  "telegram",
  "linkedin",
  "instagram",
]);

export function splitClicks(byChannel: Record<string, number>): ClickSplit {
  const split: ClickSplit = { calls: 0, social: 0, website: 0, other: 0 };
  for (const [channel, count] of Object.entries(byChannel)) {
    if (CALL_CHANNELS.has(channel)) split.calls += count;
    else if (channel === "website") split.website += count;
    else if (SOCIAL_CHANNELS.has(channel) || channel.startsWith("social:"))
      split.social += count;
    else split.other += count;
  }
  return split;
}

/** The 30-day figures of one or many cards, added up. */
export interface StatsTotals {
  views: number;
  clicks: number;
  clickSplit: ClickSplit;
  vcardDownloads: number;
  shares: number;
}

export const EMPTY_TOTALS: StatsTotals = {
  views: 0,
  clicks: 0,
  clickSplit: { calls: 0, social: 0, website: 0, other: 0 },
  vcardDownloads: 0,
  shares: 0,
};

export function sumStats(all: readonly EntityStats[]): StatsTotals {
  const totals: StatsTotals = {
    ...EMPTY_TOTALS,
    clickSplit: { ...EMPTY_TOTALS.clickSplit },
  };
  for (const stats of all) {
    totals.views += stats.views_30d;
    totals.clicks += stats.clicks_30d;
    totals.vcardDownloads += stats.vcard_downloads_30d;
    totals.shares += stats.shares_30d;
    const split = splitClicks(stats.clicks_30d_by_channel);
    totals.clickSplit.calls += split.calls;
    totals.clickSplit.social += split.social;
    totals.clickSplit.website += split.website;
    totals.clickSplit.other += split.other;
  }
  return totals;
}

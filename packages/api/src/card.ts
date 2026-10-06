import type {
  CardTheme,
  ContactChannel,
  PublicTarget,
  ShareChannel,
  SocialPlatform,
} from "./types";

/**
 * Business-card vocabulary shared by every client: the closed enums as
 * iterable lists, the shape of the permanent address and the two public
 * paths (D-040, D-041, D-044).
 *
 * The backend is the authority on all of it. These mirrors let a form warn
 * before the round trip; they never replace the 422 or 409 that follows a
 * value the server disagrees with.
 */

/** App\Enums\CardTheme, in picker order. */
export const CARD_THEMES = [
  "default",
  "premium",
  "minimal",
  "vibrant",
  "sunset",
  "ocean",
  "forest",
  "elegant",
  "dark",
  "rosegold",
] as const satisfies readonly CardTheme[];

/** App\Enums\SocialPlatform, in editor order. */
export const SOCIAL_PLATFORMS = [
  "facebook",
  "x",
  "tiktok",
  "youtube",
  "vk",
  "github",
  "threads",
] as const satisfies readonly SocialPlatform[];

/**
 * Hosts a platform's profile URL may live on — App\Enums\SocialPlatform::hosts().
 * Subdomains count, so `m.facebook.com` and `www.youtube.com` pass.
 */
export const SOCIAL_PLATFORM_HOSTS: Record<SocialPlatform, readonly string[]> = {
  facebook: ["facebook.com", "fb.com", "fb.me"],
  x: ["x.com", "twitter.com"],
  tiktok: ["tiktok.com"],
  youtube: ["youtube.com", "youtu.be"],
  vk: ["vk.com", "vk.ru"],
  github: ["github.com"],
  threads: ["threads.net", "threads.com"],
};

/** App\Enums\ContactChannel, in the order the card renders its tiles. */
export const CONTACT_CHANNELS = [
  "phone",
  "phone2",
  "email",
  "whatsapp",
  "telegram",
  "website",
  "linkedin",
  "instagram",
] as const satisfies readonly ContactChannel[];

/** App\Enums\ShareChannel. */
export const SHARE_CHANNELS = [
  "native",
  "copy",
  "whatsapp",
  "telegram",
] as const satisfies readonly ShareChannel[];

/**
 * The shape of a card address drawn since D-044: eight characters of the
 * sticker alphabet in lower case — no 0/o, no i/l. The server draws it;
 * clients never build one. Here so the mock tree can mint the same shape.
 * Not a rule to validate against: addresses issued earlier keep their
 * 3..30-character shape forever (`demo`, `asel-nurlanova-k3p9`).
 */
export const ALIAS_ALPHABET = "123456789abcdefghjkmnpqrstuvwxyz";
export const ALIAS_LENGTH = 8;

/** Scheme, optional userinfo, then the host — stops at port, path, query or fragment. */
const HTTPS_HOST_RE = /^https:\/\/(?:[^@/?#]*@)?([^/?#:]+)/i;

/**
 * Client-side twin of App\Rules\SocialProfileUrl: https only, on one of the
 * platform's hosts or a subdomain of it. A regex rather than `new URL` so the
 * package keeps no dependency on a platform global.
 */
export function socialUrlMatchesPlatform(
  url: string,
  platform: SocialPlatform
): boolean {
  const match = HTTPS_HOST_RE.exec(url.trim());
  if (!match) return false;
  const host = match[1].toLowerCase().replace(/\.$/, "");
  return SOCIAL_PLATFORM_HOSTS[platform].some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

/** `/public/q/{code}` or `/public/c/{alias}` — the prefix of every public endpoint. */
export function publicPath(target: PublicTarget): string {
  return target.kind === "qr"
    ? `/public/q/${encodeURIComponent(target.code)}`
    : `/public/c/${encodeURIComponent(target.alias)}`;
}

import { LIMITS } from "./limits";
import type {
  CardTheme,
  ContactChannel,
  PublicTarget,
  ShareChannel,
  SocialPlatform,
} from "./types";

/**
 * Business-card vocabulary shared by every client: the closed enums as
 * iterable lists, the alias rules and the two public paths (D-040, D-041).
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

/** App\Domain\Entity\Alias::PATTERN — lower-case, 3..30 of `a-z 0-9 _ -`. */
export const ALIAS_RE = /^[a-z0-9_-]{3,30}$/;

/**
 * Mirror of `config/birlinq.php` → `alias.reserved`: route segments and
 * words that would read as ours. Used to warn in the field; the backend
 * answers 422 for these regardless, and its list is the one that counts.
 * `demo` is deliberately absent — the seeded demo card lives there.
 */
export const RESERVED_ALIASES: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "login",
  "logout",
  "register",
  "signup",
  "dashboard",
  "cabinet",
  "public",
  "card",
  "cards",
  "new",
  "edit",
  "profile",
  "settings",
  "pricing",
  "design",
  "mock",
  "static",
  "assets",
  "storage",
  "www",
  "mail",
  "support",
  "help",
  "about",
  "terms",
  "privacy",
  "offer",
  "consent",
  "contact",
  "themes",
  "qr",
  "root",
  "system",
  "test",
  "null",
  "undefined",
]);

/** An alias starting with any of these is reserved as well. */
export const RESERVED_ALIAS_PREFIXES = [
  "birlinq",
  "bir-",
  "support",
  "admin",
] as const;

/** True for a value the backend will refuse as reserved (expects a normalised alias). */
export function isReservedAlias(alias: string): boolean {
  return (
    RESERVED_ALIASES.has(alias) ||
    RESERVED_ALIAS_PREFIXES.some((prefix) => alias.startsWith(prefix))
  );
}

/**
 * What the alias field does to whatever was typed or pasted: lower-case,
 * whitespace to dashes, everything outside the alphabet dropped, clipped to
 * the limit. Does not guarantee validity — a two-character result still
 * fails `ALIAS_RE`, and a reserved word still fails `isReservedAlias`.
 */
export function normalizeAlias(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, LIMITS.alias);
}

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

/**
 * API types — written against birlinq-backend `main`
 * (routes/api.php + App\Http\Resources\Api\V1\* + App\Domain\*), plus the
 * business-card contract of D-040…D-043 (public alias, card fields, events,
 * stats, profile) that the backend ships ahead of the frontend.
 *
 * Where the spec's `components.schemas` block still carries older field names
 * (`plate_number`, `show_owner_name`, `type: [vehicle]`), the shapes below
 * follow the API Resources and the PrivacyFilter — that is what actually goes
 * over the wire.
 */

// ---------- Shared ----------

export interface ApiError {
  code: string;
  message: string;
  request_id: string;
  details?: Record<string, unknown>;
}

/** `GET /qr`, `GET /owner/interactions` — cursor meta. */
export interface QrCursorMeta {
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * `GET /entities` — cursor meta. `has_more` joined with D-041; a backend
 * from before it sends only `next_cursor` + `per_page`, so callers fall back:
 * `meta.has_more ?? meta.next_cursor !== null`.
 */
export interface EntityCursorMeta {
  next_cursor: string | null;
  has_more?: boolean;
  per_page: number;
}

export interface CursorPaginated<T, M> {
  data: T[];
  meta: M;
}

/** Backend locale codes. NB: backend uses "kz", web routing uses ISO "kk". */
export type ApiLocale = "ru" | "kz" | "en";

// ---------- Auth ----------

/** Shape of App\Http\Resources\Api\V1\UserResource. */
export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  /** null for phone-only accounts and for an address not confirmed yet. */
  email_verified_at: string | null;
  /**
   * When the person accepted the privacy policy and terms at registration
   * (D-045); null for accounts registered before consent was recorded.
   */
  privacy_accepted_at: string | null;
  /** The account avatar set through `authApi.uploadAvatar`; null when none. */
  avatar_url: string | null;
  created_at: string;
}

export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

/**
 * Body of register / login / refresh.
 *
 * Current backend: { user: {...}, tokens: { access_token, refresh_token, ... } }
 * An older AuthController spread them flat alongside `user`;
 * `normalizeAuthResponse` in client.ts accepts both.
 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokenPair;
}

/** Wire shape before normalization — either nesting is accepted. */
export type RawAuthResponse = Partial<AuthTokenPair> & {
  user?: User;
  tokens?: Partial<AuthTokenPair>;
};

export interface RegisterRequest {
  name: string;
  /** Exactly one of email / phone — sending both is rejected (`prohibited`). */
  email?: string;
  phone?: string; // ^77\d{9}$
  password: string; // min 8
  locale?: ApiLocale;
  device_name?: string;
  /**
   * Consent to the terms, the privacy policy and the processing of personal
   * data (D-045): must be JSON `true` — `false`, `null`, `"yes"`, `"on"` or
   * `"true"` are 422 with `details.privacy_accepted`. The moment comes back
   * as `user.privacy_accepted_at`.
   */
  privacy_accepted: true;
}

export interface LoginRequest {
  /** Exactly one of email / phone. */
  email?: string;
  phone?: string;
  password: string;
  device_name?: string;
}

/**
 * PATCH /auth/me (D-043). The phone is a login identifier, so changing it —
 * to a new number or to null — requires `current_password` and signs every
 * other device out. `phone: null` is accepted only when the account has an
 * email. The email itself is read-only here.
 */
export interface UpdateProfileRequest {
  name?: string; // 2..100
  phone?: string | null; // ^77\d{9}$
  current_password?: string;
}

/** POST /auth/password/change → 204 (D-043). Other sessions are revoked. */
export interface ChangePasswordRequest {
  current_password: string;
  password: string; // 8..100, must differ from the current one
}

// ---------- Entities ----------

/** App\Enums\EntityType — "vehicle" does NOT exist. */
export type EntityType = "car" | "personal" | "business";

/**
 * App\Enums\EntityStatus. `blocked` is set by moderation only (D-042); the
 * owner can neither set nor clear it, and PATCH-ing `status` while blocked
 * answers 409 ENTITY_BLOCKED.
 */
export type EntityStatus = "active" | "deactivated" | "blocked";

/** The two statuses an owner may PATCH — see `EntityStatus`. */
export type PublishStatus = Exclude<EntityStatus, "blocked">;

/** App\Enums\CardTheme — presentation only, applied on the public card. */
export type CardTheme =
  | "default"
  | "premium"
  | "minimal"
  | "vibrant"
  | "sunset"
  | "ocean"
  | "forest"
  | "elegant"
  | "dark"
  | "rosegold";

/** App\Enums\SocialPlatform — the networks without a dedicated contact field. */
export type SocialPlatform =
  | "facebook"
  | "x"
  | "tiktok"
  | "youtube"
  | "vk"
  | "github"
  | "threads";

/** One entry of `contact_profile.socials`. The URL must be https on a host of that platform. */
export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

/** App\Http\Resources\Api\V1\VehicleProfileResource. */
export interface VehicleProfile {
  make: string;
  model: string;
  year: number | null;
  color: string;
  license_plate: string | null;
  photo_url: string | null;
}

/** App\Http\Resources\Api\V1\ContactProfileResource. */
export interface ContactProfile {
  display_name: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  /** Full profile URL. */
  linkedin: string | null;
  /** Handle without "@": letters, digits, dot, underscore. */
  instagram: string | null;
  website: string | null;
  company: string | null;
  title: string | null;
  bio: string | null;
  /** Set by `uploadContactImage`; cleared with `photo_url: null` on PUT. */
  photo_url: string | null;
  cover_url: string | null;
  /** Never null — the column defaults to "default". */
  theme: CardTheme;
  /** Up to 10 tags of up to 30 characters, unique ignoring case. */
  tags: string[] | null;
  /** Y-m-d; the owner must be 18..120 years old. */
  date_of_birth: string | null;
  /** Up to 8 links, one per platform. */
  socials: SocialLink[] | null;
}

/**
 * App\Domain\Entity\Data\PrivacySettingsData — the exact key set the backend
 * accepts on PATCH /entities/{id}/privacy and returns in `privacy_settings`.
 * Rows written before D-041 hold fewer keys; the resource normalises them, so
 * a client always sees all 17.
 */
export interface PrivacySettings {
  show_year: boolean;
  show_license_plate: boolean;
  show_display_name: boolean;
  show_phone: boolean;
  show_phone2: boolean;
  show_email: boolean;
  show_whatsapp: boolean;
  show_telegram: boolean;
  show_linkedin: boolean;
  show_instagram: boolean;
  show_website: boolean;
  show_company: boolean;
  show_title: boolean;
  show_bio: boolean;
  show_birthday: boolean;
  show_socials: boolean;
  show_tags: boolean;
}

export const PRIVACY_KEYS = [
  "show_year",
  "show_license_plate",
  "show_display_name",
  "show_phone",
  "show_phone2",
  "show_email",
  "show_whatsapp",
  "show_telegram",
  "show_linkedin",
  "show_instagram",
  "show_website",
  "show_company",
  "show_title",
  "show_bio",
  "show_birthday",
  "show_socials",
  "show_tags",
] as const satisfies readonly (keyof PrivacySettings)[];

/** Defaults applied by Entity::booted() on create — everything personal is hidden. */
export const DEFAULT_PRIVACY: PrivacySettings = {
  show_year: true,
  show_license_plate: false,
  show_display_name: false,
  show_phone: false,
  show_phone2: false,
  show_email: false,
  show_whatsapp: false,
  show_telegram: false,
  show_linkedin: false,
  show_instagram: false,
  show_website: false,
  show_company: false,
  show_title: false,
  show_bio: false,
  show_birthday: false,
  show_socials: false,
  show_tags: false,
};

/**
 * App\Http\Resources\Api\V1\EntityResource.
 * `vehicle_profile` / `contact_profile` are `whenLoaded` — present (possibly
 * null) on every endpoint the SPA uses, absent nowhere today, but treat them
 * as optional to stay honest about the resource contract.
 */
export interface Entity {
  id: string;
  type: EntityType;
  title: string | null;
  status: EntityStatus;
  /**
   * The public link `/p/{alias}` — `personal` entities only, always null for
   * the rest. Assigned by the server and permanent (D-044): never chosen,
   * changed, released or reused. An address drawn since D-044 is eight
   * lower-case characters of the sticker alphabet; one issued earlier keeps
   * its 3..30-character shape (`demo`, `asel-nurlanova-k3p9`), so never
   * assume a length. A card created on the new backend always has one; null
   * on a card means an old row the backfill has not reached yet — show that
   * the address is pending rather than a broken link.
   */
  alias: string | null;
  privacy_settings: PrivacySettings | null;
  vehicle_profile?: VehicleProfile | null;
  contact_profile?: ContactProfile | null;
  created_at: string;
  updated_at: string;
}

/** Query of GET /entities. `limit` 1..100, default 20. */
export interface EntityListParams {
  type?: EntityType;
  cursor?: string;
  limit?: number;
}

/**
 * POST /entities (D-041). `contact` and `privacy_settings` are applied in the
 * same transaction, so a business card is one request instead of three.
 * The card's address is not a field: the server assigns it (D-044) and
 * answers 422 to any `alias` sent. 409 CARD_LIMIT_REACHED when
 * `cards.max_per_user` is hit.
 */
export interface CreateEntityRequest {
  type: EntityType;
  title?: string | null;
  privacy_settings?: Partial<PrivacySettings>;
  contact?: UpsertContactRequest;
}

/**
 * PATCH /entities/{id}. `status` while blocked answers 409 ENTITY_BLOCKED.
 * For a card, `deactivated` is the "unpublished" mark — a card is never
 * deleted (D-044). The address is permanent and cannot be sent here.
 */
export interface UpdateEntityRequest {
  title?: string | null;
  status?: PublishStatus;
}

/** PUT /entities/{id}/vehicle — make/model/color are required. */
export interface UpsertVehicleRequest {
  make: string;
  model: string;
  color: string;
  year?: number | null;
  license_plate?: string | null;
  photo_url?: string | null;
}

/**
 * PUT /entities/{id}/contact — every field optional. Images cannot be set to
 * a URL over JSON (D-041): `photo_url`/`cover_url` accept only `null`, which
 * clears the image and deletes the stored file. Uploads go through
 * `entitiesApi.uploadContactImage`.
 */
export type UpsertContactRequest = Partial<
  Omit<ContactProfile, "photo_url" | "cover_url">
> & {
  photo_url?: null;
  cover_url?: null;
};

/** Path segment of POST /entities/{id}/contact/{kind}. */
export type ContactImageKind = "photo" | "cover";

// ---------- Entity stats ----------

/** One bucket of `EntityStats.daily`, in the backend's stats timezone (Asia/Almaty by default). */
export interface DailyStat {
  /** Y-m-d */
  date: string;
  views: number;
  clicks: number;
}

/**
 * GET /entities/{id}/stats (D-041). `qr` counts raw scans, `link` counts
 * de-duplicated alias views (60 s window, known bots dropped). The `*_total`
 * figures only reach as far back as event retention.
 */
export interface EntityStats {
  views_total: number;
  views_7d: number;
  views_30d: number;
  views_30d_by_source: Record<PublicSource, number>;
  unique_visitors_30d: number;
  clicks_total: number;
  clicks_30d: number;
  /** Keyed by `ContactChannel` or `social:<SocialPlatform>`; a channel with no clicks is absent. */
  clicks_30d_by_channel: Record<string, number>;
  vcard_downloads_total: number;
  vcard_downloads_30d: number;
  shares_total: number;
  shares_30d: number;
  last_view_at: string | null;
  /**
   * Where the last 30 days of page opens came from, by referrer host,
   * most frequent first, ten at most (D-045). Opens with no referrer — a
   * camera app, a typed address, our own pages — are not listed.
   */
  referrers_30d: ReferrerStat[];
  /** 30 buckets, zero-filled, oldest first. */
  daily: DailyStat[];
}

/** One row of `EntityStats.referrers_30d`. */
export interface ReferrerStat {
  host: string;
  views: number;
}

// ---------- QR ----------

/** App\Enums\QrCodeStatus. */
export type QrStatus =
  | "created"
  | "printed"
  | "available"
  | "activated"
  | "paused"
  | "blocked"
  | "lost"
  | "deleted";

export interface QrCode {
  id: string;
  code: string;
  status: QrStatus;
  entity_id: string | null;
  activated_at: string | null;
  last_scan_at: string | null;
  scan_count: number;
}

export interface QrLookupRequest {
  code: string; // 6..24 chars
  activation_token: string; // <=128 chars
}

export interface QrActivateRequest extends QrLookupRequest {
  entity_id: string; // uuid
}

// ---------- Public scan ----------
// Shapes come from App\Domain\Scenarios\GetPublicPayloadAction + PrivacyFilter.

/**
 * The two doors to a public page: a sticker (`/public/q/{code}`) and a card's
 * link (`/public/c/{alias}`, D-040). Every public endpoint exists behind both.
 */
export type PublicTarget =
  | { kind: "qr"; code: string }
  | { kind: "alias"; alias: string };

/** How the visitor arrived — `meta.source` of the public payload. */
export type PublicSource = "qr" | "link";

export interface PublicScenario {
  id: string;
  code: string; // e.g. "car_blocking"
  title: string;
  description?: string | null;
  icon?: string | null;
  prefilled_message?: string | null;
}

/**
 * Vehicle block of the public payload. make/model/color are always present;
 * everything else is opt-in and — critically — *omitted, not nulled*, when the
 * owner keeps it private (PrivacyFilter). A missing key therefore says nothing
 * about whether the owner filled that field in.
 */
export interface PublicVehicle {
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  license_plate?: string;
  photo_url?: string;
}

/**
 * Contact block for `personal` entities. Every channel is opt-in; images have
 * no switch (uploading one is the decision to show it) but are still omitted
 * when unset. Render exactly the keys that arrived — nothing here is ever
 * hidden client-side.
 */
export interface PublicContact {
  display_name?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  company?: string;
  title?: string;
  bio?: string;
  photo_url?: string;
  cover_url?: string;
  /** Sent on every contact block since D-041; absent from older payloads — treat as "default". */
  theme?: CardTheme;
  /** Requires show_tags. */
  tags?: string[];
  /** Y-m-d, requires show_birthday. */
  birthday?: string;
  /** Requires show_socials. */
  socials?: SocialLink[];
}

export interface PublicEntityPayload {
  entity: {
    type: EntityType;
    title?: string | null;
    /**
     * Present for a `personal` card — its permanent address, the value to
     * build `/p/{alias}` and the QR from. Eight characters when drawn since
     * D-044, 3..30 when issued earlier; both are kept as they are.
     */
    alias?: string;
    /** Present for `car` entities. */
    vehicle?: PublicVehicle;
    /** Present for `personal` entities. */
    contact?: PublicContact;
  };
  scenarios: PublicScenario[];
  meta: {
    locale?: string;
    privacy_badge?: boolean;
    source?: PublicSource;
  };
}

export interface ScenarioSubmitRequest {
  message: string;
  visitor_locale?: ApiLocale;
}

export interface SubmissionAction {
  type: string; // e.g. "show_message", "send_notification"
  payload: Record<string, unknown>;
}

/**
 * "duplicate" — an identical submission from this visitor arrived inside the
 * dedup window (DEDUP_SCENARIO_WINDOW_MINUTES, 10 by default): the owner was
 * NOT notified again and `interaction_id` points at the original event. The
 * visitor still gets a success screen; from their side the message did land.
 */
export type SubmissionStatus = "accepted" | "duplicate";

export interface SubmissionResult {
  status: SubmissionStatus;
  interaction_id: string;
  actions: SubmissionAction[];
}

export interface LeadRequest {
  name: string;
  contact: string;
  city?: string;
}

/** 202 from POST /public/q/{code}/lead. */
export interface LeadAccepted {
  status: "accepted";
  lead_id: string;
}

export type AbuseReason = "spam" | "harassment" | "impersonation" | "other";

export interface AbuseRequest {
  reason?: AbuseReason;
  note?: string;
}

/** 202 from POST /public/{q|c}/{…}/abuse. */
export interface AbuseAccepted {
  status: "accepted";
  report_id: string;
}

// ---------- Public events (D-041) ----------

/** App\Enums\ContactChannel — the tappable fields of a card. */
export type ContactChannel =
  | "phone"
  | "phone2"
  | "email"
  | "whatsapp"
  | "telegram"
  | "linkedin"
  | "instagram"
  | "website";

/** App\Enums\ShareChannel. */
export type ShareChannel = "native" | "copy" | "whatsapp" | "telegram";

/** `channel` of a contact_click: a card field, or `social:<platform>` for the extra links. */
export type ClickChannel = ContactChannel | `social:${SocialPlatform}`;

/**
 * POST /public/{q|c}/{…}/events → 202. Fire-and-forget from the card: a
 * click on a contact tile or a share. Carries no PII — the payload stored is
 * the channel alone. No Idempotency-Key; the backend de-duplicates per
 * visitor for 60 s and answers `duplicate`.
 */
export type PublicEventRequest =
  | { type: "contact_click"; channel: ClickChannel }
  | { type: "share"; channel?: ShareChannel };

export interface PublicEventResult {
  status: "accepted" | "duplicate";
}

// ---------- Owner cabinet ----------

// ---------- Web push ----------

/**
 * Exactly what `PushSubscription.toJSON()` produces — the backend takes it
 * verbatim, so nothing here should ever be assembled by hand.
 */
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  content_encoding?: string | null;
}

export interface OwnerDashboard {
  total_qrs: number;
  active_qrs: number;
  scans_7d: number;
  scans_30d: number;
  submissions_7d: number;
  unresolved_interactions: number;
}

export type InteractionStatus = "new" | "resolved" | "spam";

/**
 * App\Http\Resources\Api\V1\InteractionResource. `scenario_code` and `message`
 * are read through an optional relation and the event payload respectively, so
 * either can come back null for an event that carries neither.
 */
export interface Interaction {
  id: string;
  qr_code_id: string;
  scenario_code: string | null;
  message: string | null;
  status: InteractionStatus;
  created_at: string;
}

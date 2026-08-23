/**
 * API types — written against birlinq-backend `main`
 * (routes/api.php + App\Http\Resources\Api\V1\* + App\Domain\*).
 *
 * The contract is now closed: all 27 paths in docs/api/openapi.yaml are
 * implemented. Where the spec's `components.schemas` block still carries older
 * field names (`plate_number`, `show_owner_name`, `type: [vehicle]`), the
 * shapes below follow the API Resources and the PrivacyFilter — that is what
 * actually goes over the wire.
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

/** `GET /entities` — cursor meta (this one returns per_page, not has_more). */
export interface EntityCursorMeta {
  next_cursor: string | null;
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
}

export interface LoginRequest {
  /** Exactly one of email / phone. */
  email?: string;
  phone?: string;
  password: string;
  device_name?: string;
}

// ---------- Entities ----------

/** App\Enums\EntityType — "vehicle" does NOT exist. */
export type EntityType = "car" | "personal";

/** App\Enums\EntityStatus. */
export type EntityStatus = "active" | "deactivated";

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
  company: string | null;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
}

/**
 * App\Domain\Entity\Data\PrivacySettingsData — the exact key set the backend
 * accepts on PATCH /entities/{id}/privacy and returns in `privacy_settings`.
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
  show_company: boolean;
  show_bio: boolean;
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
  "show_company",
  "show_bio",
] as const satisfies readonly (keyof PrivacySettings)[];

/** Defaults applied by Entity::booted() on create. */
export const DEFAULT_PRIVACY: PrivacySettings = {
  show_year: true,
  show_license_plate: false,
  show_display_name: false,
  show_phone: false,
  show_phone2: false,
  show_email: false,
  show_whatsapp: false,
  show_telegram: false,
  show_company: false,
  show_bio: false,
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
  privacy_settings: PrivacySettings | null;
  vehicle_profile?: VehicleProfile | null;
  contact_profile?: ContactProfile | null;
  created_at: string;
  updated_at: string;
}

/** POST /entities — the backend validates ONLY these two fields. */
export interface CreateEntityRequest {
  type: EntityType;
  title?: string | null;
}

/** PATCH /entities/{id}. */
export interface UpdateEntityRequest {
  title?: string | null;
  status?: EntityStatus;
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

/** PUT /entities/{id}/contact — every field optional. */
export type UpsertContactRequest = Partial<ContactProfile>;

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

/** Contact block for `personal` entities. Every channel is opt-in. */
export interface PublicContact {
  display_name?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  company?: string;
  bio?: string;
}

export interface PublicEntityPayload {
  entity: {
    type: EntityType;
    title?: string | null;
    /** Present for `car` entities. */
    vehicle?: PublicVehicle;
    /** Present for `personal` entities. */
    contact?: PublicContact;
  };
  scenarios: PublicScenario[];
  meta: {
    locale?: string;
    privacy_badge?: boolean;
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

/** 202 from POST /public/q/{code}/abuse. */
export interface AbuseAccepted {
  status: "accepted";
  report_id: string;
}

// ---------- Owner cabinet ----------

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

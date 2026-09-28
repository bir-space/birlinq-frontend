/**
 * Drop-in mock replacements for `@birlinq/api` endpoints, matching the same
 * method signatures but reading/writing in-memory fixtures instead of the
 * real backend. Used exclusively by the /mock preview pages and their
 * duplicated components under src/components/mock — never imported from a
 * real page.
 *
 * Signatures track the real module, including the split between
 * `POST /entities` (type, title, alias + nested contact/privacy) and
 * `PUT /entities/{id}/vehicle`, and privacy updates returning the whole
 * entity. Where the real backend filters (PrivacyFilter on the public card),
 * the mock filters the same way — it is playing the server, not the client.
 */
import {
  ALIAS_RE,
  ApiRequestError,
  ErrorCode,
  LIMITS,
  isReservedAlias,
  normalizeAlias,
} from "@birlinq/api";
import type { AppApi } from "@birlinq/api";
import type {
  AbuseAccepted,
  AbuseRequest,
  ApiLocale,
  AuthResponse,
  ChangePasswordRequest,
  ContactImageKind,
  CreateEntityRequest,
  CursorPaginated,
  Entity,
  EntityCursorMeta,
  EntityListParams,
  EntityStats,
  Interaction,
  LeadAccepted,
  LeadRequest,
  LoginRequest,
  OwnerDashboard,
  PrivacySettings,
  PublicContact,
  PublicEntityPayload,
  PublicEventRequest,
  PublicEventResult,
  PublicScenario,
  PublicSource,
  PublicTarget,
  QrActivateRequest,
  QrCode,
  QrCursorMeta,
  QrLookupRequest,
  RegisterRequest,
  ScenarioSubmitRequest,
  SubmissionResult,
  UpdateEntityRequest,
  UpdateProfileRequest,
  UpsertContactRequest,
  UpsertVehicleRequest,
  User,
} from "@birlinq/api";
import {
  DEFAULT_MOCK_PRIVACY,
  EMPTY_CONTACT_PROFILE,
  MOCK_CARD_SCENARIOS,
  MOCK_CARD_STATS,
  MOCK_DASHBOARD,
  MOCK_ENTITIES,
  MOCK_INTERACTIONS,
  MOCK_PUBLIC_PAYLOAD,
  MOCK_QR_CODES,
  MOCK_USER,
} from "./fixtures";

const LATENCY_MS = 500;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let nextId = 1;
function genId(prefix: string): string {
  return `${prefix}-mock-${nextId++}`;
}

// In-memory copies so edits made while clicking through a mock page persist
// for the rest of that browser session but never touch the fixtures module.
let user: User = { ...MOCK_USER };
let entities: Entity[] = MOCK_ENTITIES.map((e) => ({
  ...e,
  privacy_settings: e.privacy_settings ? { ...e.privacy_settings } : null,
  vehicle_profile: e.vehicle_profile ? { ...e.vehicle_profile } : null,
  contact_profile: e.contact_profile ? { ...e.contact_profile } : null,
}));
let qrCodes: QrCode[] = MOCK_QR_CODES.map((q) => ({ ...q }));
let interactions: Interaction[] = MOCK_INTERACTIONS.map((i) => ({ ...i }));

/** Long enough to satisfy the real token guard, in case it ever gets wired up. */
const MOCK_ACCESS_TOKEN = "mock-access-token-".padEnd(64, "0");
const MOCK_REFRESH_TOKEN = "mock-refresh-token-".padEnd(64, "0");

/** The profile page's failure cases: the number another account holds, and the password that never matches. */
const MOCK_PHONE_RE = /^77\d{9}$/;
const MOCK_TAKEN_PHONE = "77000000000";
const MOCK_WRONG_PASSWORD = "wrong";

function mockAuthResponse(): AuthResponse {
  return {
    user,
    tokens: {
      access_token: MOCK_ACCESS_TOKEN,
      refresh_token: MOCK_REFRESH_TOKEN,
      token_type: "Bearer",
      expires_in: 900,
    },
  };
}

function findEntity(id: string): Entity {
  const entity = entities.find((e) => e.id === id);
  if (!entity) {
    throw new ApiRequestError(404, {
      code: "NOT_FOUND",
      message: "Entity not found",
    });
  }
  return entity;
}

function replaceEntity(id: string, patch: (e: Entity) => Entity): Entity {
  findEntity(id);
  entities = entities.map((e) =>
    e.id === id ? { ...patch(e), updated_at: new Date().toISOString() } : e
  );
  return entities.find((e) => e.id === id)!;
}

function byType(type: EntityListParams["type"]): Entity[] {
  return type ? entities.filter((e) => e.type === type) : entities;
}

/** 422 in the backend's envelope — `details` is `{ field: [message] }`, like Laravel's. */
function validation(details: Record<string, string>): ApiRequestError {
  return new ApiRequestError(422, {
    code: ErrorCode.ValidationError,
    message: "The given data was invalid.",
    details: Object.fromEntries(
      Object.entries(details).map(([field, message]) => [field, [message]])
    ),
  });
}

function conflict(code: string, message: string): ApiRequestError {
  return new ApiRequestError(409, { code, message });
}

/**
 * The alias rules the backend enforces on POST/PATCH (D-040): normalised,
 * 3..30 of the alphabet, not reserved, not on a car, not held by another
 * entity. Returns the value to store.
 */
function checkAlias(
  raw: string,
  type: Entity["type"],
  exceptId: string | null
): string {
  if (type !== "personal") {
    throw validation({ alias: "Only a business card can have a public link." });
  }
  const alias = normalizeAlias(raw);
  if (!ALIAS_RE.test(alias)) {
    throw validation({
      alias: `Use ${LIMITS.aliasMin}–${LIMITS.alias} lower-case letters, digits, "-" or "_".`,
    });
  }
  if (isReservedAlias(alias)) {
    throw validation({ alias: "This address is reserved." });
  }
  if (entities.some((e) => e.alias === alias && e.id !== exceptId)) {
    throw conflict(ErrorCode.AliasTaken, "Alias is already taken");
  }
  return alias;
}

const ALIAS_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** `card-xxxx`, like the backend's fallback when the name cannot be used. */
function generateAlias(): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += ALIAS_ALPHABET[Math.floor(Math.random() * ALIAS_ALPHABET.length)];
    }
    const alias = `card-${suffix}`;
    if (!entities.some((e) => e.alias === alias)) return alias;
  }
  return `card-${Date.now().toString(36).slice(-6)}`;
}

/** Opaque to the caller, an offset here: enough to walk pages the way the real cursor does. */
function parseCursor(cursor: string | undefined): number {
  const n = cursor ? Number.parseInt(cursor, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Thirty zero buckets ending today — the shape the charts expect, no numbers yet. */
function emptyStats(): EntityStats {
  const daily = Array.from({ length: 30 }, (_, i) => {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - (29 - i));
    return { date: day.toISOString().slice(0, 10), views: 0, clicks: 0 };
  });
  return {
    views_total: 0,
    views_7d: 0,
    views_30d: 0,
    views_30d_by_source: { qr: 0, link: 0 },
    unique_visitors_30d: 0,
    clicks_total: 0,
    clicks_30d: 0,
    clicks_30d_by_channel: {},
    vcard_downloads_total: 0,
    vcard_downloads_30d: 0,
    shares_total: 0,
    shares_30d: 0,
    last_view_at: null,
    daily,
  };
}

/**
 * The mock's PrivacyFilter, with the backend's rule: a hidden field is
 * omitted, never nulled, and an empty list counts as hidden. `theme` is the
 * one key that always travels. Images have no switch. Scenarios ride along
 * behind the sticker door only.
 */
function cardPayload(
  entity: Entity,
  source: PublicSource = "link",
  scenarios: PublicScenario[] = []
): PublicEntityPayload {
  const privacy = entity.privacy_settings ?? DEFAULT_MOCK_PRIVACY;
  const profile = entity.contact_profile ?? EMPTY_CONTACT_PROFILE;
  const contact: PublicContact = { theme: profile.theme };
  const put = <K extends keyof PublicContact>(
    key: K,
    allowed: boolean,
    value: PublicContact[K] | null
  ) => {
    if (!allowed || value === null || value === undefined) return;
    if (Array.isArray(value) && value.length === 0) return;
    contact[key] = value;
  };
  put("display_name", privacy.show_display_name, profile.display_name);
  put("phone", privacy.show_phone, profile.phone);
  put("phone2", privacy.show_phone2, profile.phone2);
  put("email", privacy.show_email, profile.email);
  put("whatsapp", privacy.show_whatsapp, profile.whatsapp);
  put("telegram", privacy.show_telegram, profile.telegram);
  put("linkedin", privacy.show_linkedin, profile.linkedin);
  put("instagram", privacy.show_instagram, profile.instagram);
  put("website", privacy.show_website, profile.website);
  put("company", privacy.show_company, profile.company);
  put("title", privacy.show_title, profile.title);
  put("bio", privacy.show_bio, profile.bio);
  put("photo_url", true, profile.photo_url);
  put("cover_url", true, profile.cover_url);
  put("tags", privacy.show_tags, profile.tags);
  put("birthday", privacy.show_birthday, profile.date_of_birth);
  put("socials", privacy.show_socials, profile.socials);
  return {
    entity: {
      type: "personal",
      title: entity.title,
      ...(entity.alias ? { alias: entity.alias } : {}),
      contact,
    },
    scenarios,
    meta: { locale: "ru", privacy_badge: true, source },
  };
}

/**
 * 410 ENTITY_NOT_PUBLISHED with the status the backend reports (D-040) —
 * `deleted` is the one value that is not an `EntityStatus`: a soft-deleted
 * card behind a still-live sticker.
 */
function notPublished(status: Entity["status"] | "deleted"): ApiRequestError {
  return new ApiRequestError(410, {
    code: "ENTITY_NOT_PUBLISHED",
    message: "Entity is not published",
    details: { status },
  });
}

/** The entity behind a public target, or null when the door leads nowhere. */
function resolveTarget(target: PublicTarget): Entity | null {
  if (target.kind === "alias") {
    const wanted = target.alias.toLowerCase();
    return (
      entities.find((e) => e.type === "personal" && e.alias === wanted) ?? null
    );
  }
  const code = target.code.toUpperCase();
  const qr = qrCodes.find((q) => q.code === code);
  if (!qr?.entity_id) return null;
  return entities.find((e) => e.id === qr.entity_id) ?? null;
}

/** vCard 3.0 escaping: backslash, comma, semicolon, newline. */
function vEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

/**
 * The vCard the real endpoint would serve — built from the same
 * privacy-filtered payload as the page, so it never carries a hidden field.
 */
function buildVcard(payload: PublicEntityPayload): string {
  const c = payload.entity.contact ?? {};
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const name = c.display_name ?? "";
  lines.push(`FN:${vEscape(name)}`, `N:${vEscape(name)};;;;`);
  if (c.title) lines.push(`TITLE:${vEscape(c.title)}`);
  if (c.company) lines.push(`ORG:${vEscape(c.company)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${vEscape(c.phone)}`);
  if (c.phone2) lines.push(`TEL;TYPE=WORK:${vEscape(c.phone2)}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${vEscape(c.email)}`);
  if (c.website) lines.push(`URL:${vEscape(c.website)}`);
  if (c.bio) lines.push(`NOTE:${vEscape(c.bio)}`);
  if (c.birthday) lines.push(`BDAY:${c.birthday}`);
  if (c.tags?.length) lines.push(`CATEGORIES:${c.tags.map(vEscape).join(",")}`);
  for (const s of c.socials ?? []) {
    const type = s.platform === "x" ? "twitter" : s.platform;
    lines.push(`X-SOCIALPROFILE;TYPE=${type}:${vEscape(s.url)}`);
  }
  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}

export const mockAuthApi = {
  async register(_body: RegisterRequest): Promise<AuthResponse> {
    return delay(mockAuthResponse());
  },

  async login(_body: LoginRequest): Promise<AuthResponse> {
    return delay(mockAuthResponse());
  },

  async logout(): Promise<void> {
    return delay(undefined);
  },

  async logoutAll(): Promise<void> {
    return delay(undefined);
  },

  async me(): Promise<{ user: User }> {
    return delay({ user });
  },

  /**
   * PATCH /auth/me the way UpdateProfileRequest validates it: the name
   * 2..100, the phone `^77\d{9}$` and unique — `77000000000` plays the
   * number someone else already holds — and any phone change needs the
   * current password, `wrong` being the one that does not match.
   */
  async updateProfile(body: UpdateProfileRequest): Promise<{ user: User }> {
    const details: Record<string, string> = {};
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (name.length < LIMITS.profileNameMin || name.length > LIMITS.name) {
        details.name = `The name must be between ${LIMITS.profileNameMin} and ${LIMITS.name} characters.`;
      }
    }
    if (body.phone !== undefined) {
      if (body.phone === null && user.email === null) {
        details.phone = "The phone cannot be removed from an account without an email.";
      } else if (body.phone !== null && !MOCK_PHONE_RE.test(body.phone)) {
        details.phone = "The phone format is invalid.";
      } else if (body.phone === MOCK_TAKEN_PHONE) {
        details.phone = "The phone has already been taken.";
      }
      if (!body.current_password) {
        details.current_password = "The current password field is required.";
      } else if (body.current_password === MOCK_WRONG_PASSWORD) {
        details.current_password = "The password is incorrect.";
      }
    }
    if (Object.keys(details).length > 0) throw validation(details);

    await delay(undefined);
    user = {
      ...user,
      name: body.name !== undefined ? body.name.trim() : user.name,
      phone: body.phone !== undefined ? body.phone : user.phone,
    };
    return { user };
  },

  /** POST /auth/password/change: `wrong` fails the current password; the new one is 8..100 and different. */
  async changePassword(body: ChangePasswordRequest): Promise<void> {
    const details: Record<string, string> = {};
    if (body.current_password === MOCK_WRONG_PASSWORD) {
      details.current_password = "The password is incorrect.";
    }
    if (
      body.password.length < LIMITS.passwordMin ||
      body.password.length > LIMITS.password
    ) {
      details.password = `The password must be between ${LIMITS.passwordMin} and ${LIMITS.password} characters.`;
    } else if (body.password === body.current_password) {
      details.password = "The new password must be different from the current one.";
    }
    if (Object.keys(details).length > 0) throw validation(details);
    return delay(undefined);
  },

  async verifyEmail(_token: string): Promise<void> {
    return delay(undefined);
  },

  async forgotPassword(_email: string): Promise<void> {
    return delay(undefined);
  },

  async resetPassword(_token: string, _password: string): Promise<void> {
    return delay(undefined);
  },
};

export const mockEntitiesApi = {
  /** Newest first, `limit` per page (1..100, default 20), the cursor an offset in disguise. */
  async list(
    params?: EntityListParams
  ): Promise<CursorPaginated<Entity, EntityCursorMeta>> {
    const perPage = Math.min(
      Math.max(params?.limit ?? 20, 1),
      LIMITS.entitiesLimitMax
    );
    const all = byType(params?.type);
    const start = parseCursor(params?.cursor);
    const end = start + perPage;
    return delay({
      data: all.slice(start, end),
      meta: {
        next_cursor: end < all.length ? String(end) : null,
        has_more: end < all.length,
        per_page: perPage,
      },
    });
  },

  async listAll(params?: Omit<EntityListParams, "cursor">): Promise<Entity[]> {
    return delay(byType(params?.type));
  },

  /**
   * POST /entities as D-041 shapes it: nested contact and privacy applied
   * together; a card's alias validated (422) or checked for a holder (409
   * ALIAS_TAKEN) and minted as `card-xxxx` when the request carries none.
   * No card limit — `cards.max_per_user` is null by default on the backend
   * too, so CARD_LIMIT_REACHED is not reachable here.
   */
  async create(
    body: CreateEntityRequest,
    _opts?: { idempotencyKey?: string }
  ): Promise<{ entity: Entity }> {
    const now = new Date().toISOString();
    const isCard = body.type === "personal";
    if (isCard) {
      const name = body.contact?.display_name?.trim() ?? "";
      if (name.length < 2) {
        throw validation({
          "contact.display_name": "The display name must be at least 2 characters.",
        });
      }
    }
    const alias =
      body.alias !== undefined && body.alias !== ""
        ? checkAlias(body.alias, body.type, null)
        : isCard
          ? generateAlias()
          : null;
    const entity: Entity = {
      id: genId("entity"),
      type: body.type,
      title: body.title ?? null,
      status: "active",
      alias,
      privacy_settings: { ...DEFAULT_MOCK_PRIVACY, ...body.privacy_settings },
      vehicle_profile: null,
      contact_profile: body.contact
        ? { ...EMPTY_CONTACT_PROFILE, ...body.contact }
        : null,
      created_at: now,
      updated_at: now,
    };
    entities = [entity, ...entities];
    return delay({ entity });
  },

  async get(id: string): Promise<{ entity: Entity }> {
    return delay({ entity: findEntity(id) });
  },

  /**
   * PATCH /entities/{id}: `status` on a blocked entity is 409 ENTITY_BLOCKED
   * (D-042); `alias: null` closes the link, a slug is validated and checked
   * against every other entity (D-040).
   */
  async update(
    id: string,
    body: UpdateEntityRequest
  ): Promise<{ entity: Entity }> {
    const current = findEntity(id);
    if (body.status !== undefined && current.status === "blocked") {
      throw conflict(ErrorCode.EntityBlocked, "Entity is blocked by moderation");
    }
    const alias =
      body.alias === undefined
        ? current.alias
        : body.alias === null
          ? null
          : checkAlias(body.alias, current.type, id);
    const entity = replaceEntity(id, (e) => ({
      ...e,
      title: body.title !== undefined ? body.title : e.title,
      status: body.status ?? e.status,
      alias,
    }));
    return delay({ entity });
  },

  /** DELETE — gone for good here (the backend soft-deletes); 409 while moderation holds it. */
  async remove(id: string): Promise<void> {
    const entity = findEntity(id);
    if (entity.status === "blocked") {
      throw conflict(ErrorCode.EntityBlocked, "Entity is blocked by moderation");
    }
    entities = entities.filter((e) => e.id !== id);
    return delay(undefined);
  },

  async upsertVehicle(
    id: string,
    body: UpsertVehicleRequest
  ): Promise<{ entity: Entity }> {
    const entity = replaceEntity(id, (e) => ({
      ...e,
      vehicle_profile: {
        make: body.make,
        model: body.model,
        color: body.color,
        year: body.year ?? null,
        license_plate: body.license_plate ?? null,
        photo_url: body.photo_url ?? e.vehicle_profile?.photo_url ?? null,
      },
    }));
    return delay({ entity });
  },

  async upsertContact(
    id: string,
    body: UpsertContactRequest
  ): Promise<{ entity: Entity }> {
    const entity = replaceEntity(id, (e) => ({
      ...e,
      contact_profile: {
        ...EMPTY_CONTACT_PROFILE,
        ...e.contact_profile,
        ...body,
      },
    }));
    return delay({ entity });
  },

  /** The real endpoint stores the file and returns its URL; here the browser keeps it. */
  async uploadContactImage(
    id: string,
    kind: ContactImageKind,
    file: Blob,
    _filename?: string
  ): Promise<{ entity: Entity }> {
    const url =
      typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : null;
    const entity = replaceEntity(id, (e) => ({
      ...e,
      contact_profile:
        kind === "photo"
          ? { ...EMPTY_CONTACT_PROFILE, ...e.contact_profile, photo_url: url }
          : { ...EMPTY_CONTACT_PROFILE, ...e.contact_profile, cover_url: url },
    }));
    return delay({ entity });
  },

  /** Merge semantics, returns the entity — same as PATCH /entities/{id}/privacy. */
  async updatePrivacy(
    id: string,
    body: Partial<PrivacySettings>
  ): Promise<{ entity: Entity }> {
    const entity = replaceEntity(id, (e) => ({
      ...e,
      privacy_settings: {
        ...(e.privacy_settings ?? DEFAULT_MOCK_PRIVACY),
        ...body,
      },
    }));
    return delay({ entity });
  },

  /** The demo card has thirty days of figures; every other entity starts at zero. */
  async stats(id: string): Promise<{ stats: EntityStats }> {
    findEntity(id);
    return delay({ stats: id === "entity-3" ? MOCK_CARD_STATS : emptyStats() });
  },

  async createVehicle(
    vehicle: UpsertVehicleRequest,
    title?: string | null
  ): Promise<Entity> {
    const { entity } = await mockEntitiesApi.create({
      type: "car",
      ...(title ? { title } : {}),
    });
    const { entity: withProfile } = await mockEntitiesApi.upsertVehicle(
      entity.id,
      vehicle
    );
    return withProfile;
  },
};

export const mockQrApi = {
  /**
   * A code from the fixtures answers with its real state, so binding an
   * already-activated sticker (`AB12CD34`) to a card shows the "taken"
   * outcome. Any other code resolves as available, so the activation wizard
   * demo can be walked end to end.
   */
  async lookup(body: QrLookupRequest): Promise<{ qr_code: QrCode }> {
    const code = (body.code || "DEMO1234").toUpperCase();
    const known = qrCodes.find((q) => q.code === code);
    if (known) return delay({ qr_code: known });
    return delay({
      qr_code: {
        id: `qr-${code.toLowerCase()}`,
        code,
        status: "available",
        entity_id: null,
        activated_at: null,
        last_scan_at: null,
        scan_count: 0,
      },
    });
  },

  /** The sticker joins the in-memory list bound to the entity, so GET /qr shows it afterwards. */
  async activate(body: QrActivateRequest): Promise<{ qr_code: QrCode }> {
    const code = body.code.toUpperCase();
    const known = qrCodes.find((q) => q.code === code);
    if (known && known.status === "activated") {
      throw conflict(ErrorCode.QrAlreadyActivated, "QR code is already activated");
    }
    if (qrCodes.some((q) => q.entity_id === body.entity_id && q.status === "activated")) {
      throw conflict(
        ErrorCode.EntityAlreadyHasQr,
        "Entity already has an active QR code"
      );
    }
    const qr_code: QrCode = {
      id: known?.id ?? `qr-${code.toLowerCase()}`,
      code,
      status: "activated",
      entity_id: body.entity_id,
      activated_at: new Date().toISOString(),
      last_scan_at: null,
      scan_count: 0,
    };
    qrCodes = [...qrCodes.filter((q) => q.id !== qr_code.id), qr_code];
    return delay({ qr_code });
  },

  async list(_cursor?: string): Promise<CursorPaginated<QrCode, QrCursorMeta>> {
    return delay({
      data: qrCodes,
      meta: { next_cursor: null, has_more: false },
    });
  },

  async listAll(): Promise<QrCode[]> {
    return delay(qrCodes);
  },

  async get(id: string): Promise<{ qr_code: QrCode }> {
    const qr = qrCodes.find((q) => q.id === id);
    if (!qr) {
      throw new ApiRequestError(404, {
        code: "QR_NOT_FOUND",
        message: "QR code not found",
      });
    }
    return delay({ qr_code: qr });
  },

  async pause(id: string): Promise<{ qr_code: QrCode }> {
    qrCodes = qrCodes.map((q) => (q.id === id ? { ...q, status: "paused" } : q));
    return delay({ qr_code: qrCodes.find((q) => q.id === id)! });
  },

  async resume(id: string): Promise<{ qr_code: QrCode }> {
    qrCodes = qrCodes.map((q) =>
      q.id === id ? { ...q, status: "activated" } : q
    );
    return delay({ qr_code: qrCodes.find((q) => q.id === id)! });
  },
};

export const mockPublicApi = {
  /**
   * A sticker from the fixtures resolves like the real door: paused → 410
   * QR_NOT_SCANNABLE, a hidden card behind it → 410 ENTITY_NOT_PUBLISHED,
   * `PERS1234` → the demo card with `source: "qr"` and its scenarios. Any
   * code the fixtures do not know keeps answering the demo car, so the
   * existing `/mock/q/…` links stay a preview and never a 404.
   */
  async scan(code: string, _locale?: ApiLocale): Promise<PublicEntityPayload> {
    const qr = qrCodes.find((q) => q.code === code.toUpperCase());
    if (!qr) return delay(MOCK_PUBLIC_PAYLOAD);
    if (qr.status !== "activated") {
      throw new ApiRequestError(410, {
        code: "QR_NOT_SCANNABLE",
        message: "QR code is not scannable",
        details: { status: qr.status },
      });
    }
    const entity = qr.entity_id
      ? entities.find((e) => e.id === qr.entity_id)
      : undefined;
    if (!entity) throw notPublished("deleted");
    if (entity.status !== "active") throw notPublished(entity.status);
    if (entity.type !== "personal") {
      return delay({
        ...MOCK_PUBLIC_PAYLOAD,
        meta: { ...MOCK_PUBLIC_PAYLOAD.meta, source: "qr" },
      });
    }
    return delay(cardPayload(entity, "qr", MOCK_CARD_SCENARIOS));
  },

  /** 404 / 410 exactly like the real resolver, so the error screens are reachable. */
  async card(alias: string, _locale?: ApiLocale): Promise<PublicEntityPayload> {
    const entity = resolveTarget({ kind: "alias", alias });
    if (!entity) {
      throw new ApiRequestError(404, {
        code: "CARD_NOT_FOUND",
        message: "Card not found",
      });
    }
    if (entity.status !== "active") throw notPublished(entity.status);
    return delay(cardPayload(entity, "link"));
  },

  /**
   * No server to download from: the vCard is built here from the
   * privacy-filtered payload and handed over as a data URL, so the
   * "save contact" link is a real download in the preview too.
   */
  vcardUrl(target: PublicTarget): string {
    const entity = resolveTarget(target);
    const vcard =
      entity && entity.type === "personal"
        ? buildVcard(cardPayload(entity))
        : "BEGIN:VCARD\r\nVERSION:3.0\r\nEND:VCARD\r\n";
    return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;
  },

  async trackEvent(
    _target: PublicTarget,
    _body: PublicEventRequest
  ): Promise<PublicEventResult> {
    return delay({ status: "accepted" }, 0);
  },

  async submitScenario(
    _code: string,
    _scenarioId: string,
    _body: ScenarioSubmitRequest
  ): Promise<SubmissionResult> {
    return delay({
      status: "accepted",
      interaction_id: genId("interaction"),
      actions: [
        {
          type: "show_message",
          payload: { message: "Спасибо, уже иду к машине!" },
        },
      ],
    });
  },

  async submitLead(
    _code: string,
    _body: LeadRequest,
    _locale?: ApiLocale
  ): Promise<LeadAccepted> {
    return delay({ status: "accepted", lead_id: genId("lead") });
  },

  async reportAbuse(
    _target: PublicTarget,
    _body: AbuseRequest
  ): Promise<AbuseAccepted> {
    return delay({ status: "accepted", report_id: genId("abuse") });
  },
};

export const mockOwnerApi = {
  async dashboard(): Promise<OwnerDashboard> {
    return delay(MOCK_DASHBOARD);
  },

  async interactions(params?: {
    cursor?: string;
    limit?: number;
    qr_code_id?: string;
    since?: string;
  }): Promise<CursorPaginated<Interaction, QrCursorMeta>> {
    const limit = params?.limit ?? 20;
    return delay({
      data: interactions.slice(0, limit),
      meta: { next_cursor: null, has_more: false },
    });
  },

  /** 204 with no body, like the real endpoint — the caller updates its copy. */
  async resolveInteraction(id: string): Promise<void> {
    if (!interactions.some((i) => i.id === id)) {
      throw new ApiRequestError(404, {
        code: "INTERACTION_NOT_FOUND",
        message: "Interaction not found",
      });
    }
    interactions = interactions.map((i) =>
      i.id === id ? { ...i, status: "resolved" } : i
    );
    return delay(undefined);
  },
};

/**
 * Push in the preview tree accepts and forgets. The real thing needs a service
 * worker, a VAPID key and a permission prompt; none of that belongs in a
 * fixture tree whose whole point is to render without a backend.
 */
const mockPushApi: AppApi["push"] = {
  subscribe: async () => {},
  unsubscribe: async () => {},
};

/**
 * The mock tree's `AppApi` value. Shape-checked against the real one by the
 * `AppApi` annotation — if an endpoint's signature changes in
 * `packages/api/src/endpoints.ts`, this fails to compile instead of silently
 * drifting, which is the whole point of routing both trees through one type.
 */
export const mockApi: AppApi = {
  auth: mockAuthApi,
  entities: mockEntitiesApi,
  qr: mockQrApi,
  public: mockPublicApi,
  owner: mockOwnerApi,
  push: mockPushApi,
};

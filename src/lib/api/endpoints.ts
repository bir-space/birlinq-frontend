import {
  MalformedAuthResponseError,
  apiFetch,
  newIdempotencyKey,
  normalizeAuthResponse,
} from "./client";
import type {
  AbuseAccepted,
  AbuseRequest,
  ApiLocale,
  AuthResponse,
  CreateEntityRequest,
  CursorPaginated,
  Entity,
  EntityCursorMeta,
  Interaction,
  LeadAccepted,
  LeadRequest,
  LoginRequest,
  OwnerDashboard,
  PrivacySettings,
  PublicEntityPayload,
  QrActivateRequest,
  QrCode,
  QrCursorMeta,
  QrLookupRequest,
  RegisterRequest,
  ScenarioSubmitRequest,
  SubmissionResult,
  UpdateEntityRequest,
  UpsertContactRequest,
  UpsertVehicleRequest,
  User,
} from "./types";
import { tokenStore } from "../auth/token-store";

// ---------- Auth ----------

/** Shared tail of register/login: verify the body before trusting it. */
async function startSession(
  path: "/auth/register" | "/auth/login",
  body: RegisterRequest | LoginRequest
): Promise<AuthResponse> {
  const auth = normalizeAuthResponse(
    await apiFetch<unknown>(path, { method: "POST", body })
  );
  // A 2xx without a usable token pair must not half-authenticate the app:
  // writing `undefined` to storage is what produced TOKEN_ABSENT followed by
  // a 422 on refresh.
  if (!auth) throw new MalformedAuthResponseError();
  tokenStore.setSession(auth);
  return auth;
}

export const authApi = {
  /**
   * POST /auth/register → 201 { user, tokens }.
   * Throttled to RATELIMIT_REGISTER_PER_HOUR (5/hour) per source address, so
   * 429 is a normal outcome to surface, not a bug.
   * Accounts created with an email are mailed a verification *code* (a 64-hex
   * token, no link — see `verifyEmail`); phone-only accounts never get one and
   * have nothing to confirm.
   */
  register(body: RegisterRequest): Promise<AuthResponse> {
    return startSession("/auth/register", body);
  },

  /**
   * POST /auth/login → 200 { user, tokens }.
   * Throttled on IP *and* identifier together (10 per 5 min): one account
   * guessed from one source gets blocked without locking the real owner out.
   */
  login(body: LoginRequest): Promise<AuthResponse> {
    return startSession("/auth/login", body);
  },

  /**
   * POST /auth/logout → 204. Revokes the refresh token of *this* session only
   * (identified by a claim inside the access token) and invalidates the
   * presented access token. Other devices stay signed in — use `logoutAll` to
   * end every session.
   */
  async logout(): Promise<void> {
    try {
      if (tokenStore.hasSession()) {
        await apiFetch<void>("/auth/logout", { method: "POST", auth: true });
      }
    } catch {
      // Local sign-out must succeed even if the call fails.
    } finally {
      tokenStore.clear();
    }
  },

  /**
   * POST /auth/logout-all → 204. Revokes every refresh token of the user.
   * The button for "sign out everywhere" after a suspected compromise.
   */
  async logoutAll(): Promise<void> {
    try {
      if (tokenStore.hasSession()) {
        await apiFetch<void>("/auth/logout-all", { method: "POST", auth: true });
      }
    } catch {
      // Same as logout: never trap the user in a session locally.
    } finally {
      tokenStore.clear();
    }
  },

  /** GET /auth/me → { user } */
  me(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/auth/me", { auth: true });
  },

  /**
   * POST /auth/verify-email → 204. Single use, 24 h TTL.
   * The token is 64 hex characters and arrives in the email as a code to
   * paste — there is no link, so the UI has to offer a field for it.
   * Unknown, already-used and expired tokens all answer the same
   * 400 INVALID_VERIFICATION_TOKEN, so the UI cannot (and must not try to)
   * tell the visitor which one it was.
   */
  verifyEmail(token: string): Promise<void> {
    return apiFetch<void>("/auth/verify-email", {
      method: "POST",
      body: { token },
    });
  },

  /**
   * POST /auth/password/forgot → 204, *always* — including for an address with
   * no account. Anything else would turn this into an account-enumeration
   * oracle, so the UI must show the same "check your mail" screen either way.
   * Throttled to 3/hour per IP.
   */
  forgotPassword(email: string): Promise<void> {
    return apiFetch<void>("/auth/password/forgot", {
      method: "POST",
      body: { email },
    });
  },

  /**
   * POST /auth/password/reset → 204. Min password length 8, same as register.
   * Like the verification token, this one is mailed as a 64-hex code with no
   * link, and it expires after 60 minutes.
   * A bad or expired token answers 400 INVALID_RESET_TOKEN. On success every
   * refresh token for the account is revoked — a reset usually follows a
   * suspected compromise — so the user has to sign in again afterwards.
   */
  resetPassword(token: string, password: string): Promise<void> {
    return apiFetch<void>("/auth/password/reset", {
      method: "POST",
      body: { token, password },
    });
  },
};

// ---------- Entities ----------

export const entitiesApi = {
  /** GET /entities → { data, meta: { next_cursor, per_page } } (page size 20, fixed) */
  list(cursor?: string): Promise<CursorPaginated<Entity, EntityCursorMeta>> {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<CursorPaginated<Entity, EntityCursorMeta>>(
      `/entities${qs}`,
      { auth: true }
    );
  },

  /** Walk every cursor page. The backend caps page size at 20 server-side. */
  async listAll(maxPages = 20): Promise<Entity[]> {
    const out: Entity[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < maxPages; page++) {
      const res = await entitiesApi.list(cursor);
      out.push(...res.data);
      if (!res.meta.next_cursor) break;
      cursor = res.meta.next_cursor;
    }
    return out;
  },

  /**
   * POST /entities → 201 { entity }.
   * Only `type` and `title` are accepted — profile data goes through the
   * dedicated vehicle/contact endpoints (see `createVehicle`).
   */
  create(body: CreateEntityRequest): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>("/entities", {
      method: "POST",
      body,
      auth: true,
    });
  },

  get(id: string): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>(`/entities/${id}`, { auth: true });
  },

  /** PATCH /entities/{id} — only `title` and `status`. */
  update(id: string, body: UpdateEntityRequest): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>(`/entities/${id}`, {
      method: "PATCH",
      body,
      auth: true,
    });
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/entities/${id}`, { method: "DELETE", auth: true });
  },

  /** PUT /entities/{id}/vehicle → { entity } (upsert, make/model/color required) */
  upsertVehicle(
    id: string,
    body: UpsertVehicleRequest
  ): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>(`/entities/${id}/vehicle`, {
      method: "PUT",
      body,
      auth: true,
    });
  },

  /** PUT /entities/{id}/contact → { entity } (upsert, all fields optional) */
  upsertContact(
    id: string,
    body: UpsertContactRequest
  ): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>(`/entities/${id}/contact`, {
      method: "PUT",
      body,
      auth: true,
    });
  },

  /**
   * PATCH /entities/{id}/privacy → { entity }.
   * Partial patch: the backend merges the given flags over the current ones.
   * There is no GET counterpart — read `entity.privacy_settings` instead.
   */
  updatePrivacy(
    id: string,
    body: Partial<PrivacySettings>
  ): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>(`/entities/${id}/privacy`, {
      method: "PATCH",
      body,
      auth: true,
    });
  },

  /** Convenience: create a car entity and attach its vehicle profile. */
  async createVehicle(
    vehicle: UpsertVehicleRequest,
    title?: string | null
  ): Promise<Entity> {
    const { entity } = await entitiesApi.create({
      type: "car",
      ...(title ? { title } : {}),
    });
    const { entity: withProfile } = await entitiesApi.upsertVehicle(
      entity.id,
      vehicle
    );
    return withProfile;
  },
};

// ---------- QR ----------

export const qrApi = {
  /** POST /qr/lookup — public, throttled 30/min per IP. */
  lookup(body: QrLookupRequest): Promise<{ qr_code: QrCode }> {
    return apiFetch<{ qr_code: QrCode }>("/qr/lookup", {
      method: "POST",
      body,
    });
  },

  /** POST /qr/activate — requires an Idempotency-Key (UUID). */
  activate(body: QrActivateRequest): Promise<{ qr_code: QrCode }> {
    return apiFetch<{ qr_code: QrCode }>("/qr/activate", {
      method: "POST",
      body,
      auth: true,
      idempotencyKey: newIdempotencyKey(),
    });
  },

  /** GET /qr → { data, meta: { next_cursor, has_more } } (page size 20, fixed) */
  list(cursor?: string): Promise<CursorPaginated<QrCode, QrCursorMeta>> {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<CursorPaginated<QrCode, QrCursorMeta>>(`/qr${qs}`, {
      auth: true,
    });
  },

  /** Walk every cursor page — the backend ignores a `limit` query param. */
  async listAll(maxPages = 20): Promise<QrCode[]> {
    const out: QrCode[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < maxPages; page++) {
      const res = await qrApi.list(cursor);
      out.push(...res.data);
      if (!res.meta.has_more || !res.meta.next_cursor) break;
      cursor = res.meta.next_cursor;
    }
    return out;
  },

  get(id: string): Promise<{ qr_code: QrCode }> {
    return apiFetch<{ qr_code: QrCode }>(`/qr/${id}`, { auth: true });
  },

  pause(id: string): Promise<{ qr_code: QrCode }> {
    return apiFetch<{ qr_code: QrCode }>(`/qr/${id}/pause`, {
      method: "POST",
      auth: true,
      idempotencyKey: newIdempotencyKey(),
    });
  },

  resume(id: string): Promise<{ qr_code: QrCode }> {
    return apiFetch<{ qr_code: QrCode }>(`/qr/${id}/resume`, {
      method: "POST",
      auth: true,
      idempotencyKey: newIdempotencyKey(),
    });
  },
};

// ---------- Public scan flow (no auth) ----------
//
// Every endpoint here answers 404 QR_NOT_FOUND for an unknown code and
// 410 QR_NOT_SCANNABLE when the code is real but paused / blocked / never
// activated — different screens for the visitor, so don't collapse the two.
// The one exception is `reportAbuse`, which deliberately accepts reports on a
// paused or blocked code, because abuse is often *why* it was paused.

export const publicApi = {
  /**
   * GET /public/q/{code}. Records the scan as an append-only event; the
   * visitor IP is stored only as an HMAC salted per QR code. Throttled to
   * 30/min per visitor IP.
   */
  scan(code: string, locale?: ApiLocale): Promise<PublicEntityPayload> {
    return apiFetch<PublicEntityPayload>(
      `/public/q/${encodeURIComponent(code)}`,
      { locale }
    );
  },

  /**
   * POST /public/q/{code}/scenarios/{id} → 202.
   * 202, not 200: notifying the owner happens after the response, so a success
   * means the submission was accepted, not that mail has landed.
   * `status: "duplicate"` means the same visitor already sent this scenario
   * inside the dedup window and the owner was not woken a second time.
   */
  submitScenario(
    code: string,
    scenarioId: string,
    body: ScenarioSubmitRequest
  ): Promise<SubmissionResult> {
    return apiFetch<SubmissionResult>(
      `/public/q/${encodeURIComponent(code)}/scenarios/${scenarioId}`,
      { method: "POST", body, idempotencyKey: newIdempotencyKey() }
    );
  },

  /**
   * POST /public/q/{code}/lead → 202 { status, lead_id }.
   * Contact details land in the `leads` table, never in the append-only
   * interaction log. Throttled hard (1 per 10 min per IP by default).
   */
  submitLead(
    code: string,
    body: LeadRequest,
    locale?: ApiLocale
  ): Promise<LeadAccepted> {
    return apiFetch<LeadAccepted>(
      `/public/q/${encodeURIComponent(code)}/lead`,
      { method: "POST", body, locale }
    );
  },

  /** POST /public/q/{code}/abuse → 202 { status, report_id }. */
  reportAbuse(code: string, body: AbuseRequest): Promise<AbuseAccepted> {
    return apiFetch<AbuseAccepted>(
      `/public/q/${encodeURIComponent(code)}/abuse`,
      { method: "POST", body }
    );
  },
};

// ---------- Owner cabinet ----------

export const ownerApi = {
  /** GET /owner/dashboard — every figure scoped to the caller's own entities. */
  dashboard(): Promise<OwnerDashboard> {
    return apiFetch<OwnerDashboard>("/owner/dashboard", { auth: true });
  },

  /** GET /owner/interactions — scenario submissions on the caller's QR codes. */
  interactions(params?: {
    cursor?: string;
    limit?: number;
    qr_code_id?: string;
    since?: string;
  }): Promise<CursorPaginated<Interaction, QrCursorMeta>> {
    const q = new URLSearchParams();
    if (params?.cursor) q.set("cursor", params.cursor);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.qr_code_id) q.set("qr_code_id", params.qr_code_id);
    if (params?.since) q.set("since", params.since);
    const qs = q.toString();
    return apiFetch<CursorPaginated<Interaction, QrCursorMeta>>(
      `/owner/interactions${qs ? `?${qs}` : ""}`,
      { auth: true }
    );
  },

  /**
   * POST /owner/interactions/{id}/resolve → 204, no body.
   * Idempotent: resolving twice succeeds and changes nothing. Only `status`
   * moves — per D-033 every field describing what the visitor did is immutable,
   * so the caller updates its own copy rather than reading back a new one.
   * Someone else's interaction answers 404 (not 403) by design.
   */
  resolveInteraction(id: string): Promise<void> {
    // No Idempotency-Key: this route carries no idempotency middleware, and
    // the action is naturally idempotent — resolving twice changes nothing.
    return apiFetch<void>(`/owner/interactions/${id}/resolve`, {
      method: "POST",
      auth: true,
    });
  },
};

/** Map web locale (ISO "kk") to backend locale code ("kz"). */
export function toApiLocale(webLocale: string): ApiLocale {
  if (webLocale === "kk") return "kz";
  if (webLocale === "en") return "en";
  return "ru";
}

/** Display label for an entity: explicit title, else "Make Model", else "—". */
export function entityLabel(entity: Entity, fallback = "—"): string {
  if (entity.title) return entity.title;
  const v = entity.vehicle_profile;
  if (v) return [v.make, v.model].filter(Boolean).join(" ") || fallback;
  return entity.contact_profile?.display_name ?? fallback;
}

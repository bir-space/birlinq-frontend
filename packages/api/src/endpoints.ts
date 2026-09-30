import {
  MalformedAuthResponseError,
  apiFetch,
  newIdempotencyKey,
  normalizeAuthResponse,
} from "./client";
import { publicPath } from "./card";
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
  PublicEntityPayload,
  PublicEventRequest,
  PublicEventResult,
  PublicTarget,
  PushSubscriptionPayload,
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
} from "./types";
import { apiBaseUrl, tokens } from "./config";

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
  tokens().setSession(auth);
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
      if (tokens().hasSession()) {
        await apiFetch<void>("/auth/logout", { method: "POST", auth: true });
      }
    } catch {
      // Local sign-out must succeed even if the call fails.
    } finally {
      tokens().clear();
    }
  },

  /**
   * POST /auth/logout-all → 204. Revokes every refresh token of the user.
   * The button for "sign out everywhere" after a suspected compromise.
   */
  async logoutAll(): Promise<void> {
    try {
      if (tokens().hasSession()) {
        await apiFetch<void>("/auth/logout-all", { method: "POST", auth: true });
      }
    } catch {
      // Same as logout: never trap the user in a session locally.
    } finally {
      tokens().clear();
    }
  },

  /** GET /auth/me → { user } */
  me(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/auth/me", { auth: true });
  },

  /**
   * PATCH /auth/me → { user } (D-043). A name change is plain. A phone change
   * — new number or `null` — needs `current_password`, shares the
   * password-change throttle (5 per 15 min) and signs every other device out;
   * this session keeps its tokens. A wrong password is a 422 with
   * `details.current_password`. No Idempotency-Key: the route carries no
   * idempotency middleware and a repeat is a no-op.
   */
  updateProfile(body: UpdateProfileRequest): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/auth/me", {
      method: "PATCH",
      body,
      auth: true,
    });
  },

  /**
   * POST /auth/password/change → 204 (D-043). Every other session is revoked;
   * this one keeps its tokens, so no re-login follows. A wrong current
   * password is a 422 with `details.current_password`; the new one must be
   * 8..100 characters and differ from the old. Throttled 5 per 15 min.
   */
  changePassword(body: ChangePasswordRequest): Promise<void> {
    return apiFetch<void>("/auth/password/change", {
      method: "POST",
      body,
      auth: true,
    });
  },

  /**
   * POST /auth/me/avatar → { user } (D-045). Multipart, same rules as a
   * card image: JPEG, PNG or WebP up to `LIMITS.imageMaxBytes` in a field
   * named `file`; the previous file is deleted. The avatar belongs to the
   * account, not to a card. No Idempotency-Key — re-uploading is harmless.
   */
  uploadAvatar(file: Blob, filename?: string): Promise<{ user: User }> {
    const form = new FormData();
    if (filename === undefined) form.append("file", file);
    else form.append("file", file, filename);
    return apiFetch<{ user: User }>("/auth/me/avatar", {
      method: "POST",
      body: form,
      auth: true,
    });
  },

  /** DELETE /auth/me/avatar → { user } with `avatar_url: null`; the same 200 when there was none. */
  removeAvatar(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/auth/me/avatar", {
      method: "DELETE",
      auth: true,
    });
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
  /**
   * GET /entities → { data, meta: { next_cursor, has_more, per_page } }.
   * `type` narrows to one entity type — the Business cabinet asks for
   * `personal`, the garage for `car`. `limit` is 1..100, default 20.
   * Newest first; the cursor is opaque.
   */
  list(
    params?: EntityListParams
  ): Promise<CursorPaginated<Entity, EntityCursorMeta>> {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.cursor) q.set("cursor", params.cursor);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<CursorPaginated<Entity, EntityCursorMeta>>(
      `/entities${qs ? `?${qs}` : ""}`,
      { auth: true }
    );
  },

  /** Walk every cursor page. `params.limit` is the page size, capped at 100 server-side. */
  async listAll(
    params?: Omit<EntityListParams, "cursor">,
    maxPages = 20
  ): Promise<Entity[]> {
    const out: Entity[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < maxPages; page++) {
      const res = await entitiesApi.list({ ...params, cursor });
      out.push(...res.data);
      // A backend from before D-041 sends no has_more; the cursor decides then.
      const hasMore = res.meta.has_more ?? res.meta.next_cursor !== null;
      if (!hasMore || !res.meta.next_cursor) break;
      cursor = res.meta.next_cursor;
    }
    return out;
  },

  /**
   * POST /entities → 201 { entity }.
   * The route sits behind the idempotency middleware, so the header is not
   * optional: without it the backend answers 422 IDEMPOTENCY_KEY_MISSING
   * before validation even runs. A fresh key is minted per call; pass
   * `idempotencyKey` to keep one key across the retries of a single form
   * submission, so a double tap cannot create two cards.
   * `contact` and `privacy_settings` ride along and are applied in the same
   * transaction (D-041); a car still gets its profile through `upsertVehicle`
   * (see `createVehicle`). A card comes back with its permanent `alias`,
   * drawn by the server (D-044); an `alias` key in the body, even `null`, is
   * 422 `details.alias`. 409 CARD_LIMIT_REACHED is a business outcome to
   * surface, not a bug.
   */
  create(
    body: CreateEntityRequest,
    opts?: { idempotencyKey?: string }
  ): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>("/entities", {
      method: "POST",
      body,
      auth: true,
      idempotencyKey: opts?.idempotencyKey ?? newIdempotencyKey(),
    });
  },

  get(id: string): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>(`/entities/${id}`, { auth: true });
  },

  /**
   * PATCH /entities/{id} — `title` and `status`. For a card, `deactivated`
   * is the "unpublished" mark (D-044). `status` on a blocked entity is 409
   * ENTITY_BLOCKED; someone else's entity is 403 before any validation. The
   * address is permanent: an `alias` key in the body, even `null`, is 422
   * `details.alias`. No Idempotency-Key — the route carries no idempotency
   * middleware.
   */
  update(id: string, body: UpdateEntityRequest): Promise<{ entity: Entity }> {
    return apiFetch<{ entity: Entity }>(`/entities/${id}`, {
      method: "PATCH",
      body,
      auth: true,
    });
  },

  /**
   * DELETE /entities/{id} → 204 (soft) — `car` and `business` entities. A
   * personal card is never deleted: 409 CARD_PERMANENT whatever its status,
   * blocked included (D-044) — hide it with `update(id, { status:
   * "deactivated" })` instead. A blocked car or business entity is 409
   * ENTITY_BLOCKED; someone else's entity is 403 before either.
   */
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

  /**
   * PUT /entities/{id}/contact → { entity } (upsert, all fields optional).
   * Images are the exception: `photo_url`/`cover_url` take only `null` here,
   * which clears the image — see `uploadContactImage` for setting one.
   */
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
   * POST /entities/{id}/contact/{kind} → { entity }. The one multipart
   * endpoint: JPEG, PNG or WebP up to `LIMITS.imageMaxBytes`, in a form field
   * named `file`. The previous image we stored is deleted. No Idempotency-Key
   * — re-uploading is harmless. `filename` matters only for the extension
   * the browser reports; the backend names the file after the verified MIME.
   */
  uploadContactImage(
    id: string,
    kind: ContactImageKind,
    file: Blob,
    filename?: string
  ): Promise<{ entity: Entity }> {
    const form = new FormData();
    if (filename === undefined) form.append("file", file);
    else form.append("file", file, filename);
    return apiFetch<{ entity: Entity }>(`/entities/${id}/contact/${kind}`, {
      method: "POST",
      body: form,
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

  /** GET /entities/{id}/stats → { stats } — the 30-day figures, see `EntityStats`. */
  stats(id: string): Promise<{ stats: EntityStats }> {
    return apiFetch<{ stats: EntityStats }>(`/entities/${id}/stats`, {
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

// ---------- Public flow (no auth) ----------
//
// Two doors lead to the same page (D-040): a sticker, `/public/q/{code}`, and
// a card's link, `/public/c/{alias}` — `PublicTarget` names either, and
// `publicPath` turns it into the route prefix. Unknown → 404 (QR_NOT_FOUND /
// CARD_NOT_FOUND). Known but with nothing to show → 410: QR_NOT_SCANNABLE when
// the sticker itself is paused/blocked/unactivated, ENTITY_NOT_PUBLISHED when
// the card behind either door is deactivated, blocked or deleted. Different
// screens for the visitor, so don't collapse them. The one exception is
// `reportAbuse`, which deliberately accepts reports on a paused or blocked
// target, because abuse is often *why* it was paused.

/**
 * `path?ref=<host>` when there is a referrer host to report (D-045), else the
 * path untouched. A query parameter, not a header: a custom header would
 * turn every referred visit into a CORS preflight. Only a hostname ever goes
 * here — the caller computes it in the browser, so the full referrer URL
 * never leaves the page.
 */
function withReferrer(path: string, referrerHost: string | undefined): string {
  const host = referrerHost?.trim();
  return host ? `${path}?ref=${encodeURIComponent(host)}` : path;
}

export const publicApi = {
  /**
   * GET /public/q/{code}. Records the scan as an append-only event; the
   * visitor IP is stored only as an HMAC salted per entity. Throttled to
   * 30/min per visitor IP. `referrerHost` is the hostname of the page that
   * sent the visitor here (D-045) — an XHR's own Referer always names our
   * page, so the real one travels as `?ref=<host>`. The server normalises it
   * and drops our own hosts; the web passes it on the first fetch of a
   * document only (`pendingReferrerHost()` in `lib/public-url.ts`).
   */
  scan(
    code: string,
    locale?: ApiLocale,
    referrerHost?: string
  ): Promise<PublicEntityPayload> {
    return apiFetch<PublicEntityPayload>(
      withReferrer(publicPath({ kind: "qr", code }), referrerHost),
      { locale }
    );
  },

  /**
   * GET /public/c/{alias} — the card behind its public link (D-040). Records
   * a `view` rather than a scan, de-duplicated per visitor for 60 s and not
   * at all for known bots. Same throttle as `scan`, which is why the page
   * fetches this from the browser and never server-side: one SSR origin
   * would spend the whole 30/min on itself and count as the visitor.
   * `referrerHost` as in `scan`.
   */
  card(
    alias: string,
    locale?: ApiLocale,
    referrerHost?: string
  ): Promise<PublicEntityPayload> {
    return apiFetch<PublicEntityPayload>(
      withReferrer(publicPath({ kind: "alias", alias }), referrerHost),
      { locale }
    );
  },

  /**
   * Absolute URL of GET …/vcard, for a plain `<a href download>` — the
   * browser fetches it itself, so this is a string, not a request. Built by
   * the backend from the same privacy-filtered data as the page, so it never
   * carries a field the page hides. Counted as a `vcard_download` event, not
   * a scan.
   */
  vcardUrl(target: PublicTarget): string {
    return `${apiBaseUrl()}${publicPath(target)}/vcard`;
  },

  /**
   * POST …/events → 202 { status } (D-041). Fire-and-forget from the card: a
   * tap on a contact tile or a share. `keepalive` lets it finish after the
   * visitor follows the `tel:` link away. Callers ignore the result and
   * swallow errors — analytics must never block a contact action. Throttled
   * 60/min per visitor and target; `duplicate` means the same tap landed
   * inside the 60 s dedup interval.
   */
  trackEvent(
    target: PublicTarget,
    body: PublicEventRequest
  ): Promise<PublicEventResult> {
    return apiFetch<PublicEventResult>(`${publicPath(target)}/events`, {
      method: "POST",
      body,
      keepalive: true,
    });
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

  /**
   * POST …/abuse → 202 { status, report_id }. Behind both doors (D-040), so a
   * card reached by link can be reported too — without that, moderation is
   * blind to the card's main entrance.
   */
  reportAbuse(target: PublicTarget, body: AbuseRequest): Promise<AbuseAccepted> {
    return apiFetch<AbuseAccepted>(`${publicPath(target)}/abuse`, {
      method: "POST",
      body,
    });
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

/**
 * Browser push subscriptions (backend D-034). One row per browser, so a single
 * user may hold several and a notification fans out to all of them.
 *
 * Web-only by construction: VAPID subscriptions come from a service worker,
 * which React Native has none of. A native client needs FCM/APNs, which the
 * backend does not expose yet.
 */
export const pushApi = {
  /**
   * POST /push/subscribe → 204.
   * Safe on every page load: an endpoint already stored is updated, not
   * duplicated, and a browser that silently revoked a subscription gets it
   * restored by the next call.
   */
  subscribe(subscription: PushSubscriptionPayload): Promise<void> {
    return apiFetch<void>("/push/subscribe", {
      method: "POST",
      body: subscription,
      auth: true,
    });
  },

  /** DELETE /push/unsubscribe → 204. Drops this browser's row only. */
  unsubscribe(endpoint: string): Promise<void> {
    return apiFetch<void>("/push/unsubscribe", {
      method: "DELETE",
      body: { endpoint },
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

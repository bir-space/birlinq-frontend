import {
  MalformedAuthResponseError,
  apiFetch,
  newIdempotencyKey,
  normalizeAuthResponse,
} from "./client";
import type {
  AbuseRequest,
  AuthResponse,
  CreateEntityRequest,
  CursorPaginated,
  Entity,
  EntityCursorMeta,
  Interaction,
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
  /** POST /auth/register → 201 { user, tokens } */
  register(body: RegisterRequest): Promise<AuthResponse> {
    return startSession("/auth/register", body);
  },

  /** POST /auth/login → 200 { user, tokens } */
  login(body: LoginRequest): Promise<AuthResponse> {
    return startSession("/auth/login", body);
  },

  /**
   * POST /auth/logout — JWT-guarded, takes no body: the backend revokes every
   * refresh token of the user and invalidates the presented access token.
   */
  async logout(): Promise<void> {
    try {
      if (tokenStore.hasSession()) {
        await apiFetch<{ status: "logged_out" }>("/auth/logout", {
          method: "POST",
          auth: true,
        });
      }
    } catch {
      // Local sign-out must succeed even if the call fails.
    } finally {
      tokenStore.clear();
    }
  },

  /** GET /auth/me → { user } */
  me(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/auth/me", { auth: true });
  },
};

/* ------------------------------------------------------------------ *
 * NOT IMPLEMENTED on the backend (documented in docs/api/openapi.yaml
 * but absent from routes/api.php). Calling these returns 404 NOT_FOUND.
 * Kept so the UI wires up the moment the backend ships them.
 *
 * TODO(backend): implement POST /auth/verify-email, /auth/password/forgot,
 * /auth/password/reset. Until then RegisterView cannot confirm an address and
 * ForgotPasswordView / ResetPasswordView are dead ends — they render, submit,
 * and get a 404 back.
 * ------------------------------------------------------------------ */

export const unimplementedAuthApi = {
  verifyEmail(token: string): Promise<void> {
    return apiFetch<void>("/auth/verify-email", {
      method: "POST",
      body: { token },
    });
  },

  forgotPassword(email: string): Promise<void> {
    return apiFetch<void>("/auth/password/forgot", {
      method: "POST",
      body: { email },
    });
  },

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

/* ------------------------------------------------------------------ *
 * NOT IMPLEMENTED on the backend — public scan flow and owner analytics.
 * See the note above `unimplementedAuthApi`.
 *
 * TODO(backend): implement the public scan flow — GET /public/q/{code},
 * POST /public/q/{code}/scenarios/{id}, /lead, /abuse. PublicScanPage falls
 * back to a static screen without them, so scanning a QR does nothing.
 *
 * TODO(backend): implement GET /owner/dashboard, GET /owner/interactions,
 * POST /owner/interactions/{id}/resolve. OverviewView and InteractionsView
 * swallow the 404 via `isMissingEndpoint` and show empty states.
 *
 * TODO(backend): no endpoint exists for the landing lead form at all — it is
 * not in openapi.yaml either. `leads` table + Filament LeadResource are ready;
 * a public POST /leads (throttled, no auth) is still to be decided. Until then
 * LeadForm submits nowhere — see components/landing/LeadForm.tsx.
 * ------------------------------------------------------------------ */

export const publicApi = {
  scan(code: string): Promise<PublicEntityPayload> {
    return apiFetch<PublicEntityPayload>(
      `/public/q/${encodeURIComponent(code)}`
    );
  },

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

  submitLead(code: string, body: LeadRequest): Promise<void> {
    return apiFetch<void>(`/public/q/${encodeURIComponent(code)}/lead`, {
      method: "POST",
      body,
    });
  },

  reportAbuse(code: string, body: AbuseRequest): Promise<void> {
    return apiFetch<void>(`/public/q/${encodeURIComponent(code)}/abuse`, {
      method: "POST",
      body,
    });
  },
};

export const ownerApi = {
  dashboard(): Promise<OwnerDashboard> {
    return apiFetch<OwnerDashboard>("/owner/dashboard", { auth: true });
  },

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

  resolveInteraction(id: string): Promise<{ interaction: Interaction }> {
    return apiFetch<{ interaction: Interaction }>(
      `/owner/interactions/${id}/resolve`,
      { method: "POST", auth: true, idempotencyKey: newIdempotencyKey() }
    );
  },
};

/** Map web locale (ISO "kk") to backend locale code ("kz"). */
export function toApiLocale(webLocale: string): "ru" | "kz" | "en" {
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

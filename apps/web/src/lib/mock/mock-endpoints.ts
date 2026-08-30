/**
 * Drop-in mock replacements for src/lib/api/endpoints.ts, matching the same
 * method signatures but reading/writing in-memory fixtures instead of the
 * real backend. Used exclusively by the /mock preview pages and their
 * duplicated components under src/components/mock — never imported from a
 * real page.
 *
 * Signatures track the real module, including the split between
 * `POST /entities` ({type, title} only) and `PUT /entities/{id}/vehicle`, and
 * privacy updates returning the whole entity.
 */
import { ApiRequestError } from "@birlinq/api";
import type { AppApi } from "@birlinq/api";
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
} from "@birlinq/api";
import {
  DEFAULT_MOCK_PRIVACY,
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
let entities: Entity[] = MOCK_ENTITIES.map((e) => ({
  ...e,
  privacy_settings: e.privacy_settings ? { ...e.privacy_settings } : null,
  vehicle_profile: e.vehicle_profile ? { ...e.vehicle_profile } : null,
}));
let qrCodes: QrCode[] = MOCK_QR_CODES.map((q) => ({ ...q }));
let interactions: Interaction[] = MOCK_INTERACTIONS.map((i) => ({ ...i }));

/** Long enough to satisfy the real token guard, in case it ever gets wired up. */
const MOCK_ACCESS_TOKEN = "mock-access-token-".padEnd(64, "0");
const MOCK_REFRESH_TOKEN = "mock-refresh-token-".padEnd(64, "0");

function mockAuthResponse(): AuthResponse {
  return {
    user: MOCK_USER,
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
    return delay({ user: MOCK_USER });
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
  async list(
    _cursor?: string
  ): Promise<CursorPaginated<Entity, EntityCursorMeta>> {
    return delay({ data: entities, meta: { next_cursor: null, per_page: 20 } });
  },

  async listAll(): Promise<Entity[]> {
    return delay(entities);
  },

  async create(body: CreateEntityRequest): Promise<{ entity: Entity }> {
    const now = new Date().toISOString();
    const entity: Entity = {
      id: genId("entity"),
      type: body.type,
      title: body.title ?? null,
      status: "active",
      privacy_settings: { ...DEFAULT_MOCK_PRIVACY },
      vehicle_profile: null,
      contact_profile: null,
      created_at: now,
      updated_at: now,
    };
    entities = [entity, ...entities];
    return delay({ entity });
  },

  async get(id: string): Promise<{ entity: Entity }> {
    return delay({ entity: findEntity(id) });
  },

  async update(
    id: string,
    body: UpdateEntityRequest
  ): Promise<{ entity: Entity }> {
    const entity = replaceEntity(id, (e) => ({
      ...e,
      title: body.title !== undefined ? body.title : e.title,
      status: body.status ?? e.status,
    }));
    return delay({ entity });
  },

  async remove(_id: string): Promise<void> {
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
        display_name: null,
        phone: null,
        phone2: null,
        email: null,
        whatsapp: null,
        telegram: null,
        company: null,
        title: null,
        bio: null,
        photo_url: null,
        ...e.contact_profile,
        ...body,
      },
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
  async lookup(body: QrLookupRequest): Promise<{ qr_code: QrCode }> {
    // Always resolves so the activation wizard demo can be walked end to end.
    return delay({
      qr_code: {
        id: "qr-demo",
        code: (body.code || "DEMO1234").toUpperCase(),
        status: "available",
        entity_id: null,
        activated_at: null,
        last_scan_at: null,
        scan_count: 0,
      },
    });
  },

  async activate(body: QrActivateRequest): Promise<{ qr_code: QrCode }> {
    return delay({
      qr_code: {
        id: "qr-demo",
        code: body.code.toUpperCase(),
        status: "activated",
        entity_id: body.entity_id,
        activated_at: new Date().toISOString(),
        last_scan_at: null,
        scan_count: 0,
      },
    });
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
  async scan(
    _code: string,
    _locale?: ApiLocale
  ): Promise<PublicEntityPayload> {
    return delay(MOCK_PUBLIC_PAYLOAD);
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
    _code: string,
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
 * The mock tree's `AppApi` value. Shape-checked against the real one by the
 * `AppApi` annotation — if an endpoint's signature changes in
 * `src/lib/api/endpoints.ts`, this fails to compile instead of silently
 * drifting, which is the whole point of routing both trees through one type.
 */
/**
 * Push in the preview tree accepts and forgets. The real thing needs a service
 * worker, a VAPID key and a permission prompt; none of that belongs in a
 * fixture tree whose whole point is to render without a backend.
 */
const mockPushApi: AppApi["push"] = {
  subscribe: async () => {},
  unsubscribe: async () => {},
};

export const mockApi: AppApi = {
  auth: mockAuthApi,
  entities: mockEntitiesApi,
  qr: mockQrApi,
  public: mockPublicApi,
  owner: mockOwnerApi,
  push: mockPushApi,
};

/**
 * Drop-in mock replacements for src/lib/api/endpoints.ts, matching the same
 * method signatures but reading/writing in-memory fixtures instead of the
 * real backend. Used exclusively by the /mock preview pages and their
 * duplicated components under src/components/mock — never imported from a
 * real page.
 */
import { ApiRequestError } from "@/lib/api/client";
import type {
  AbuseRequest,
  AuthTokenPair,
  CreateEntityRequest,
  CursorPaginated,
  Entity,
  Interaction,
  LeadRequest,
  LoginRequest,
  OwnerDashboard,
  PrivacySettings,
  PublicEntityPayload,
  QrActivateRequest,
  QrCode,
  QrLookupRequest,
  RegisterRequest,
  ScenarioSubmitRequest,
  SubmissionResult,
  UpdateEntityRequest,
  User,
} from "@/lib/api/types";
import {
  DEFAULT_MOCK_PRIVACY,
  MOCK_DASHBOARD,
  MOCK_ENTITIES,
  MOCK_INTERACTIONS,
  MOCK_PRIVACY,
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
let entities: Entity[] = MOCK_ENTITIES.map((e) => ({ ...e, vehicle: { ...e.vehicle } }));
let qrCodes: QrCode[] = MOCK_QR_CODES.map((q) => ({ ...q }));
let interactions: Interaction[] = MOCK_INTERACTIONS.map((i) => ({ ...i }));
let privacy: Record<string, PrivacySettings> = Object.fromEntries(
  Object.entries(MOCK_PRIVACY).map(([id, p]) => [id, { ...p }])
);

export const mockAuthApi = {
  async register(_body: RegisterRequest): Promise<AuthTokenPair> {
    return delay({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "Bearer",
      expires_in: 3600,
      user: MOCK_USER,
    });
  },

  async login(_body: LoginRequest): Promise<AuthTokenPair> {
    return delay({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "Bearer",
      expires_in: 3600,
      user: MOCK_USER,
    });
  },

  async logout(): Promise<void> {
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
  async list(): Promise<CursorPaginated<Entity>> {
    return delay({ data: entities, meta: { next_cursor: null, has_more: false } });
  },

  async create(body: CreateEntityRequest): Promise<{ entity: Entity }> {
    const entity: Entity = {
      id: genId("entity"),
      type: body.type,
      title: body.title ?? "",
      status: "active",
      vehicle: {
        make: body.vehicle.make,
        model: body.vehicle.model,
        color: body.vehicle.color,
        plate_number: body.vehicle.plate_number ?? null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    entities = [entity, ...entities];
    privacy[entity.id] = { ...DEFAULT_MOCK_PRIVACY };
    return delay({ entity });
  },

  async get(id: string): Promise<{ entity: Entity }> {
    const entity = entities.find((e) => e.id === id);
    if (!entity) {
      throw new ApiRequestError(404, {
        code: "NOT_FOUND",
        message: "Entity not found",
      });
    }
    return delay({ entity });
  },

  async update(id: string, body: UpdateEntityRequest): Promise<{ entity: Entity }> {
    entities = entities.map((e) =>
      e.id === id
        ? {
            ...e,
            title: body.title ?? e.title,
            vehicle: { ...e.vehicle, ...body.vehicle },
            updated_at: new Date().toISOString(),
          }
        : e
    );
    const entity = entities.find((e) => e.id === id);
    if (!entity) {
      throw new ApiRequestError(404, {
        code: "NOT_FOUND",
        message: "Entity not found",
      });
    }
    return delay({ entity });
  },

  async remove(_id: string): Promise<void> {
    return delay(undefined);
  },

  async getPrivacy(id: string): Promise<{ privacy: PrivacySettings }> {
    return delay({ privacy: privacy[id] ?? DEFAULT_MOCK_PRIVACY });
  },

  async updatePrivacy(
    id: string,
    body: Partial<PrivacySettings>
  ): Promise<{ privacy: PrivacySettings }> {
    privacy[id] = { ...(privacy[id] ?? DEFAULT_MOCK_PRIVACY), ...body };
    return delay({ privacy: privacy[id] });
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

  async list(_params?: { cursor?: string; limit?: number }): Promise<
    CursorPaginated<QrCode>
  > {
    return delay({ data: qrCodes, meta: { next_cursor: null, has_more: false } });
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
  async scan(_code: string): Promise<PublicEntityPayload> {
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

  async submitLead(_code: string, _body: LeadRequest): Promise<void> {
    return delay(undefined);
  },

  async reportAbuse(_code: string, _body: AbuseRequest): Promise<void> {
    return delay(undefined);
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
  }): Promise<CursorPaginated<Interaction>> {
    const limit = params?.limit ?? 20;
    return delay({
      data: interactions.slice(0, limit),
      meta: { next_cursor: null, has_more: false },
    });
  },

  async resolveInteraction(id: string): Promise<{ interaction: Interaction }> {
    interactions = interactions.map((i) =>
      i.id === id ? { ...i, status: "resolved" } : i
    );
    const interaction = interactions.find((i) => i.id === id);
    if (!interaction) {
      throw new ApiRequestError(404, {
        code: "NOT_FOUND",
        message: "Interaction not found",
      });
    }
    return delay({ interaction });
  },
};

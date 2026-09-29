"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiRequestError,
  DEFAULT_PRIVACY,
  ErrorCode,
  isValidationError,
  type ContactImageKind,
  type Entity,
  type PrivacySettings,
  type QrCode,
  type UpsertContactRequest,
} from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import {
  detailsToFieldErrors,
  type FieldErrors,
} from "../shared/field-errors";
import {
  PRIVACY_PRESETS,
  type CardPrivacyKey,
  type CardPrivacyPreset,
} from "./privacy-presets";

export type CardLoadError = "notFound" | "load" | null;

/** Which write is in flight; the view disables that section only. */
export type CardBusy =
  | "contact"
  | "privacy"
  | "publish"
  | "alias"
  | "photo"
  | "cover"
  | "attach"
  | "remove"
  | null;

/**
 * Codes, not text. `blocked` is 409 ENTITY_BLOCKED — moderation holds the
 * card, so publishing and deleting are off until it is released; `aliasTaken`
 * is 409 ALIAS_TAKEN; `validation` comes with `fieldErrors`. The `qr*` and
 * `entityHasQr` codes belong to `attachSticker`.
 */
export type CardActionError =
  | "save"
  | "validation"
  | "blocked"
  | "aliasTaken"
  | "rateLimited"
  | "attach"
  | "qrNotFound"
  | "qrTaken"
  | "entityHasQr"
  | null;

export interface UseCard {
  entity: Entity | null;
  /**
   * Activated or paused stickers bound to this card — optional context from
   * GET /qr; failing to load them is not an error, the list just stays empty.
   */
  stickers: QrCode[];
  loading: boolean;
  error: CardLoadError;
  busy: CardBusy;
  /** The switch currently being flipped; null while a whole preset applies. */
  privacyBusy: CardPrivacyKey | null;
  actionError: CardActionError;
  /** Field messages of the last 422, cleared by the next action. */
  fieldErrors: FieldErrors;
  retry: () => void;
  clearActionError: () => void;
  /** PUT /entities/{id}/contact — every field optional; resolves true on success. */
  saveContact: (body: UpsertContactRequest) => Promise<boolean>;
  togglePrivacy: (key: CardPrivacyKey, value: boolean) => Promise<boolean>;
  applyPrivacyPreset: (preset: CardPrivacyPreset) => Promise<boolean>;
  /** `active` or `deactivated`; 409 while blocked. */
  setPublished: (published: boolean) => Promise<boolean>;
  /** A slug opens or moves the public link, null closes it. */
  saveAlias: (alias: string | null) => Promise<boolean>;
  /**
   * POST /entities/{id}/alias — a fresh server-made alias, replacing the
   * current one or opening a closed link. Never optimistic: the value is
   * the server's to choose.
   */
  generateAlias: () => Promise<boolean>;
  uploadImage: (
    kind: ContactImageKind,
    file: Blob,
    filename?: string
  ) => Promise<boolean>;
  removeImage: (kind: ContactImageKind) => Promise<boolean>;
  /** Bind a physical sticker: lookup, then activate onto this card. */
  attachSticker: (
    code: string,
    activationToken: string
  ) => Promise<QrCode | null>;
  /** DELETE — resolves true once gone; the view navigates away. */
  remove: () => Promise<boolean>;
}

const BOUND_STATUSES: ReadonlySet<QrCode["status"]> = new Set([
  "activated",
  "paused",
]);

interface Failure {
  error: CardActionError;
  fieldErrors: FieldErrors;
}

/** The mapping every write shares; `attachSticker` adds its own codes on top. */
function mapWriteError(err: unknown): Failure {
  if (err instanceof ApiRequestError) {
    if (isValidationError(err)) {
      return {
        error: "validation",
        fieldErrors: detailsToFieldErrors(err.details),
      };
    }
    if (err.code === ErrorCode.EntityBlocked) {
      return { error: "blocked", fieldErrors: {} };
    }
    if (err.code === ErrorCode.AliasTaken) {
      return { error: "aliasTaken", fieldErrors: {} };
    }
    if (err.status === 429) return { error: "rateLimited", fieldErrors: {} };
  }
  return { error: "save", fieldErrors: {} };
}

/** One business card in the cabinet: load once, then every section writes through here. */
export function useCard(id: string): UseCard {
  const api = useApi();

  const [entity, setEntity] = useState<Entity | null>(null);
  const [stickers, setStickers] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CardLoadError>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<CardBusy>(null);
  const [privacyBusy, setPrivacyBusy] = useState<CardPrivacyKey | null>(null);
  const [actionError, setActionError] = useState<CardActionError>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [entRes, qrRes] = await Promise.allSettled([
          api.entities.get(id),
          api.qr.listAll(),
        ]);
        if (cancelled) return;
        if (entRes.status === "rejected") {
          const err: unknown = entRes.reason;
          setError(
            err instanceof ApiRequestError && err.status === 404
              ? "notFound"
              : "load"
          );
          return;
        }
        setEntity(entRes.value.entity);
        if (qrRes.status === "fulfilled") {
          setStickers(
            qrRes.value.filter(
              (q) => q.entity_id === id && BOUND_STATUSES.has(q.status)
            )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const clearActionError = useCallback(() => {
    setActionError(null);
    setFieldErrors({});
  }, []);

  const fail = useCallback((failure: Failure) => {
    setActionError(failure.error);
    setFieldErrors(failure.fieldErrors);
    // The server is the authority on `blocked`: reflect it even when the
    // copy we loaded predates the moderation action.
    if (failure.error === "blocked") {
      setEntity((cur) => (cur ? { ...cur, status: "blocked" } : cur));
    }
  }, []);

  /** Shared tail of every non-optimistic write: swap in the returned entity. */
  const runWrite = useCallback(
    async (kind: CardBusy, call: () => Promise<{ entity: Entity }>) => {
      if (busy !== null) return false;
      setBusy(kind);
      clearActionError();
      try {
        const { entity: next } = await call();
        setEntity(next);
        return true;
      } catch (err) {
        fail(mapWriteError(err));
        return false;
      } finally {
        setBusy(null);
      }
    },
    [busy, clearActionError, fail]
  );

  const saveContact = useCallback(
    (body: UpsertContactRequest) =>
      runWrite("contact", () => api.entities.upsertContact(id, body)),
    [api, id, runWrite]
  );

  /** Optimistic PATCH of some privacy flags, rolled back on failure. */
  const patchPrivacy = useCallback(
    async (patch: Partial<PrivacySettings>, key: CardPrivacyKey | null) => {
      if (busy !== null) return false;
      setBusy("privacy");
      setPrivacyBusy(key);
      clearActionError();
      let previous: PrivacySettings | null = null;
      setEntity((cur) => {
        if (!cur) return cur;
        previous = cur.privacy_settings;
        return {
          ...cur,
          privacy_settings: {
            ...(cur.privacy_settings ?? DEFAULT_PRIVACY),
            ...patch,
          },
        };
      });
      try {
        const { entity: next } = await api.entities.updatePrivacy(id, patch);
        setEntity(next);
        return true;
      } catch (err) {
        const rollback = previous;
        setEntity((cur) =>
          cur ? { ...cur, privacy_settings: rollback } : cur
        );
        fail(mapWriteError(err));
        return false;
      } finally {
        setBusy(null);
        setPrivacyBusy(null);
      }
    },
    [api, id, busy, clearActionError, fail]
  );

  const togglePrivacy = useCallback(
    (key: CardPrivacyKey, value: boolean) =>
      patchPrivacy({ [key]: value }, key),
    [patchPrivacy]
  );

  const applyPrivacyPreset = useCallback(
    (preset: CardPrivacyPreset) => patchPrivacy(PRIVACY_PRESETS[preset], null),
    [patchPrivacy]
  );

  const setPublished = useCallback(
    async (published: boolean) => {
      if (busy !== null) return false;
      const status = published ? "active" : "deactivated";
      setBusy("publish");
      clearActionError();
      let previous: Entity["status"] | null = null;
      setEntity((cur) => {
        if (!cur) return cur;
        previous = cur.status;
        return { ...cur, status };
      });
      try {
        const { entity: next } = await api.entities.update(id, { status });
        setEntity(next);
        return true;
      } catch (err) {
        const rollback = previous;
        setEntity((cur) =>
          cur && rollback !== null ? { ...cur, status: rollback } : cur
        );
        fail(mapWriteError(err));
        return false;
      } finally {
        setBusy(null);
      }
    },
    [api, id, busy, clearActionError, fail]
  );

  // Not optimistic: the backend normalises the slug and may refuse it.
  const saveAlias = useCallback(
    (alias: string | null) =>
      runWrite("alias", () => api.entities.update(id, { alias })),
    [api, id, runWrite]
  );

  const generateAlias = useCallback(
    () => runWrite("alias", () => api.entities.generateAlias(id)),
    [api, id, runWrite]
  );

  const uploadImage = useCallback(
    (kind: ContactImageKind, file: Blob, filename?: string) =>
      runWrite(kind, () =>
        api.entities.uploadContactImage(id, kind, file, filename)
      ),
    [api, id, runWrite]
  );

  // Clearing goes over JSON: null is the only value the field takes there (D-041).
  const removeImage = useCallback(
    (kind: ContactImageKind) =>
      runWrite(kind, () =>
        api.entities.upsertContact(
          id,
          kind === "photo" ? { photo_url: null } : { cover_url: null }
        )
      ),
    [api, id, runWrite]
  );

  const attachSticker = useCallback(
    async (code: string, activationToken: string) => {
      if (busy !== null) return null;
      setBusy("attach");
      clearActionError();
      const body = {
        code: code.trim(),
        activation_token: activationToken.trim(),
      };
      try {
        // Lookup first: it is public and cheap, and turns a typo into a
        // 404 before the idempotent activation is spent on it.
        const { qr_code: found } = await api.qr.lookup(body);
        if (found.status === "activated") {
          fail({ error: "qrTaken", fieldErrors: {} });
          return null;
        }
        const { qr_code } = await api.qr.activate({ ...body, entity_id: id });
        setStickers((cur) => [
          ...cur.filter((q) => q.id !== qr_code.id),
          qr_code,
        ]);
        return qr_code;
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (isValidationError(err)) {
            fail({
              error: "validation",
              fieldErrors: detailsToFieldErrors(err.details),
            });
          } else if (err.code === ErrorCode.QrNotFound || err.status === 404) {
            fail({ error: "qrNotFound", fieldErrors: {} });
          } else if (err.code === ErrorCode.QrAlreadyActivated) {
            fail({ error: "qrTaken", fieldErrors: {} });
          } else if (err.code === ErrorCode.EntityAlreadyHasQr) {
            fail({ error: "entityHasQr", fieldErrors: {} });
          } else if (err.status === 429) {
            fail({ error: "rateLimited", fieldErrors: {} });
          } else {
            fail({ error: "attach", fieldErrors: {} });
          }
        } else {
          fail({ error: "attach", fieldErrors: {} });
        }
        return null;
      } finally {
        setBusy(null);
      }
    },
    [api, id, busy, clearActionError, fail]
  );

  const remove = useCallback(async () => {
    if (busy !== null) return false;
    setBusy("remove");
    clearActionError();
    try {
      await api.entities.remove(id);
      return true;
    } catch (err) {
      fail(mapWriteError(err));
      return false;
    } finally {
      setBusy(null);
    }
  }, [api, id, busy, clearActionError, fail]);

  return {
    entity,
    stickers,
    loading,
    error,
    busy,
    privacyBusy,
    actionError,
    fieldErrors,
    retry,
    clearActionError,
    saveContact,
    togglePrivacy,
    applyPrivacyPreset,
    setPublished,
    saveAlias,
    generateAlias,
    uploadImage,
    removeImage,
    attachSticker,
    remove,
  };
}

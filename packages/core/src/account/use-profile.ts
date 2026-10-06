"use client";

import { useCallback, useRef, useState } from "react";
import {
  ApiRequestError,
  isValidationError,
  type ChangePasswordRequest,
  type UpdateProfileRequest,
  type User,
} from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { useAuth } from "../auth/auth-context";
import {
  detailsToFieldErrors,
  type FieldErrors,
} from "../shared/field-errors";

export type ProfileBusy = "profile" | "password" | "avatar" | null;

/**
 * `wrongCurrent` is the 422 whose `details.current_password` says the
 * password did not match — the one validation failure that deserves its own
 * message rather than the field's generic text. Other 422s are `validation`
 * with `fieldErrors` filled (an avatar refused by the server names `file`).
 */
export type ProfileActionError =
  | "wrongCurrent"
  | "validation"
  | "rateLimited"
  | "save"
  | null;

export interface UseProfile {
  user: User | null;
  busy: ProfileBusy;
  actionError: ProfileActionError;
  fieldErrors: FieldErrors;
  clearError: () => void;
  /** PATCH /auth/me; the `{ user }` it returns becomes the session user. */
  updateProfile: (body: UpdateProfileRequest) => Promise<boolean>;
  /** POST /auth/password/change — this session keeps its tokens. */
  changePassword: (body: ChangePasswordRequest) => Promise<boolean>;
  /** POST /auth/me/avatar (D-045); the returned user becomes the session user. */
  uploadAvatar: (file: Blob, filename?: string) => Promise<boolean>;
  /** DELETE /auth/me/avatar; the returned user becomes the session user. */
  removeAvatar: () => Promise<boolean>;
}

/**
 * The account page: name, phone, avatar and password over the D-043 / D-045
 * endpoints. One write at a time across the three forms: `busy` says which
 * one is running, so the views can disable the others.
 */
export function useProfile(): UseProfile {
  const api = useApi();
  const { user, applyUser } = useAuth();

  const [busy, setBusy] = useState<ProfileBusy>(null);
  const [actionError, setActionError] = useState<ProfileActionError>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Ref, not state: two taps in one tick both read a stale `busy`.
  const inFlightRef = useRef(false);

  const clearError = useCallback(() => {
    setActionError(null);
    setFieldErrors({});
  }, []);

  const fail = useCallback((err: unknown) => {
    if (err instanceof ApiRequestError) {
      if (isValidationError(err)) {
        const fe = detailsToFieldErrors(err.details);
        setFieldErrors(fe);
        setActionError(fe.current_password ? "wrongCurrent" : "validation");
        return;
      }
      if (err.status === 429) {
        setActionError("rateLimited");
        return;
      }
    }
    setActionError("save");
  }, []);

  /**
   * Shared frame of every write: one at a time, errors cleared before and
   * mapped after. `call` does the request and whatever follows a success.
   */
  const runExclusive = useCallback(
    async (kind: Exclude<ProfileBusy, null>, call: () => Promise<void>) => {
      if (inFlightRef.current) return false;
      inFlightRef.current = true;
      setBusy(kind);
      clearError();
      try {
        await call();
        return true;
      } catch (err) {
        fail(err);
        return false;
      } finally {
        inFlightRef.current = false;
        setBusy(null);
      }
    },
    [clearError, fail]
  );

  /** A write that answers `{ user }`: that user replaces the session user — no second GET /auth/me. */
  const runAndApply = useCallback(
    (kind: Exclude<ProfileBusy, null>, call: () => Promise<{ user: User }>) =>
      runExclusive(kind, async () => {
        const { user: fresh } = await call();
        applyUser(fresh);
      }),
    [applyUser, runExclusive]
  );

  const updateProfile = useCallback(
    (body: UpdateProfileRequest) =>
      runAndApply("profile", () => api.auth.updateProfile(body)),
    [api, runAndApply]
  );

  const changePassword = useCallback(
    (body: ChangePasswordRequest) =>
      runExclusive("password", () => api.auth.changePassword(body)),
    [api, runExclusive]
  );

  const uploadAvatar = useCallback(
    (file: Blob, filename?: string) =>
      runAndApply("avatar", () => api.auth.uploadAvatar(file, filename)),
    [api, runAndApply]
  );

  const removeAvatar = useCallback(
    () => runAndApply("avatar", () => api.auth.removeAvatar()),
    [api, runAndApply]
  );

  return {
    user,
    busy,
    actionError,
    fieldErrors,
    clearError,
    updateProfile,
    changePassword,
    uploadAvatar,
    removeAvatar,
  };
}

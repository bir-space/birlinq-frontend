"use client";

import { useCallback, useState } from "react";
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

export type ProfileBusy = "profile" | "password" | null;

/**
 * `wrongCurrent` is the 422 whose `details.current_password` says the
 * password did not match — the one validation failure that deserves its own
 * message rather than the field's generic text. Other 422s are `validation`
 * with `fieldErrors` filled.
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
  /** PATCH /auth/me, then re-reads the session user so every consumer sees the change. */
  updateProfile: (body: UpdateProfileRequest) => Promise<boolean>;
  /** POST /auth/password/change — this session keeps its tokens. */
  changePassword: (body: ChangePasswordRequest) => Promise<boolean>;
}

/** The account page: name, phone and password over the D-043 endpoints. */
export function useProfile(): UseProfile {
  const api = useApi();
  const { user, refresh } = useAuth();

  const [busy, setBusy] = useState<ProfileBusy>(null);
  const [actionError, setActionError] = useState<ProfileActionError>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

  const updateProfile = useCallback(
    async (body: UpdateProfileRequest) => {
      if (busy !== null) return false;
      setBusy("profile");
      clearError();
      try {
        await api.auth.updateProfile(body);
        await refresh();
        return true;
      } catch (err) {
        fail(err);
        return false;
      } finally {
        setBusy(null);
      }
    },
    [api, busy, clearError, fail, refresh]
  );

  const changePassword = useCallback(
    async (body: ChangePasswordRequest) => {
      if (busy !== null) return false;
      setBusy("password");
      clearError();
      try {
        await api.auth.changePassword(body);
        return true;
      } catch (err) {
        fail(err);
        return false;
      } finally {
        setBusy(null);
      }
    },
    [api, busy, clearError, fail]
  );

  return {
    user,
    busy,
    actionError,
    fieldErrors,
    clearError,
    updateProfile,
    changePassword,
  };
}

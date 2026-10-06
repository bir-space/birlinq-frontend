"use client";

import { useCallback, useRef, useState } from "react";
import {
  ApiRequestError,
  ErrorCode,
  isIdempotencyError,
  isValidationError,
  newIdempotencyKey,
  type CreateEntityRequest,
  type Entity,
} from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import {
  detailsToFieldErrors,
  type FieldErrors,
} from "../shared/field-errors";

export type CreateCardError =
  | "validation"
  | "cardLimit"
  | "rateLimited"
  | "create"
  | null;

/** Everything of POST /entities except `type`, which this hook fixes to `personal`. */
export type CreateCardRequest = Omit<CreateEntityRequest, "type">;

export interface UseCreateCard {
  submitting: boolean;
  error: CreateCardError;
  /** From a 422 — keyed both as sent (`contact.display_name`) and short (`display_name`). */
  fieldErrors: FieldErrors;
  /** Resolves with the new card, or null when `error` says why not. */
  create: (body: CreateCardRequest) => Promise<Entity | null>;
  clearError: () => void;
}

/**
 * One POST /entities with the contact and privacy nested (D-041), under one
 * Idempotency-Key per form attempt.
 *
 * The key is minted on the first submit and kept across retries of the
 * *same* body — a double tap or a flaky network cannot create two cards. It
 * is dropped whenever the next submit will carry a different body: after
 * success, after a 422 the owner has to fix and after the card limit.
 * Reusing a key with a changed body is what the backend answers with
 * IDEMPOTENCY_KEY_MISUSE. The card's address is the server's to draw
 * (D-044); it arrives on the created entity.
 */
export function useCreateCard(): UseCreateCard {
  const api = useApi();
  const keyRef = useRef<string | null>(null);
  // The body the current key was minted for: a key must never travel with a
  // different body, or the backend answers IDEMPOTENCY_KEY_MISUSE.
  const bodyRef = useRef<string | null>(null);
  // Ref, not state: two taps in one tick both read stale `submitting`.
  const inFlightRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<CreateCardError>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const create = useCallback(
    async (body: CreateCardRequest) => {
      if (inFlightRef.current) return null;
      inFlightRef.current = true;
      setSubmitting(true);
      setError(null);
      setFieldErrors({});
      const signature = JSON.stringify(body);
      if (keyRef.current === null || bodyRef.current !== signature) {
        keyRef.current = newIdempotencyKey();
        bodyRef.current = signature;
      }
      try {
        const { entity } = await api.entities.create(
          { type: "personal", ...body },
          { idempotencyKey: keyRef.current }
        );
        keyRef.current = null;
        return entity;
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (isValidationError(err)) {
            keyRef.current = null;
            setFieldErrors(detailsToFieldErrors(err.details));
            setError("validation");
          } else if (err.code === ErrorCode.CardLimitReached) {
            keyRef.current = null;
            setError("cardLimit");
          } else if (err.status === 429) {
            setError("rateLimited");
          } else {
            // A misused key is a client bug: start over rather than loop on it.
            if (isIdempotencyError(err)) keyRef.current = null;
            setError("create");
          }
        } else {
          setError("create");
        }
        return null;
      } finally {
        inFlightRef.current = false;
        setSubmitting(false);
      }
    },
    [api]
  );

  return { submitting, error, fieldErrors, create, clearError };
}

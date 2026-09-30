"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, ErrorCode, type Entity } from "@birlinq/api";
import { useApi } from "@birlinq/platform";

export const CARDS_PAGE_SIZE = 20;

/**
 * Codes, not text — the view maps them onto its own messages. `blocked` is
 * the 409 a moderated card answers to a status change; the row keeps its
 * status, the view says why.
 */
export type CardsActionError = "loadMore" | "publish" | "blocked" | null;

export interface UseCards {
  items: Entity[];
  loading: boolean;
  /** The first load failed; the list is empty and `retry` is the way out. */
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  /** The card whose status is being changed; one at a time. */
  busyId: string | null;
  actionError: CardsActionError;
  retry: () => void;
  loadMore: () => Promise<void>;
  /**
   * Show or hide a card from the list — `active` or `deactivated`, in
   * place. Hiding is as far as it goes: a card is never deleted, its
   * address is permanent (D-044). Resolves true once the server agreed.
   */
  setPublished: (id: string, published: boolean) => Promise<boolean>;
}

/** True when another page follows — a backend from before D-041 sends no `has_more`. */
export function nextHasMore(meta: {
  next_cursor: string | null;
  has_more?: boolean;
}): boolean {
  return meta.has_more ?? meta.next_cursor !== null;
}

/** The owner's business cards (`personal` entities), one cursor page at a time, show/hide in place. */
export function useCards(): UseCards {
  const api = useApi();

  const [items, setItems] = useState<Entity[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<CardsActionError>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const res = await api.entities.list({
          type: "personal",
          limit: CARDS_PAGE_SIZE,
        });
        if (cancelled) return;
        setItems(res.data);
        setCursor(res.meta.next_cursor);
        setHasMore(nextHasMore(res.meta));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const loadMore = useCallback(async () => {
    if (cursor === null || loadingMore) return;
    setLoadingMore(true);
    setActionError(null);
    try {
      const res = await api.entities.list({
        type: "personal",
        limit: CARDS_PAGE_SIZE,
        cursor,
      });
      setItems((cur) => [...cur, ...res.data]);
      setCursor(res.meta.next_cursor);
      setHasMore(nextHasMore(res.meta));
    } catch {
      setActionError("loadMore");
    } finally {
      setLoadingMore(false);
    }
  }, [api, cursor, loadingMore]);

  const setPublished = useCallback(
    async (id: string, published: boolean) => {
      if (busyId !== null) return false;
      const status = published ? "active" : "deactivated";
      setBusyId(id);
      setActionError(null);
      // Optimistic: the badge flips now and flips back only on failure.
      // Only the one row is remembered, so a page appended by loadMore
      // while the request is in flight survives the rollback.
      let previous: Entity["status"] | null = null;
      setItems((cur) =>
        cur.map((e) => {
          if (e.id !== id) return e;
          previous = e.status;
          return { ...e, status };
        })
      );
      try {
        const { entity } = await api.entities.update(id, { status });
        setItems((cur) => cur.map((e) => (e.id === id ? entity : e)));
        return true;
      } catch (err) {
        const blocked =
          err instanceof ApiRequestError && err.code === ErrorCode.EntityBlocked;
        const rollback = previous;
        setItems((cur) =>
          cur.map((e) => {
            if (e.id !== id) return e;
            // The server is the authority on `blocked`: show it rather than
            // the status the row had before moderation stepped in.
            if (blocked) return { ...e, status: "blocked" };
            return rollback !== null ? { ...e, status: rollback } : e;
          })
        );
        setActionError(blocked ? "blocked" : "publish");
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [api, busyId]
  );

  return {
    items,
    loading,
    error,
    hasMore,
    loadingMore,
    busyId,
    actionError,
    retry,
    loadMore,
    setPublished,
  };
}

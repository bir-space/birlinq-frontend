"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, ErrorCode, type Entity } from "@birlinq/api";
import { useApi } from "@birlinq/platform";

export const CARDS_PAGE_SIZE = 20;

/**
 * Codes, not text — the view maps them onto its own messages. `blocked` is
 * the 409 a moderated card answers to DELETE; the row stays, the view says why.
 */
export type CardsActionError = "loadMore" | "remove" | "blocked" | null;

export interface UseCards {
  items: Entity[];
  loading: boolean;
  /** The first load failed; the list is empty and `retry` is the way out. */
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  /** The card being deleted; one at a time. */
  busyId: string | null;
  actionError: CardsActionError;
  retry: () => void;
  loadMore: () => Promise<void>;
  /** Resolves true once the card is gone server-side. */
  remove: (id: string) => Promise<boolean>;
}

/** True when another page follows — a backend from before D-041 sends no `has_more`. */
export function nextHasMore(meta: {
  next_cursor: string | null;
  has_more?: boolean;
}): boolean {
  return meta.has_more ?? meta.next_cursor !== null;
}

/** The owner's business cards (`personal` entities), one cursor page at a time, delete in place. */
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

  const remove = useCallback(
    async (id: string) => {
      if (busyId !== null) return false;
      setBusyId(id);
      setActionError(null);
      // Optimistic: the row disappears now and comes back only on failure.
      // Only the removed row is remembered, so a page appended by loadMore
      // while the request is in flight survives the rollback.
      let removed: Entity | undefined;
      let index = -1;
      setItems((cur) => {
        index = cur.findIndex((e) => e.id === id);
        removed = cur[index];
        return cur.filter((e) => e.id !== id);
      });
      try {
        await api.entities.remove(id);
        return true;
      } catch (err) {
        setItems((cur) => {
          if (!removed || cur.some((e) => e.id === id)) return cur;
          const at = Math.min(Math.max(index, 0), cur.length);
          return [...cur.slice(0, at), removed, ...cur.slice(at)];
        });
        setActionError(
          err instanceof ApiRequestError && err.code === ErrorCode.EntityBlocked
            ? "blocked"
            : "remove"
        );
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
    remove,
  };
}

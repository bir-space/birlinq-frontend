"use client";

import { useCallback, useEffect, useState } from "react";
import type { Interaction } from "@birlinq/api";
import { useApi } from "@birlinq/platform";

export const PAGE_SIZE = 20;

/**
 * Errors are reported as codes, never as text. A hook in this package has no
 * business knowing which locale is loaded or which translation library the
 * host uses — the view maps these onto messages it already has.
 */
export type InteractionsActionError = "loadMore" | "resolve" | null;

export interface UseInteractions {
  items: Interaction[];
  loading: boolean;
  /** The first load failed; the list is empty and `retry` is the way out. */
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  /** Ids with a resolve in flight, so a row can disable its own button. */
  resolving: ReadonlySet<string>;
  actionError: InteractionsActionError;
  retry: () => void;
  loadMore: () => Promise<void>;
  resolve: (id: string) => Promise<void>;
}

/** The owner's interaction feed: one cursor page at a time, resolve in place. */
export function useInteractions(): UseInteractions {
  const api = useApi();

  const [items, setItems] = useState<Interaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<InteractionsActionError>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const res = await api.owner.interactions({ limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(res.data);
        setCursor(res.meta.next_cursor);
        setHasMore(res.meta.has_more);
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
      const res = await api.owner.interactions({ limit: PAGE_SIZE, cursor });
      setItems((cur) => [...cur, ...res.data]);
      setCursor(res.meta.next_cursor);
      setHasMore(res.meta.has_more);
    } catch {
      setActionError("loadMore");
    } finally {
      setLoadingMore(false);
    }
  }, [api, cursor, loadingMore]);

  const resolve = useCallback(
    async (id: string) => {
      if (resolving.has(id)) return;
      setResolving((prev) => new Set(prev).add(id));
      setActionError(null);
      // Optimistic, and it stays that way: the endpoint answers 204 with no
      // body. Per the backend's D-033 `status` is the only field resolving can
      // change, so the local flip below is the whole truth — there is nothing
      // to read back.
      setItems((cur) =>
        cur.map((i) => (i.id === id ? { ...i, status: "resolved" as const } : i))
      );
      try {
        await api.owner.resolveInteraction(id);
      } catch {
        setItems((cur) =>
          cur.map((i) => (i.id === id ? { ...i, status: "new" as const } : i))
        );
        setActionError("resolve");
      } finally {
        setResolving((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [api, resolving]
  );

  return {
    items,
    loading,
    error,
    hasMore,
    loadingMore,
    resolving,
    actionError,
    retry,
    loadMore,
    resolve,
  };
}

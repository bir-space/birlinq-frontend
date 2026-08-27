"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entity, QrCode, QrStatus } from "@birlinq/api";
import { useApi } from "@birlinq/platform";

export type QrListActionError = "loadMore" | "toggle" | null;

export interface UseQrList {
  items: QrCode[];
  /** Entity by id, for titles. Optional context — absence is not an error. */
  entities: Record<string, Entity>;
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  /** The QR currently being paused or resumed; one at a time. */
  busyId: string | null;
  actionError: QrListActionError;
  retry: () => void;
  loadMore: () => Promise<void>;
  togglePause: (qr: QrCode) => Promise<void>;
}

/** The owner's QR codes, with pause/resume applied optimistically. */
export function useQrList(): UseQrList {
  const api = useApi();

  const [items, setItems] = useState<QrCode[]>([]);
  const [entities, setEntities] = useState<Record<string, Entity>>({});
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<QrListActionError>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        // Entities are optional context (titles); don't fail the page on them.
        const [qrRes, entRes] = await Promise.allSettled([
          api.qr.list(),
          api.entities.listAll(),
        ]);
        if (cancelled) return;
        if (qrRes.status === "rejected") {
          setError(true);
          return;
        }
        setItems(qrRes.value.data);
        setCursor(qrRes.value.meta.next_cursor);
        setHasMore(qrRes.value.meta.has_more);
        if (entRes.status === "fulfilled") {
          setEntities(Object.fromEntries(entRes.value.map((e) => [e.id, e])));
        }
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
      const res = await api.qr.list(cursor);
      setItems((cur) => [...cur, ...res.data]);
      setCursor(res.meta.next_cursor);
      setHasMore(res.meta.has_more);
    } catch {
      setActionError("loadMore");
    } finally {
      setLoadingMore(false);
    }
  }, [api, cursor, loadingMore]);

  const togglePause = useCallback(
    async (qr: QrCode) => {
      if (busyId !== null) return;
      const pausing = qr.status === "activated";
      const prevStatus: QrStatus = qr.status;
      setBusyId(qr.id);
      setActionError(null);
      setItems((cur) =>
        cur.map((i) =>
          i.id === qr.id
            ? { ...i, status: (pausing ? "paused" : "activated") as QrStatus }
            : i
        )
      );
      try {
        const { qr_code } = pausing
          ? await api.qr.pause(qr.id)
          : await api.qr.resume(qr.id);
        setItems((cur) => cur.map((i) => (i.id === qr.id ? qr_code : i)));
      } catch {
        setItems((cur) =>
          cur.map((i) => (i.id === qr.id ? { ...i, status: prevStatus } : i))
        );
        setActionError("toggle");
      } finally {
        setBusyId(null);
      }
    },
    [api, busyId]
  );

  return {
    items,
    entities,
    loading,
    error,
    hasMore,
    loadingMore,
    busyId,
    actionError,
    retry,
    loadMore,
    togglePause,
  };
}

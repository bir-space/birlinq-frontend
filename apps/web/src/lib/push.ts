"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@birlinq/platform";

/**
 * Web push subscription (backend D-034).
 *
 * Web-only on purpose, so it lives here and not in `@birlinq/core`: VAPID
 * subscriptions come out of a service worker, and React Native has none. A
 * native client would need FCM/APNs, which the backend does not expose.
 */

export type PushState =
  | "loading"
  /** No VAPID key in the environment — a deployment gap, not a user's problem. */
  | "unconfigured"
  /**
   * The page is not on a secure origin, so the browser withholds the whole
   * API. Distinct from "unsupported" on purpose: the browser is perfectly
   * capable, the address is the problem — which is exactly what happens when
   * a phone opens the dev server over http://192.168.x.x.
   */
  | "insecure"
  /** The browser has no push at all. Nothing to offer. */
  | "unsupported"
  /** iOS Safari: push exists, but only once the site is on the Home Screen. */
  | "needs-install"
  | "denied"
  | "off"
  | "on";

export type PushPlatform = "ios" | "android" | "desktop";

export interface UsePush {
  state: PushState;
  platform: PushPlatform;
  /** An enable/disable call is in flight. */
  busy: boolean;
  failed: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * The browser wants the VAPID key as bytes, not as the base64url it ships in.
 *
 * Built over an explicit ArrayBuffer: `Uint8Array.from` widens to
 * `Uint8Array<ArrayBufferLike>`, which `applicationServerKey` does not accept.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function detectPlatform(): PushPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch points are what give it away.
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (isIos) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** Installed to the Home Screen / launched as an app rather than a browser tab. */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
}

/**
 * https, localhost or 127.0.0.1. Anything else — a LAN address in development,
 * most often — hides service workers entirely, and a browser that hid them
 * looks identical to one that never had them.
 */
function isSecureOrigin(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

function hasPushSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js");
}

export function usePush(): UsePush {
  const api = useApi();
  const [state, setState] = useState<PushState>("loading");
  const [platform, setPlatform] = useState<PushPlatform>("desktop");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlatform(detectPlatform());

    void (async () => {
      if (VAPID_PUBLIC_KEY === "") {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — the notifications card stays hidden."
          );
        }
        if (!cancelled) setState("unconfigured");
        return;
      }

      if (!isSecureOrigin()) {
        if (!cancelled) setState("insecure");
        return;
      }

      if (!hasPushSupport()) {
        // On iOS the API only appears in an installed PWA, so "no support" and
        // "not installed yet" are the same observation with different answers.
        if (!cancelled) {
          setState(
            detectPlatform() === "ios" && !isStandalone()
              ? "needs-install"
              : "unsupported"
          );
        }
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }

      const reg = await registration();
      const existing = await reg.pushManager.getSubscription();

      if (existing === null) {
        if (!cancelled) setState("off");
        return;
      }

      // Re-send on every load, as the backend asks: the same endpoint is updated
      // rather than duplicated, and a subscription the browser quietly rotated
      // is restored instead of going dark.
      try {
        await api.push.subscribe(
          existing.toJSON() as unknown as Parameters<typeof api.push.subscribe>[0]
        );
      } catch {
        // Offline or a 5xx — the local subscription is still good; keep the
        // toggle on rather than telling the owner push is off when it is not.
      }
      if (!cancelled) setState("on");
    })().catch(() => {
      if (!cancelled) setState("unsupported");
    });

    return () => {
      cancelled = true;
    };
  }, [api]);

  const enable = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }

      const reg = await registration();
      const subscription =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      await api.push.subscribe(
        subscription.toJSON() as unknown as Parameters<
          typeof api.push.subscribe
        >[0]
      );
      setState("on");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [api]);

  const disable = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const reg = await registration();
      const subscription = await reg.pushManager.getSubscription();
      if (subscription !== null) {
        // Backend first: if it fails we keep the browser subscription, so the
        // owner is not left believing they unsubscribed while pushes continue.
        await api.push.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [api]);

  return { state, platform, busy, failed, enable, disable };
}

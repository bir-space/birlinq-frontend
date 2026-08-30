/*
 * Push service worker.
 *
 * Deliberately minimal: it shows what the backend sent and opens the URL the
 * backend built. No caching, no offline shell — this file exists so the browser
 * will hand us a PushSubscription at all, and adding a cache here would make the
 * app's update story a second thing to reason about.
 *
 * Payload shape (backend docs/api/frontend-handoff.html): title, body, icon,
 * data.url always; tag on scenario events, where a shared tag collapses repeats
 * into one notification instead of a stack on the lock screen.
 */

self.addEventListener("install", () => {
  // Take over without waiting for every old tab to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: payload.tag,
      data: payload.data ?? {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data && event.notification.data.url;
  if (!url) return;

  // Focus an existing tab on the same origin rather than piling up windows.
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});

# Frontend Decision Log

Append-only log of decisions owned by **this** repository — structure, client stack,
rendering strategy, platform choices. Never edit a historical entry; supersede it with a new
one if the direction changes.

Entries are numbered `FE-NNN`. The backend keeps its own log with its own `D-NNN` numbering;
the two are independent. A decision that binds both sides — the API contract, notification
channels, privacy rules — belongs to the backend log. Reference it from here, do not copy it.

## Format

```
## FE-NNN — Short title
- **Status:** Accepted | Open | Superseded by FE-XXX
- **Date:** YYYY-MM-DD
- **Owner:** <name or role>
- **Context:** <why a decision was needed>
- **Decision:** <what was chosen>
- **Rationale:** <why this option over the others>
- **Alternatives considered:** <with trade-offs>
- **Consequences:** <what this enables or blocks>
```

---

## FE-001 — Repository becomes an npm-workspaces monorepo

- **Status:** Accepted
- **Date:** 2026-08-27
- **Owner:** Frontend lead
- **Context:** A mobile app moved from "someday" to the roadmap, and the product premise moved
  with it: the app is the primary surface for the owner, the website is a business card and
  the first touch. This repo was a single Next.js app — 7 245 lines of components and 2 296
  lines of `src/lib`. Two clients against one API need a shared API layer, shared translations
  and a shared design language, or they drift apart. The drift is not hypothetical: the
  `/mock` preview tree already went stale once as a copy-paste of the real components, and was
  rebuilt around a shared provider precisely to stop that.
- **Decision:** Restructure as a monorepo on **npm workspaces**: `apps/web` (Next.js, SSR) and
  `apps/mobile` (Expo) over shared packages `api`, `core`, `i18n`, `tokens`, `platform`.
  Internal packages ship as TypeScript source — consumed through `transpilePackages` in Next
  and natively by Metro — with no per-package build step. The backend stays a separate
  repository; the contract between them remains its OpenAPI spec.
- **Rationale:** npm workspaces because the repo already uses npm with a committed
  `package-lock.json`, and five packages do not justify Turborepo's configuration cost or a
  package-manager migration. Source-only packages because a build-and-watch step per package
  is the main thing that makes small monorepos unpleasant to work in. The split runs along the
  line that matters — logic versus presentation — so a contract change breaks
  `npm run typecheck` in both apps at once. That property is not available across two
  repositories, and it is the whole return on the restructuring.
- **Alternatives considered:** (a) Two independent repos with the API client duplicated — zero
  setup cost, guaranteed drift, every contract change becomes a two-repo coordination problem.
  (b) Publishing the shared layer as a private npm package — correct at a larger scale, but
  inserts a release cycle between writing a type and using it, for two consumers that live in
  the same working copy. (c) Turborepo from the start — remote caching pays off at build times
  this project does not have; it can be added later without changing the layout.
- **Consequences:**
  - `src/` and `messages/` moved to `apps/web/` with no behavioural change (step 1, done).
  - `src/lib/api` and `src/lib/auth` become `packages/api`. `CLAUDE.md` already required these
    to stay framework-agnostic, so this formalises an existing constraint.
  - `packages/core` holds headless hooks so web and native share logic without markup.
  - The `/mock` tree becomes one implementation of the platform contract, not a special case.
  - Layout, boundaries and migration steps are documented in `docs/architecture/monorepo.md`.

---

## FE-002 — Mobile app on React Native (Expo), not Capacitor

- **Status:** Accepted
- **Date:** 2026-08-27
- **Owner:** Frontend lead
- **Context:** The owner cabinet needs push notifications — the only channel that makes a
  scenario like "your car is blocking me" useful in real time. Two shells were evaluated:
  Capacitor wrapping the existing web build, and React Native via Expo. The deciding input
  arrived late in the evaluation — **the app is planned as the primary product, the website as
  a business card and first touch**. Under the opposite premise the recommendation was
  Capacitor; this entry records that so the reversal stays legible to a future reader.
- **Decision:** Build the mobile app with **Expo (React Native) + Expo Router + NativeWind**,
  sharing `packages/{api,core,i18n,tokens}` with `apps/web`. Presentation is written natively
  and is not shared. React Native Web, Solito and Tamagui are rejected as the unification
  strategy. Push tokens are native FCM/APNs tokens, not Expo Push Service tokens.
- **Rationale:** With the app primary, the "every screen written twice" objection to React
  Native mostly dissolves — most future screens will exist only in the app, and the ~1 678
  lines of web `dashboard` components need no long-term web counterpart. What stays web-only
  (`landing` and `public`, 2 543 lines) was never a sharing candidate. Against that one-time
  cost, React Native buys native scroll and input responsiveness on low-end Android for the
  surface people open regularly, a far deeper native module ecosystem for later work, and no
  App Store guideline 4.2 "minimum functionality" risk. Expo specifically because **EAS Build
  produces iOS builds from Windows with no Mac in the loop** — the team is Windows-only, and
  this was the hardest practical blocker in the Capacitor plan. NativeWind keeps Tailwind class
  syntax, so shared tokens carry over and existing styling knowledge is not discarded. Native
  push tokens rather than Expo's relay because push is the app's core value, and the primary
  product should not depend on a third party in that path.
- **Alternatives considered:** (a) **Capacitor over a static Next export** — reuses all 7 245
  lines of existing components immediately, but needs `output: 'export'`, which breaks on four
  things already in this codebase: `middleware.ts` (next-intl), `localePrefix: "as-needed"`,
  and the dynamic routes `dashboard/qr/[id]` and `q/[code]`. Workarounds exist (query-param
  routes, a post-build root redirect) but amount to fighting the framework, and a webview is a
  poor ceiling for a primary product. (b) **Capacitor over a Vite SPA** — removes those four
  blockers cleanly, and was the recommendation while the app was assumed to be a companion;
  still a webview. (c) **React Native Web / Solito / Tamagui** — the only way to genuinely
  write presentation once, but it requires rewriting the *existing website* in RN primitives
  and degrades SSR, which is now more valuable rather than less.
- **Consequences:**
  - `apps/web` stays a full Next.js app with SSR. Landing SEO and cold first paint on
    `/q/{code}` are core to the product premise, so the question of whether SSR earns its keep
    here is closed in its favour.
  - `token-store` moves to `expo-secure-store` (Keychain/Keystore) on native. Its API becomes
    asynchronous, forcing a hydrate-once-at-boot refactor in `use-auth.tsx`. Invariant #3 in
    `CLAUDE.md` still holds — the access token stays in memory; it is the refresh token that
    changes home.
  - Two release channels: EAS Update ships JS-bundle changes over the air; native shell changes
    go through store review.
  - **Backend dependency, undecided on their side:** a device-token table, a push notification
    channel and a dispatcher with email fallback. The backend's D-001 currently puts email
    first, which is too slow for the primary case and will need superseding there. Raise this
    with the backend lead before mobile step 6 — it is their call, not ours.
  - Revisit triggers, recorded so a future reader knows what would invalidate this: the website
    becoming the primary surface again, or the app's screen set staying small enough that a
    webview would have sufficed.

---

## FE-006 — React and native modules are pinned in the root manifest

- **Status:** Accepted
- **Date:** 2026-08-27
- **Owner:** Frontend lead
- **Context:** Adding `apps/mobile` broke `apps/web`. Expo SDK 57 bundles exact versions
  (React 19.2.3, React Native 0.86.2), while the transitive Expo tree declares loose peers
  that npm satisfied with newer releases. The result was two copies of React: `next` at the
  workspace root resolved 19.2.8 while `apps/web` had a nested 19.2.3, and the web build died
  prerendering `/404` with `Cannot read properties of null (reading 'useContext')` — the
  classic two-Reacts symptom. `expo-doctor` independently flagged duplicate `react-native`,
  `react-native-reanimated` and `react-native-worklets`, which break native builds outright.
- **Decision:** The **root** `package.json` pins `react`, `react-dom`, `react-native`,
  `react-native-reanimated` and `react-native-worklets` to the exact versions in
  `expo/bundledNativeModules.json`, listed in both `dependencies` and `overrides`. Every
  workspace uses those versions; the web's React version therefore follows the mobile SDK.
  Raising Expo SDK means updating these pins in the same commit.
- **Rationale:** npm's `overrides` alone did not work — with an existing tree it declines to
  re-resolve, and the pins never reached the lockfile. Root `dependencies` do reliably win
  hoisting, which is what actually produces one copy. Both fields are kept: `dependencies`
  is the lever that works today, `overrides` states the intent for transitive requests.
  React's version is the mobile SDK's to choose because a native runtime cannot simply take a
  newer one, whereas Next.js is comfortable across the 19.x range.
- **Alternatives considered:** (a) `overrides` only — the correct-looking answer, and it did
  nothing here. (b) Let each app nest its own copy — works for the JS bundle because Metro
  resolves per-project, but leaves duplicate *native* modules, which `expo-doctor` rejects
  and native builds cannot link. (c) Pin only inside `apps/mobile` — does not constrain what
  npm hoists to the root, which is precisely where `next` looks.
- **Consequences:**
  - Root `package.json` carries runtime dependencies despite building nothing itself. That
    reads oddly and needs the comment it has: it is hoisting control, not a real dependency.
  - After changing a pin, `npm install` may report "up to date" without re-resolving. Delete
    the offending `node_modules/<pkg>` directories and the lockfile, then install again.
  - `npx expo-doctor` from `apps/mobile` is the check that catches regressions here; it
    should run before any mobile release. All 21 checks pass as of this entry.
  - Web and mobile can no longer take React upgrades independently.

---

## FE-007 — Version pinning uses root `dependencies` only, not `overrides`

- **Status:** Accepted
- **Supersedes:** the `overrides` half of **FE-006**; the rest of that entry stands
- **Date:** 2026-08-27
- **Owner:** Frontend lead
- **Context:** FE-006 pinned React and the native modules in both `dependencies` and
  `overrides`, on the reasoning that one is the lever and the other states intent. That was
  written while `overrides` merely appeared to do nothing. On the next clean resolve — after
  deleting the lockfile to add `packages/core` — npm refused to install at all:
  `EOVERRIDE: Override for react-native@0.86.3 conflicts with direct dependency`. npm forbids
  overriding a package the manifest also depends on directly unless the specs match exactly,
  and `expo install --fix` had meanwhile moved the direct spec to a newer patch. So the field
  was never silently ignored; it was invalid, and an incremental install simply had not
  re-resolved far enough to say so.
- **Decision:** Pin in root `dependencies` only. Do not add an `overrides` block for a
  package the root already depends on.
- **Rationale:** Root `dependencies` alone produce exactly one copy of each package, which is
  the whole goal, and they cannot contradict themselves. Keeping a second declaration of the
  same intent bought nothing and turned a version bump into a broken install.
- **Alternatives considered:** (a) Keep `overrides` and mirror every bump into both fields —
  two places to forget, and forgetting fails the install rather than degrading. (b) Drop the
  root `dependencies` and keep only `overrides` — then `next`, which resolves from the root,
  finds no React at all; that failure mode was observed while getting here.
- **Consequences:**
  - Bumping the Expo SDK means re-reading `expo/bundledNativeModules.json` and updating the
    root pins in the same commit, exactly as FE-006 says — but in one place.
  - `npx expo install --fix` from `apps/mobile` is what discovers a drifted patch version;
    `expo-doctor` reports it, and the root pins then have to follow.
  - The recovery note in FE-006 still applies: after changing a pin, delete the relevant
    `node_modules/<pkg>` directories and the lockfile, then install again.

---

## FE-008 — Web push is a web-only channel; the mobile app is not covered by it

- **Status:** Accepted
- **Supersedes:** the push-transport half of **FE-002**; its choice of Expo stands
- **Date:** 2026-08-27
- **Owner:** Frontend lead
- **Context:** The backend shipped **D-034 — Web push as the primary owner channel, email as
  fallback**: `laravel-notification-channels/webpush` over VAPID, with `POST /push/subscribe`
  and `DELETE /push/unsubscribe` taking a browser `PushSubscription.toJSON()` verbatim. This
  is not the transport FE-002 assumed. FE-002 said push tokens would be native FCM/APNs ones;
  VAPID subscriptions are produced by a service worker, which React Native does not have. The
  backend has no FCM or APNs path at all, so there is nothing for `apps/mobile` to register
  with.
- **Decision:** Implement web push in `apps/web` against D-034 as shipped, and treat it as a
  **web-only** channel. `usePush` lives in `apps/web/src/lib/push.ts`, not in
  `@birlinq/core` — it is exactly the kind of platform-specific thing that package exists to
  keep out. `packages/api` gains `pushApi` because the endpoints are contract, not platform.
  `apps/mobile` gets no push in this change.
- **Rationale:** Shipping the channel the backend actually has beats waiting for the one we
  planned. The web is also where the owner already is at the moment that matters — they
  activate a sticker in a browser — so a web subscription reaches people who have not
  installed anything. Putting the hook in the web app rather than `core` keeps the package
  boundary honest instead of adding a capability three of four consumers cannot use.
- **Alternatives considered:** (a) Ask the backend for FCM before building anything — leaves
  the shipped channel unused and the product's most time-sensitive moment on email alone.
  (b) Put `usePush` in `@birlinq/core` behind a capability check — a hook that throws or
  no-ops on native is worse than not having it there.
- **Consequences:**
  - **Mobile step 6 is still blocked, and on a different thing than FE-002 recorded.** It now
    needs the backend to add FCM/APNs alongside web push — a second transport, not a
    reconfiguration. That is the backend's decision to make; raise it before planning step 6.
  - **iOS needs the site installed to the Home Screen.** Safari exposes no Push API in a
    normal tab, and gives no hint why, so the UI detects the case and explains it rather than
    showing a button that cannot work. That is why `app/manifest.ts`, the apple-touch icon
    and `appleWebApp` metadata are part of this change: installability is a push requirement
    here, not a nice-to-have.
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` joins the web environment. The backend hands it over
    separately; without it the notifications card hides itself rather than failing loudly at
    an owner.
  - `public/sw.js` is deliberately push-only — no caching. Adding a cache would make the web
    app's update story a second thing to reason about, for no benefit here.
  - Email keeps arriving on both channels by the backend's design, so a failed subscription
    degrades rather than silences.

---

## FE-009 — Mobile push flow: iOS only inside the Home Screen app, in-app browsers are turned away

- **Status:** Accepted
- **Date:** 2026-09-03
- **Owner:** Frontend lead
- **Context:** The first check on real phones found no notifications on either an iPhone or a
  Samsung, while the desktop worked. The two were not looking at the same build: the desktop
  was the local dev server, the phones were the production domain, and production had been
  deployed before web push landed — `/sw.js`, `/manifest.webmanifest` and the guide's push
  section all answered 404. A stale deploy, not a phone problem. But the exercise showed that
  the card's states did not describe what phones actually run into: a link opened inside
  Telegram or Instagram lands in a WebView with no Push API; an iPhone below 16.4 has no Web
  Push even once installed; and a Home Screen app on iOS starts signed out, because Apple
  gives it a storage container of its own. Each of those had been showing either the generic
  "your browser doesn't support notifications" or nothing at all — and "nothing at all" is
  exactly what a stale deploy looks like too.
- **Decision:** One flow per platform, and the card is never blank once the VAPID key exists.
  - **Android:** the button in the cabinet, nothing to install. Chrome and Samsung Internet
    both subscribe from a tab. A WebView (`; wv)` in the UA, or the Facebook/Instagram/Line
    wrappers) gets "open this in Chrome" instead of a button that cannot work.
  - **iOS:** no button in a Safari tab, ever — the card shows the manual steps. Push lives
    only in the Home Screen app, which has its own storage, so step five is "open it from the
    icon and sign in again"; no attempt is made to carry the Safari session over. An iPhone
    below 16.4 gets "update iOS" rather than six steps that lead nowhere. iOS in-app views
    that use Safari's own UA (Telegram, WhatsApp) cannot be told apart from Safari; the
    first step says "open in Safari", which covers them.
  - **Loading** shows a spinner line rather than nothing, so an absent card means one thing
    only: no VAPID key in the build. Dev builds print the resolved state under the card,
    because a phone has no console.
  - **Testing on phones is against an https deployment,** built with
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY` present at `next build`. LAN over http is fine for
    everything except push, and the card says so.
- **Rationale:** Every state above is a different instruction for a real person holding a
  phone, and the cost of getting it wrong is that the person concludes the feature is broken
  and stops. The states are cheap; the UA sniffing is confined to the branch where the Push
  API is already known to be missing, so a browser that has push is never turned away on the
  strength of a string.
- **Alternatives considered:** (a) Hand the session to the Home Screen app through a URL
  token — a token in a URL is a security smell, and the separate container is Apple's
  design rather than a bug to route around. (b) `beforeinstallprompt` on Android to offer an
  install button — not needed for push, so not in this change; it remains a reasonable
  separate step if the app-like entry point is wanted. (c) Keep hiding the card while
  loading — that is what made "nothing on phones" indistinguishable from a stale deploy.
- **Consequences:**
  - `PushState` gains `in-app` and `ios-outdated`; `usePush` exposes `standalone`. The iOS
    instruction has six steps; Android gets a Samsung battery note.
  - `README.md` carries the deploy checklist and the per-platform flow; `CLAUDE.md`
    invariant 7 names the storage-container rule and the build-time key.
  - The manifest's `start_url` is `/dashboard`, which is the RU route. KK and EN users who
    install the app land in RU on launch until the manifest is made per-locale — small,
    known, and not worth a fourth locale-aware manifest route today.

---

## FE-010 — QR codes are rendered in the browser with `qrcode`, the one approved runtime dependency

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owner:** Frontend lead
- **Context:** A business card has a public link, `/p/{alias}` (backend D-040), and the owner
  needs that link as a QR code: on the card's QR page for a stranger to scan off a screen,
  in the cabinet, and as a PNG to print. The stickers' codes are printed by the backend's
  batch pipeline; the link QR has no server side at all. `CLAUDE.md` forbids a new runtime
  dependency without a decision, and a QR encoder is not something to hand-roll in an
  afternoon — Reed–Solomon, masking and segment selection are about a thousand lines to
  own and get subtly wrong.
- **Decision:** `qrcode@1.5.4` with `@types/qrcode`, in `apps/web` only, imported on demand
  in `apps/web/src/lib/qr.ts` so it ships as its own chunk and loads only where a QR is
  drawn — the card's QR panel and `/p/{alias}/qr` — never on the landing or the scan flow.
  Display is an SVG data URL in an `<img>` (`toString({ type: "svg" })`; a canvas render
  writes inline width/height and fights the layout); download is a 512 px PNG from
  `toDataURL`. Both are always dark on white, whatever theme the card wears (FE-012): a
  code has to scan from a dark screen and from paper alike. The URL inside is
  `cardUrl(alias)` from `lib/public-url.ts` — `NEXT_PUBLIC_APP_URL`, no locale prefix, no
  `/mock`.
  The honest dependency list: `qrcode` declares three runtime dependencies. `dijkstrajs`
  (installed at the root) is used by the encoder's segment optimiser and **does** reach
  the browser chunk. `pngjs` and `yargs` serve the Node PNG renderer and the CLI; the
  package's `browser` field swaps `lib/index.js` for `lib/browser.js`, which never
  requires them, so they stay out of the bundle. Both are nested under
  `node_modules/qrcode/node_modules` — the Expo toolchain already holds newer majors at the
  root — together with yargs 15's own helpers (`camelcase`, `cliui`, `wrap-ansi`, `y18n`,
  `yargs-parser`). None of this touches `packages/*`: `rg qrcode packages` must stay
  empty, and the mobile app would render its codes with a native module anyway.
- **Rationale:** `qrcode` is the boring choice — MIT, no dependencies of its own in the
  browser build beyond one graph helper, and it produces both formats we need from one
  call. A dynamic import keeps the cost where the feature is. Putting it in `apps/web`
  rather than a shared package keeps the "platform-free packages" rule intact and avoids
  pretending the mobile app could use it.
- **Alternatives considered:** (a) Write the encoder — the size of the job is the
  argument against it, and a bug in it is a sticker that does not scan. (b) A backend
  endpoint that renders PNGs — an API surface, a throttle and a cache for something purely
  presentational, and a round trip for every preview. (c) A React QR component
  (`qrcode.react`, `react-qr-code`) — draws an SVG inline, but produces no PNG without a
  canvas anyway and couples the rendering to React for no gain. (d) An external QR image
  API — hotlinking, and it hands every card's URL to a third party; `CLAUDE.md` already
  forbids it.
- **Consequences:**
  - The "no new runtime dependencies" rule stands, with this one named exception;
    `apps/web/package.json` is the only manifest that changed.
  - The downloaded PNG must be verified by scanning it with a phone against a build made
    with `NEXT_PUBLIC_APP_URL` set (see FE-014 and the README deploy notes); a code that
    encodes `localhost` is the failure mode to look for.
  - `lib/share.ts` (`copyText`, `shareOrCopy`, `downloadDataUrl`) carries the surrounding
    clipboard, share-sheet and download plumbing, so the QR panel has no browser API of its
    own.

---

## FE-011 — One cabinet, two products: the Move ⇄ Business switcher and the Business route tree

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owner:** Frontend lead
- **Context:** Business — digital business cards, backend D-040/D-041 — is the second
  product an owner can hold, and it arrives in a cabinet that was built for Move alone:
  one session, one header, three tabs. The old bir-qr product had a cabinet of its own.
  Several things had to be settled at once: where the product switch lives on a 360–390 px
  screen, how the Business routes sit next to Move's, where the account profile goes,
  what a signed-out deep link does, what Move's QR screens show for a sticker that is
  bound to a card rather than a car, where a sticker gets attached to a card, and whether
  the frontend keeps bir-qr's "one card on the trial" rule.
- **Decision:**
  - **Routes.** Business lives under the same cabinet: `/dashboard/business` (overview),
    `/dashboard/cards`, `/dashboard/cards/new`, `/dashboard/cards/[id]`,
    `/dashboard/pricing`. Move keeps `/dashboard`, `/dashboard/interactions`,
    `/dashboard/qr`. `/dashboard/profile` belongs to neither. Every route has a `/mock`
    twin.
  - **Switcher.** `components/dashboard/products.ts` owns `PRODUCTS`, `PRODUCT_HOME`,
    `TABS[product]` and `productFromPath()`; `ProductSwitcher.tsx` is a segmented pill.
    It is the first item of the existing tab strip, then a divider, then the product's
    tabs, then a trailing neutral **profile pill** (`IconUser` + `dashboard.nav.profile`)
    — one strip that scrolls sideways on phones. Not in the 72 px logo row: at 360–390 px
    there is no room there. The active product is tinted `bg-accent/15 text-accent`, the
    active tab keeps its white pill, so the two levels of navigation read differently.
  - **Which product is showing** is read off the pathname. The last product seen is
    remembered in `localStorage` under `birlinq.product` (in a try/catch), and that memory
    decides only the highlight on the neutral profile page and where the logo links. It
    never redirects anyone.
  - **Guard.** Arriving signed out at a cabinet URL goes to `/login?next=<pathname>`;
    `LoginView` honours `next` (a safe relative path only) and otherwise lands on the
    remembered product's home. A session that dies later goes to a plain `/login`, and the
    guard stays out of the way while the shell's own logout is navigating.
  - **Move screens are type-aware.** `QrListView` shows a card icon and links a sticker
    bound to a `personal` entity to `/dashboard/cards/{id}`; `QrDetailView` shows a
    "bound to a card" summary with that link instead of the vehicle form and the car
    privacy toggles.
  - **Attaching a sticker to a card** is a section of the card editor
    (`business/sections/QrSection.tsx`: code and activation token →
    `useCard().attachSticker`, which is `qr.lookup` then `qr.activate` with the card's
    `entity_id`), not a second wizard. The A1–A5 activation wizard stays Move's.
  - **No client-side card limit.** bir-qr's "one card on the trial" is not ported. The
    limit is the backend's `birlinq.cards.max_per_user` (null by default); a 409
    `CARD_LIMIT_REACHED` surfaces as `useCreateCard`'s `cardLimit` and a modal that links to
    `/dashboard/pricing`. Pricing is a static page with a lead CTA; nothing is sold.
- **Rationale:** One shell means one guard, one header, one logout and one place the
  mobile app will have to mirror; a second cabinet would have copied all four. Deriving
  the product from the URL keeps every page bookmarkable and makes the switch a plain
  link, which is the cheapest possible state. Remembering the product only as a hint is
  what keeps a typed URL honest: `/dashboard` is Move, always. The sticker attach belongs
  in the editor because that is where the owner is when they hold the sticker and the
  card side by side. The limit is the backend's because it is a product knob, not a rule
  the frontend can enforce.
- **Alternatives considered:** (a) A separate `/business/*` cabinet with its own shell —
  duplicates the guard and header and splits the profile. (b) A sidebar with the products
  as sections — a desktop layout; the cabinet is mobile-first with a top strip.
  (c) Remember the product on the user record — a backend field for a UI highlight.
  (d) Auto-redirect `/dashboard` to the remembered product — surprises whoever typed the
  URL, and turns a hint into state. (e) Attach a sticker through the activation wizard
  with an entity picker — the wizard is the public, Move-shaped path a stranger reaches
  from a fresh sticker; an owner in the cabinet is somewhere else.
- **Consequences:**
  - `/dashboard` remains Move's home; the mobile app is untouched and has no Business,
    which keeps FE-003 and FE-004 open exactly as they were.
  - `dashboard.nav.*` gains `businessOverview`, `cards`, `pricing`, `profile`;
    `dashboard.switcher.*` is new; all three locales.
  - `/login` grew a `next` parameter that the register link carries along. Anything
    that later wants to deep-link into the cabinet gets the return trip for free.
  - The profile page is product-neutral by construction; a third product adds an entry
    to `PRODUCTS`, `PRODUCT_HOME` and `TABS`, and a prefix to `productFromPath`.

---

## FE-012 — Card themes are CSS custom properties scoped to the card's `<article>`

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owner:** Frontend lead
- **Context:** A business card has one of ten themes — `default`, `premium`, `minimal`,
  `vibrant`, `sunset`, `ocean`, `forest`, `elegant`, `dark`, `rosegold` — chosen by the
  owner and stored by the backend (`CardTheme`, D-041). `CONVENTIONS.md` and `CLAUDE.md`
  say the product UI stays on the neutral tokens: no inline hex that duplicates a token,
  and the vertical colours never in dashboard, auth or public product screens. A theme is,
  by definition, a palette that is not the app's. The two rules had to meet somewhere.
- **Decision:** `apps/web/src/components/card/themes.ts` holds
  `THEMES: Record<CardTheme, ThemePalette>` — scheme, background, surface, border, text,
  muted, accent, accent foreground, the two header-gradient stops and three tag tones.
  `themeStyle(theme)` turns a palette into CSS custom properties (`--card-bg`,
  `--card-surface`, `--card-border`, `--card-text`, `--card-muted`, `--card-accent`,
  `--card-accent-fg`, `--card-head-from`, `--card-head-to`, the tag tones) set on the
  card's `<article>` and nothing else, plus `data-scheme` so form controls and selection
  follow (`globals.css`: `[data-scheme="light"] { color-scheme: light }`). Components
  under `components/card` read `bg-(--card-surface)`, `text-(--card-text)` and friends and
  never know which theme is on. `default` references the design tokens
  (`var(--color-card)`, `var(--color-brand-blue)`, `var(--color-brand-violet)`, …) so a
  token change follows through; the other nine are literal hex, and **this one file is
  the scoped exception** to the neutral-UI rule. The vertical colours `move`/`id`/`biz`
  are not used. The `ThemePicker` previews from the same palettes. `?theme=` on
  `/p/{alias}` is a presentational override read in `PublicCardPage`, validated against
  the enum and never stored. The QR code never follows the theme (FE-010).
- **Rationale:** A theme is content the owner chose, not chrome we designed, so it lives
  with the card and not in the token file every screen shares. Scoping the variables to
  the article keeps everything around the card — the public header, the abuse link, the
  "create your own" footer — on the app's own palette, and lets one component tree serve
  ten themes without ten class sets or a safelist: Tailwind v4's `bg-(--var)` reads the
  variable where it is used. Referencing the tokens from `default` is what makes the
  default card follow a future restyle for free.
- **Alternatives considered:** (a) Ten sets of `@theme` tokens in `packages/tokens` —
  puts the palettes into the file every consumer, mobile included, treats as the design
  system. (b) `data-theme` selectors in `globals.css` — the palette then lives in CSS far
  from the component that uses it, and grows by ten rules per new variable.
  (c) Per-element inline styles — leaks the palette into every component under `card/`.
  (d) Themed Tailwind variants (`theme-ocean:bg-…`) — a class explosion across every
  element for something a variable expresses once.
- **Consequences:**
  - `CONVENTIONS.md` records the exception; the grep for vertical colours over
    `components/{card,business,dashboard,forms}` stays part of verification.
  - Adding a theme is one entry in `THEMES` plus the backend enum; nothing else changes.
  - The mobile app does not render cards yet, so it carries no themes; when it does, the
    palettes are a plain object it can read as they are.

---

## FE-013 — Legal documents: the Russian body is server-only content, only the frame goes through i18n

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owner:** Frontend lead
- **Context:** bir-qr shipped four legal pages — privacy policy, terms, public offer,
  consent to personal-data processing — as Russian JSX. birlinq has three UI locales, and
  invariant 5 says every visible string goes through the translation layer with all three
  filled. Legal text is the one kind of copy that rule cannot cover: only a lawyer's
  translation binds, and a machine one is worse than none. There is also a mechanical
  problem: next-intl v4 ships every namespace to the client on every page, so some 18 KB
  of legal prose in a `legal` namespace would ride along with the landing, the scan page
  and the cabinet, three times over.
- **Decision:** The bodies live in
  `apps/web/src/content/legal/{privacy,terms,offer,consent}.ru.json` — `title`,
  `updated`, `sections[{ heading, paragraphs[] }]` — and are imported by the server
  component `components/legal/LegalPage.tsx` only. They are never in `packages/i18n` and
  never reach a client component. The i18n `legal` namespace carries the frame alone:
  `notice` ("the Russian version is the binding one"), `updated`, `docs.*` titles for
  navigation and metadata, `allDocs`, `backHome` — RU, KK and EN. On KK and EN the page
  renders the same Russian body under the translated frame, with `lang="ru"` on the title
  and the `<article>`, and the notice above it. Routes: `/privacy`, `/terms`, `/offer`,
  `/consent`; linked from the landing footer, the profile page and the register checkbox
  (`auth.register.terms` is a rich message with `<terms>` and `<privacy>` tags). In the
  port, the brand and domain became birlinq, the false claim of registration via Google
  OAuth was dropped, and the company name (ТОО), БИН, legal address, support email and
  public domain are left as `[уточняется]` — nineteen placeholders that are a **launch
  blocker** for the owner to fill, not for this repo to guess.
- **Rationale:** Content that has one binding language is content, not UI copy; keeping it
  out of the message bundle is what makes the rule "all three locales, every time"
  remain true for everything that is in the bundle. A server-only JSON import costs the
  client nothing and keeps the structure greppable — headings and paragraphs, not
  markup. `lang="ru"` is what screen readers and hyphenation need to treat a Russian body
  on a Kazakh page correctly.
- **Alternatives considered:** (a) Put the text in the namespace and copy RU into KK and
  EN — triples the payload and claims a translation that does not exist. (b) MDX — a new
  dependency for four documents that have no formatting beyond headings and paragraphs.
  (c) Serve the text from the backend — it has no CMS, and the documents are the site's,
  not the API's. (d) Keep them as JSX, as bir-qr did — no structure, and the hardcoded-copy
  grep in `CLAUDE.md` would have to learn an exception.
- **Consequences:**
  - `CLAUDE.md` gains an invariant: legal bodies stay out of the i18n packages.
  - `apps/web/src/content/` is a new kind of directory — server-only content. Nothing
    under it may be imported from a client component; the build would inline it.
  - A translated version later is a `*.kk.json` beside the Russian one and the `lang`
    attribute dropped for that locale; nothing else moves.
  - The `[уточняется]` placeholders are listed in the README's deploy notes; a release
    with them still in place is a release of a contract with blanks in it.

---

## FE-014 — Public card pages are fetched in the browser; generic metadata, `noindex`, no JSON-LD

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owner:** Frontend lead
- **Context:** bir-qr rendered `/p/{alias}` on the server, with the person's name in the
  OpenGraph tags and a `Person` JSON-LD block. Here the public payload comes from
  `GET /public/c/{alias}` (D-040/D-041), and that request is not free of side effects: it
  records a `view` de-duplicated per visitor for 60 s, skips known bots by user agent, and
  is throttled per IP under `public-page`. Fetched from the Next.js server, every view
  would arrive from one address and one user agent — the de-duplication would collapse
  visitors into one, the bot filter would be blind, and the single server origin would
  spend the whole per-IP allowance on itself. `/q/[code]` has fetched from the browser for
  exactly this reason since the first version. Decision H of the plan adds the other
  constraint: card pages are `noindex` by default — a privacy-first product does not hand
  phone numbers to crawlers.
- **Decision:** `/p/[alias]` and `/p/[alias]/qr` are server shells (`setRequestLocale`,
  `generateMetadata`) around client components — `PublicCardPage` and `CardQrPage` — that
  fetch through `publicApi.card(alias, locale)` on mount, over the same `PublicPage`
  orchestrator the sticker door uses. The metadata is static: an absolute title without
  the layout's "· birlinq" suffix so a shared link previews as a card and not as the app,
  a generic description, `robots: { index: false, follow: false }`, and no per-card image
  or name. No JSON-LD. `metadataBase` in the root layout comes from
  `NEXT_PUBLIC_APP_URL`. The backend has been asked for an **event-free meta endpoint**
  — name, photo and theme under the same privacy filter, no `view` recorded — so that
  link previews can become personal later; until it exists, `generateMetadata` has
  nothing it may fetch.
- **Rationale:** The page's data flow is dictated by what the backend counts, and it
  counts visitors. A server that fetches on their behalf is the one visitor. Generic
  metadata is the honest consequence: anything richer would require either a request the
  backend would count or data the server does not have. `noindex` costs nothing today —
  the cards are reached by link and by sticker, not by search — and keeps the product
  premise intact until an owner-level indexing switch exists.
- **Alternatives considered:** (a) Server fetch with the visitor's IP forwarded — the
  backend would have to trust a header from this app, and the throttle and the bot filter
  still see one origin and one user agent. (b) Server fetch with a "do not count" header —
  that is the event-free endpoint, in a less honest shape. (c) ISR or a cached page — a
  privacy toggle would show stale fields until revalidation, and the backend already
  caches the payload per entity with its own invalidation; a second layer needs a second
  invalidation. (d) Copy bir-qr's JSON-LD with whatever the client later renders — data
  injected after load is invisible to the crawlers it is meant for.
- **Consequences:**
  - Messenger previews show the card's generic title and description, not the person, until
    the meta endpoint exists; that is the accepted trade for now.
  - Card pages do not appear in search, by design; an indexing switch is a backend
    setting first (plan decision H), and `generateMetadata` follows it when it exists.
  - `app/[locale]/error.tsx` is the boundary a failed render lands in; a failed fetch is
    the page's own error state and never reaches it.
  - The `?theme=` override (FE-012) is client-only by nature of this flow.

---

## FE-015 — Permanent card address, hide instead of delete; consent, account avatar, referrer

- **Status:** Accepted
- **Date:** 2026-09-29 (review follow-ups 2026-09-30)
- **Owner:** Product owner, Frontend lead
- **Context:** Backend D-044 made a card's address permanent: the server assigns it and it
  is never changed, closed, released or reused, because it is printed on paper. An address
  drawn since D-044 is eight lower-case characters of the sticker alphabet with nothing of
  the person in it; the ones issued before — chosen or generated from a name under D-040,
  3–30 characters, `demo` among them — are grandfathered and stay exactly as they are,
  because the owner's requirement is that a link never changes. For the same reason a card
  is never deleted; `status: deactivated` is the "unpublished" mark. D-045 added three
  things the old product had: a consent flag on registration, an account avatar and the
  referrer of a page open. The cabinet built for D-040 offered the opposite on every count:
  an address field with validation and a "taken" flow, "open / close the link", "generate
  a new address", a danger zone that deleted the card, and a registration checkbox that
  never left the browser.
- **Decision:**
  - **The address is read-only everywhere.** `AliasSection` shows the link with copy and
    open and says it is permanent. `AliasInput`, the address field of the create form,
    `useCard.saveAlias` / `generateAlias`, `entitiesApi.generateAlias`, `ALIAS_RE`,
    `normalizeAlias`, `isReservedAlias`, `LIMITS.alias*` and `ErrorCode.AliasTaken` are
    removed; `CreateEntityRequest` and `UpdateEntityRequest` have no `alias` (the backend
    refuses the key with its `missing` rule — any presence, `null` included, is 422
    `details.alias`). `card.ts` keeps only `ALIAS_ALPHABET` and `ALIAS_LENGTH`, so the mock
    tree mints the same shape; nothing validates an alias or assumes its length, because a
    grandfathered one can be anything from 3 to 30 characters.
  - **A card with no address yet says so.** An old row the backend's backfill has not
    reached arrives with `alias: null`. `AliasSection` and `QrSection` then show one
    sentence, `cards.alias.pending` ("the address is being assigned — reload in a
    minute"), instead of `/p/…`, a dead copy button or a QR of nothing.
  - **A card is hidden, never deleted.** `DangerSection` and the list's delete button are
    gone. The list offers Hide / Show (`useCards.setPublished` — optimistic, rolled back on
    failure, `blocked` for the 409 of a moderated card) and the editor keeps its publish
    switch. `entitiesApi.remove` stays for cars and business entities; on a card the
    backend answers 409 `CARD_PERMANENT` whatever its status (`ErrorCode.CardPermanent`),
    which no screen reaches any more. Erasing a card's data is a staff moderation action
    on the backend (content wiped, address kept, card deactivated); owners hide the card
    or clear fields.
  - **Pausing a sticker bound to a card closes the sticker only.** The card's permanent
    link keeps working, so `QrDetailView` says so for a card (`dashboard.detail.pauseHintCard`)
    and points at the publish switch; hiding the card closes both doors.
  - **Consent is sent and linked.** `RegisterView` and the activation wizard's `AuthStep`
    refuse to submit without the checkbox and send `privacy_accepted: true`;
    `RegisterRequest` types the field as the literal `true`, so a call site cannot forget
    it (the backend accepts only JSON `true`). The checkbox text `auth.register.terms`
    gains a `<consent>` tag linking to `/consent` beside `<terms>` and `<privacy>`: the
    consent to the processing of personal data is given in the same tick, so it has to be
    readable from it. The privacy policy and the consent name what is now collected — the
    account photo, the moment of consent, visit statistics with the referring domain and
    a hashed visitor IP — and the privacy policy says a data-erasure request wipes the
    card's content while its address stays reserved. The email banner no longer promises
    that the email "can be deleted".
  - **Account avatar.** `useProfile.uploadAvatar` / `removeAvatar` over
    `authApi.uploadAvatar` / `removeAvatar`. `ImageUpload` takes `kind: "avatar"` — round,
    with its own copy under `dashboard.profile.avatar` — and reuses the client-side
    downscale; its `disabled` prop keeps it still while the account or password form is
    saving. The profile pill shows the avatar through `imageSrc`, which keeps it to the
    API origin.
  - **Profile writes take the returned user.** `PATCH /auth/me` and both avatar calls
    answer `{ user }`; `useProfile` hands it to the new `useAuth().applyUser`, which
    replaces the session user and its cached snapshot, instead of a second
    `GET /auth/me`. A ref guards concurrent writes on top of `busy`, as in
    `useCreateCard`.
  - **Referrer.** `publicApi.scan` and `card` take a third argument, `referrerHost`, sent
    as the query parameter `?ref=<host>`. `pendingReferrerHost()` in `lib/public-url.ts`
    computes it in the browser — the lower-cased hostname of `document.referrer`, nothing
    when there is no referrer, when it does not parse or when it is our own host — and
    `markReferrerSent()` retires it after the first successful public fetch of the
    document, so a client-side navigation or a language switch that refetches never
    counts the same arrival twice. `PublicPage` and `CardQrPage` take it before the fetch
    and mark it after. The server normalises the value again and drops its internal hosts;
    the statistics section lists `referrers_30d`.
  - **Deploy order for this release: frontend first, then backend.** The new frontend
    works against the old backend (no `alias` in any request; `?ref=` is ignored by a
    server that does not read it); the old frontend cannot register against the new
    backend, which requires `privacy_accepted`.
- **Rationale:** The cabinet must not offer what the server will refuse, and must not name
  an action by something it does not do. A "delete" that unpublishes would be a label that
  lies, and a disabled address field would be dead UI inviting a support question; a
  read-only link with a sentence of explanation is the whole truth. The standard `Referer`
  of an XHR is always our own page, so the real one has to be forwarded by the page. A
  query parameter carrying a hostname is the smallest thing that does it: a custom header
  made every referred visit pay a CORS preflight, and the full referrer URL — path and
  query of the visitor's previous page — reached the server and its error tracker although
  only the host is ever kept.
- **Alternatives considered:** (a) Keep "delete" and map it onto `status: deactivated` —
  rejected, above. (b) Keep `ALIAS_RE` and the reserved list for display-time checks —
  nothing types an address any more, and the grandfathered ones would fail an
  eight-character check. (c) Store the consent moment in `localStorage` — the server is
  the record, the browser is not. (d) Reuse the card photo as the account avatar — a
  person with two cards has two photos and one face. (e) Send the full referrer in a
  custom request header and let the server trim it — the first cut of this entry did; it
  cost a preflight per referred visit and sent the full URL out of the browser.
  (f) Send `?ref=` on every public fetch — a language switch refetches, and each would
  count as a new arrival from the same site.
- **Consequences:**
  - The mock tree follows: `drawAlias()`, 422 for an `alias` key in create or update, 409
    `CARD_PERMANENT` on removing a card, the register call validates the flag, the avatar
    is an object URL, `applyUser` on the mock session. The fixtures' new aliases are eight
    characters (`k7m2p9xq` hidden, `h3k9dn4y` blocked); `demo` stays, as the seeder's
    grandfathered one.
  - i18n, RU/KK/EN together: `cards.alias` keeps its link, copy, permanence and the new
    `pending` sentence and loses `label` (the section title is `cards.sections.alias`);
    `cards.danger`, `cards.list.delete*`, `cards.list.linkClosed`, `cards.create.alias*`
    and `cards.qr.noAlias*` are removed, and so are the keys no screen reads any more
    (`cards.create.created`, `cards.qr.download/copy/copied/share/stickerPaused`,
    `cards.stats.period30/period7`, `cards.errors.generic/blocked/rateLimited/load`,
    `common.delete/confirm`, `card.actions.copyLink`, `public.entity.contactTitle`,
    `public.card.scenarioBanner`); `cards.list.actions.hide/show`, `cards.list.publish*`,
    `cards.create.addressNote`, `cards.alias.pending`, `cards.stats.referrers/noReferrers`,
    `dashboard.detail.pauseHintCard` and `dashboard.profile.avatar.*` are added.
  - Copy that promised what no longer exists is corrected: the Pro plan's "custom link
    address" bullet, and its "statistics by channel" and "traffic sources" bullets, which
    every card already has; the pricing note that limits are not enforced; the card-limit
    text that suggested deleting a card; the "address may have changed" line of the
    card-not-found screen; the "turned publishing off temporarily" line of the hidden-page
    screen; and the "can be deleted" promise under the registration email.
  - With a card limit configured on the backend, hidden cards still count: a card cannot
    be removed to make room. Whether `deactivated` cards should stop counting is a product
    decision for the day billing exists.
  - `NEXT_PUBLIC_APP_URL` is now part of every printed address: the frontend domain has to
    be final before owners print, and a retired host must keep answering 301 to the new
    one (README deploy checklist).
  - FE-011 never recorded alias editing or card deletion: the D-040-era behaviour —
    choosing, closing and regenerating the address, deleting a card — was described only
    in `README.md`, `CONVENTIONS.md` and `docs/architecture/monorepo.md`, and this entry
    replaces it there. FE-011 itself stands as written.

---

## FE-016 — Partner co-branding is a token scope, not a second page tree

- **Status:** Accepted
- **Date:** 2026-09-05
- **Owner:** Frontend lead
- **Context:** Geely dealerships will sell birlinq cards under their own brand. Everything
  that belongs to such a card — the public scan page a stranger lands on, the owner's card
  editor in the cabinet — has to read as Geely, while the flow (scenarios, privacy, abuse,
  lead) stays birlinq's. The backend will mark these cards with a partner flag; at the time
  of writing the field is promised but not in `openapi.yaml`.
- **Decision:** A partner is a `data-partner="<code>"` attribute on a wrapper
  (`PartnerTheme`) whose subtree re-defines the design tokens
  (`[data-partner="geely"]` in `globals.css`, palette in `packages/tokens/theme.css`) —
  the same mechanism FE-012 uses for card themes, one level up. The same components
  render both brands; partner-specific chrome (lockup, "official card" strip, "powered by
  birlinq" footer, lead copy) branches on the partner code. The partner's wordmark is set
  as text in `PartnerMark` — the trademark artwork is the partner's to supply, not ours to
  redraw. The flag is read in exactly two functions, `publicPartner()` / `qrPartner()` in
  `packages/api/src/partner.ts`, which currently assume `meta.partner` on the public
  payload and `partner` on the QR resource.
- **Rationale:** Tailwind v4 emits `@theme` values as CSS variables and every `bg-accent`,
  `border-card-border`, `text-muted` utility resolves through them, so re-scoping the
  variables rebrands the whole subtree for the cost of one CSS block. A second component
  tree per partner is exactly the copy-paste drift the `/mock` rebuild (FE-001) was meant
  to end. Keeping the flag readers in one file means the day the backend publishes the
  real field name is a two-line change, not a hunt through components.
- **Alternatives considered:** (a) A light "geely.kz-style" surface — the public flow
  hardcodes `text-white`/`bg-white` in a dozen places and the shared `Button` primary is a
  white pill; a light partner theme is a foreground-token refactor of `components/ui`
  first, and is deferred until the partner's brand kit says a light surface is required.
  (b) Branching on a query parameter or a per-partner route — the brand is a property of
  the card, so it must come from the payload, or a visitor could dress any card as Geely.
  (c) Reading the flag straight from the entity in components — spreads the unconfirmed
  field name across the codebase.
- **Consequences:**
  - `PublicEntityPayload.meta.partner` and `QrCode.partner` are typed as `string | null`
    and narrowed through `isPartnerCode()`; an unknown code degrades to the plain page.
  - Adding a partner: one entry in `PARTNER_CODES`, one in `PARTNERS`, one CSS scope,
    three token values. No component changes.
  - The Geely palette uses the documented reference blues (Pantone 299 C `#0099ff` as
    accent, `#005bac` as the gradient's deep end) and the lockup mirrors the 2023
    identity's structure — gradient tile lighter top-left, squarish all-caps wordmark.
    The gradient's exact stops and the six-panel crest are not public; both come from
    the partner's brand kit and live in one place each (`theme.css`, `PartnerMark.tsx`).
    `geely.kz` itself could not be inspected from the build sandbox (egress allowlist).
  - The `/mock` tree previews the partner page at `/mock/q/GEELY001` and the partner card
    editor at `/mock/dashboard/qr/qr-2`.

---

## Decisions yet to be made

| ID | Question | Owner | Target |
|---|---|---|---|
| FE-003 | Does sticker activation live on the web, in the app, or both? Web-first is the working assumption — a physical sticker should not require an install to work — but the answer sets the priority of the activation flow in React Native | Product | Before mobile step 6 |
| FE-004 | Fate of the web cabinet once the native one exists. Under an app-first premise it may need no counterpart at all | Product | After mobile step 5 |
| FE-005 | `core.autocrlf` is enabled in this working copy while the project convention is LF. Decide the normalisation — `.gitattributes` versus per-machine config — before it produces a noisy diff | Frontend lead | Before step 2 |

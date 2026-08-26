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

## Decisions yet to be made

| ID | Question | Owner | Target |
|---|---|---|---|
| FE-003 | Does sticker activation live on the web, in the app, or both? Web-first is the working assumption — a physical sticker should not require an install to work — but the answer sets the priority of the activation flow in React Native | Product | Before mobile step 6 |
| FE-004 | Fate of the web cabinet once the native one exists. Under an app-first premise it may need no counterpart at all | Product | After mobile step 5 |
| FE-005 | `core.autocrlf` is enabled in this working copy while the project convention is LF. Decide the normalisation — `.gitattributes` versus per-machine config — before it produces a noisy diff | Frontend lead | Before step 2 |

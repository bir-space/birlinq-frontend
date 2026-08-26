# Frontend monorepo — structure and working model

Decisions this document implements: **D-034** (npm-workspaces monorepo) and **D-035**
(React Native / Expo for mobile, not Capacitor), in
`../birlinq-backend/docs/decision-log.md`. Read those first for *why*; this file is *what*
and *how*.

**Premise everything below follows from:** the mobile app is the primary product surface for
the owner. The website is a business card and the first touch — landing, guide, the public
scan page a stranger opens after scanning a sticker, and (for now) sticker activation.

---

## Layout

```
birlinq-frontend/
├─ apps/
│  ├─ web/                     Next.js 15, App Router, SSR
│  │  ├─ src/app/[locale]/     landing, guide, /q/[code], auth, activation
│  │  └─ src/platform/         web implementation of the Platform contract
│  └─ mobile/                  Expo + Expo Router + NativeWind
│     ├─ app/                  file-based routes: cabinet, QR, interactions, settings
│     └─ src/platform/         native implementation of the Platform contract
├─ packages/
│  ├─ api/                     fetch client, endpoints, types, ErrorCode
│  ├─ core/                    headless hooks + domain logic (no markup)
│  ├─ i18n/                    messages/{ru,kk,en}/*.json + namespace loader
│  ├─ tokens/                  colours, spacing, typography, radii
│  └─ platform/                the Platform contract — types + React context only
└─ package.json                workspaces: ["apps/*", "packages/*"]
```

The backend stays a separate repository. The contract between them is
`../birlinq-backend/docs/api/openapi.yaml`, unchanged by this restructuring.

## Package boundaries

These rules are the whole point of the split. A violation here is what turns a monorepo back
into two codebases.

| Package | May import | Must never import |
|---|---|---|
| `tokens` | nothing | anything |
| `api` | `tokens` (no), nothing | `react`, `next/*`, `react-native`, DOM globals |
| `i18n` | nothing | `next-intl` directly (apps bind their own adapter) |
| `platform` | `react` (types + context only) | any concrete implementation |
| `core` | `api`, `platform`, `i18n`, `react` | `next/*`, `react-native`, `react-dom`, DOM globals |
| `apps/web` | everything | `react-native` |
| `apps/mobile` | everything | `next/*`, `react-dom` |

`api` is already framework-agnostic — the frontend `CLAUDE.md` has required that from the
start ("Reuse for mobile"). This table promotes an informal convention into an enforceable
boundary; consider an ESLint `no-restricted-imports` rule per package once the layout lands.

Packages ship as **TypeScript source**, not built artefacts. `apps/web` lists them in
`transpilePackages`; Metro reads them directly. There is no per-package build or watch step —
that is deliberate, and it is the main thing that keeps a small monorepo pleasant to work in.

## The Platform contract

`packages/platform` is the seam that lets `core` run on both surfaces without knowing which
one it is on. It is a generalisation of the existing `src/lib/app-env.tsx`, which already
proved the pattern by making `/mock` render the same components as the real tree.

```ts
export interface Platform {
  api: AppApi;
  storage: SecureStorage;          // localStorage (web) | expo-secure-store (native)
  push: PushService | null;        // null on web until web-push is enabled
  scanner: BarcodeScanner | null;  // null on web → manual code entry fallback
  navigate(to: string): void;
  openExternal(url: string): void;
}
```

Three implementations, all equal citizens: web, native, and the `/mock` fixture tree. Adding a
fourth (an e2e harness, say) means writing one object, not touching feature code.

`SecureStorage` is **asynchronous** — Keychain and Keystore plugins have no synchronous API.
`tokenStore` today exposes synchronous getters that `use-auth.tsx` calls in render paths, so
the migration is: hydrate once at boot into memory, keep the synchronous getters, make writes
fire-and-forget. This is the single largest refactor in the whole move, and the only one that
touches auth. Invariant #3 from `CLAUDE.md` still holds — the access token stays in memory
only; it is the *refresh* token that moves from `localStorage` to Keychain/Keystore on native.

## What belongs in `packages/core`

Everything stateful that is not markup. This is where the reuse actually comes from, since
presentation is deliberately not shared.

- The activation wizard step machine (`entry → auth → vehicle → privacy → success`)
- Cursor pagination for the interactions and QR lists
- `ErrorCode` → translated-message mapping
- Form validation shapes
- Idempotency-key lifecycle around state-changing calls

A hook in `core` returns state and callbacks. It never returns JSX, never reads `window`, and
never imports from an app. `apps/web` and `apps/mobile` each render their own view over it.

## i18n

`next-intl` is a thin Next.js binding over `use-intl`. `apps/web` keeps `next-intl` with its
server rendering; `apps/mobile` uses `use-intl` directly — same hooks, same ICU message
format, same JSON files out of `packages/i18n`.

The existing invariants carry over unchanged: every visible string goes through the
translation layer, all three locales filled every time, and the UI locale `kk` still maps to
the backend's `kz` through `toApiLocale()`.

On native the locale is a stored preference rather than a URL prefix, so `apps/mobile` needs
no locale routing at all.

## Styling

`packages/tokens` holds the values; each app binds them to its engine — Tailwind v4 `@theme`
on web, NativeWind on native. Class syntax is the same on both sides, so the design language
survives the platform split even though components do not.

`CONVENTIONS.md` remains the design source of truth. Nothing in it changes except where the
token values physically live.

## Development

```bash
npm run dev -w apps/web        # http://localhost:3000
npm run dev -w apps/mobile     # Expo dev server
npm run typecheck              # all workspaces — the contract check
```

An edit in `packages/core` hot-reloads in both apps with no rebuild. An API contract change
breaks `npm run typecheck` in both apps simultaneously — that property is the return on the
whole restructuring, and it is not available across two repositories.

> **Metro gotcha.** React Native's bundler does not resolve workspace symlinks by default.
> `apps/mobile/metro.config.js` needs `watchFolders` pointing at the repo root and
> `nodeModulesPaths` listing both the app's and the root's `node_modules`. Expect to hit this
> on the first `apps/mobile` run; it is configuration, not a design problem.

## Release and update model

Three channels, and confusing them is how a hotfix ends up waiting a week for review.

| Change | Channel | Latency |
|---|---|---|
| Anything in `apps/web` | deploy | minutes |
| JS bundle: `core`, `i18n`, `tokens`, native screens | **EAS Update** (over the air) | minutes |
| Native shell: new module, permission, SDK bump, icon, version | store review | days |

Over-the-air updates are bounded by App Store guideline 2.5.2 — they may not change what the
app is for. Shipping a fixed dashboard query or a corrected translation is fine; shipping a
new product is not.

A store release cannot be rolled back, so the backend exposes `min_app_version` and the app
shows a blocking update screen below it. `device_tokens.app_version` (see D-035) is what makes
the installed-version distribution visible before deciding to raise that floor.

## Migration

Six steps. Each leaves the repository green — there is no big-bang commit.

| # | Step | Done when |
|---|---|---|
| 1 | npm workspaces; `src/` → `apps/web/src` | site behaves exactly as before; `typecheck` + `build` clean |
| 2 | extract `packages/{api,i18n,tokens}` | `apps/web` imports them; no behavioural change |
| 3 | `packages/platform`; `app-env.tsx` grows into it; `/mock` becomes an implementation | `/mock` still renders the real components |
| 4 | `apps/mobile` scaffold: Expo, Expo Router, NativeWind, JWT via `expo-secure-store` | login works on a device |
| 5 | cabinet in React Native, pulling `packages/core` out of web components as it goes | interactions and QR lists usable on a device |
| 6 | push: backend `device_tokens` + dispatcher, `expo-notifications` in the app | a scenario submission reaches a phone |

Steps 1–3 are mechanical and low-risk. Step 3 is where care is needed — it is the one that
touches auth. Steps 4–6 hold no structural surprises, because every boundary is drawn by then.

The backend half of step 6 (`device_tokens`, `NotificationChannel::Push`, the dispatcher with
email fallback, CORS) is independent of steps 1–5 and can run in parallel from day one.

## Open questions

- **D-036** — push as the primary channel, narrowing D-001. Needs the payload rules written
  down: identifiers only, no contact data travelling through APNs/FCM, since a push body is
  visible on a lock screen.
- **D-037** — does activation live on the web, in the app, or both? Web-first is the
  recommendation (a physical sticker should not require an install to work), but it is a
  product call and it sets the priority of step 6.
- The long-term fate of the web cabinet. Under an app-first premise it may not need a
  counterpart at all; deferred until the native cabinet exists and the usage split is visible.

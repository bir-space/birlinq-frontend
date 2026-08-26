# Monorepo — structure and working model

Decisions this implements: **FE-001** (npm-workspaces monorepo) and **FE-002** (React Native
/ Expo for mobile, not Capacitor) in `../decision-log.md`. Read those for *why*; this file is
*what* and *how*.

**Premise everything below follows from:** the mobile app is the primary product surface for
the owner. The website is a business card and the first touch — landing, guide, the public
scan page a stranger opens after scanning a sticker, and (for now) sticker activation.

**Current state:** steps 1–2 are done — the Next.js app lives in `apps/web`, and `api`,
`i18n` and `tokens` are extracted packages it consumes. Everything below describes the
target; the migration table at the end says how far along it is.

---

## Layout

```
birlinq-frontend/
├─ apps/
│  ├─ web/                     Next.js 15, App Router, SSR          ← exists
│  │  ├─ src/app/[locale]/     landing, guide, /q/[code], auth, activation
│  │  └─ src/platform/         web implementation of the Platform contract
│  └─ mobile/                  Expo + Expo Router + NativeWind      ← step 4
│     ├─ app/                  file-based routes: cabinet, QR, interactions, settings
│     └─ src/platform/         native implementation of the Platform contract
├─ packages/
│  ├─ api/                     fetch client, endpoints, types, ErrorCode   ← exists
│  ├─ i18n/                    messages/{ru,kk,en}/*.json + loader         ← exists
│  ├─ tokens/                  colours, spacing, typography, radii         ← exists
│  ├─ core/                    headless hooks + domain logic (no markup)   ← step 5
│  └─ platform/                the Platform contract — types + context     ← step 3
└─ package.json                workspaces: ["apps/*", "packages/*"]
```

The backend is a separate repository. The contract between them is its OpenAPI spec, and this
restructuring does not touch it.

## Package boundaries

These rules are the whole point of the split. A violation here is what turns a monorepo back
into two codebases.

| Package | May import | Must never import |
|---|---|---|
| `tokens` | nothing | anything |
| `api` | nothing | `react`, `next/*`, `react-native`, DOM globals |
| `i18n` | nothing | `next-intl` directly (apps bind their own adapter) |
| `platform` | `react` (types + context only) | any concrete implementation |
| `core` | `api`, `platform`, `i18n`, `react` | `next/*`, `react-native`, `react-dom`, DOM globals |
| `apps/web` | everything | `react-native` |
| `apps/mobile` | everything | `next/*`, `react-dom` |

`api` was almost framework-agnostic already — `CLAUDE.md` has required that from the start
under "Reuse for mobile" — but it had two ties to the web that had to be cut when it moved
out, because both are answers only one app can give:

```ts
// apps/web/src/lib/api-config.ts, imported for its side effect from app-env.tsx
configureApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  tokenStore,
});
```

`NEXT_PUBLIC_API_URL` means nothing under Metro, and `localStorage` means nothing on a
phone. So `packages/api` declares a `TokenStore` interface and takes both from its host at
boot instead of reaching for them. `apps/mobile` will call the same function with
`EXPO_PUBLIC_API_URL` and a Keychain-backed store, and nothing inside the package changes.
This is the same inversion the Platform contract generalises in step 3.

The table promotes an informal convention into an enforceable boundary; consider a
per-package ESLint `no-restricted-imports` rule once ESLint is set up in this repo at all —
`next lint` is currently unconfigured, so nothing enforces this yet.

`packages/tokens` is CSS-only today: the `@theme` block that used to sit in `globals.css`,
imported back by it. That is enough for Tailwind on the web and nothing more. When NativeWind
arrives in step 4 the values need a TypeScript source both engines can read, so expect this
package to gain one and the CSS to be generated from it.

Packages ship as **TypeScript source**, not built artefacts. `apps/web` lists them in
`transpilePackages`; Metro reads them directly. There is no per-package build or watch step —
that is deliberate, and it is the main thing that keeps a small monorepo pleasant to work in.

## The Platform contract

`packages/platform` is the seam that lets `core` run on both surfaces without knowing which
one it is on. It generalises the existing `apps/web/src/lib/app-env.tsx`, which already proved
the pattern by making `/mock` render the same components as the real tree.

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
fourth — an e2e harness, say — means writing one object, not touching feature code.

`SecureStorage` is **asynchronous**: Keychain and Keystore plugins have no synchronous API.
`tokenStore` today exposes synchronous getters that `use-auth.tsx` calls in render paths, so
the migration is: hydrate once at boot into memory, keep the synchronous getters, make writes
fire-and-forget. This is the largest single refactor in the whole move and the only one that
touches auth. Invariant #3 in `CLAUDE.md` still holds — the access token stays in memory only;
it is the *refresh* token that moves from `localStorage` to Keychain/Keystore on native.

## What belongs in `packages/core`

Everything stateful that is not markup. This is where the reuse actually comes from, since
presentation is deliberately not shared.

- The activation wizard step machine (`entry → auth → vehicle → privacy → success`)
- Cursor pagination for the interactions and QR lists
- `ErrorCode` → translated-message mapping
- Form validation shapes, including plate normalisation
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
survives the platform split even though the components do not.

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

A store release cannot be rolled back, so the app needs a version floor from the backend and a
blocking update screen below it. That floor, and the device-token table that makes the
installed-version distribution visible, are backend work that has not been decided yet — see
the backend dependency noted in FE-002.

## Migration

Six steps. Each leaves the repository green — there is no big-bang commit.

| # | Step | Done when | State |
|---|---|---|---|
| 1 | npm workspaces; `src/` → `apps/web/src` | site behaves as before; `typecheck` + `build` clean | **done** |
| 2 | extract `packages/{api,i18n,tokens}` | `apps/web` imports them; no behavioural change | **done** |
| 3 | `packages/platform`; `app-env.tsx` grows into it; `/mock` becomes an implementation | `/mock` still renders the real components | next |
| 4 | `apps/mobile` scaffold: Expo, Expo Router, NativeWind, JWT via `expo-secure-store` | login works on a device | |
| 5 | cabinet in React Native, pulling `packages/core` out of web components as it goes | interactions and QR lists usable on a device | |
| 6 | push: `expo-notifications` in the app, against the backend channel | a scenario submission reaches a phone | blocked on backend |

Steps 1–3 are mechanical and low-risk. Step 3 is where care is needed — it is the one that
touches auth. Steps 4–5 hold no structural surprises, because every boundary is drawn by then.
Step 6 cannot start until the backend has a push channel; that is their decision to make and
it has not been made.

## Open questions

Tracked in `../decision-log.md` under "Decisions yet to be made": where activation lives
(FE-003), the fate of the web cabinet (FE-004), and line-ending normalisation (FE-005).

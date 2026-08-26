# Monorepo — structure and working model

Decisions this implements: **FE-001** (npm-workspaces monorepo) and **FE-002** (React Native
/ Expo for mobile, not Capacitor) in `../decision-log.md`. Read those for *why*; this file is
*what* and *how*.

**Premise everything below follows from:** the mobile app is the primary product surface for
the owner. The website is a business card and the first touch — landing, guide, the public
scan page a stranger opens after scanning a sticker, and (for now) sticker activation.

**Current state:** steps 1–4 are done — `apps/web` and `apps/mobile` both exist and consume
the extracted `api`, `i18n`, `tokens` and `platform` packages. Everything below describes the
target; the migration table at the end says how far along it is.

---

## Layout

```
birlinq-frontend/
├─ apps/
│  ├─ web/                     Next.js 15, App Router, SSR          ← exists
│  │  ├─ src/app/[locale]/     landing, guide, /q/[code], auth, activation
│  │  └─ src/lib/platform.tsx  web implementation of the Platform contract
│  └─ mobile/                  Expo + Expo Router + NativeWind      ← exists
│     ├─ app/                  file-based routes; sign-in and a cabinet stub
│     └─ src/                  platform.tsx, api-config.ts, token-store.ts
├─ packages/
│  ├─ api/                     fetch client, endpoints, types, ErrorCode   ← exists
│  ├─ i18n/                    messages/{ru,kk,en}/*.json + loader         ← exists
│  ├─ tokens/                  colours, spacing, typography, radii         ← exists
│  ├─ platform/                the Platform contract — types + context     ← exists
│  └─ core/                    headless hooks + domain logic (no markup)   ← step 5
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
| `platform` | `react`, `api` (types only) | any concrete implementation |
| `core` | `api`, `platform`, `i18n`, `react` | `next/*`, `react-native`, `react-dom`, DOM globals |
| `apps/web` | everything | `react-native` |
| `apps/mobile` | everything | `next/*`, `react-dom` |

`api` was almost framework-agnostic already — `CLAUDE.md` has required that from the start
under "Reuse for mobile" — but it had two ties to the web that had to be cut when it moved
out, because both are answers only one app can give:

```ts
// apps/web/src/lib/api-config.ts, imported for its side effect from platform.tsx
configureApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  tokenStore,
});
```

`NEXT_PUBLIC_API_URL` means nothing under Metro, and `localStorage` means nothing on a
phone. So `packages/api` declares a `TokenStore` interface and takes both from its host at
boot instead of reaching for them. `apps/mobile` will call the same function with
`EXPO_PUBLIC_API_URL` and a Keychain-backed store, and nothing inside the package changes.
The Platform contract below applies the same inversion to the rest of the environment.

The table promotes an informal convention into an enforceable boundary; consider a
per-package ESLint `no-restricted-imports` rule once ESLint is set up in this repo at all —
`next lint` is currently unconfigured, so nothing enforces this yet.

`packages/tokens` serves two Tailwind majors from one file. The web is on v4, where the theme
is CSS, so it imports `theme.css` directly. NativeWind 4 is Tailwind v3, where the theme is a
JS object, so `tokens.js` parses the same `theme.css` — resolving `var()` references as it
goes — into the v3 shape for `apps/mobile/tailwind.config.js`. The CSS stays authoritative,
nothing is generated, and `CONVENTIONS.md` remains true: a designer edits one file.

Packages ship as **TypeScript source**, not built artefacts. `apps/web` lists them in
`transpilePackages`; Metro reads them directly. There is no per-package build or watch step —
that is deliberate, and it is the main thing that keeps a small monorepo pleasant to work in.

## The Platform contract

`packages/platform` is the seam that lets a feature component run on either surface without
knowing which one it is on. It is the old `apps/web/src/lib/app-env.tsx` moved out and made
strict — that file already proved the pattern by making `/mock` render the same components as
the real tree.

```ts
export interface Platform {
  api: AppApi;      // real endpoints | /mock fixtures | a test double
  basePath: string; // "" normally, "/mock" under the preview tree
  isMock: boolean;
}
```

Three implementations, all equal citizens: web (`apps/web/src/lib/platform.tsx`), the `/mock`
fixture tree, and native once it exists. Adding a fourth — an e2e harness, say — means writing
one object, not touching feature code.

`usePlatform()` **throws** when no provider is above it, rather than falling back to a default.
The web tree is wrapped explicitly in `[locale]/layout.tsx`, so a tree that forgot its provider
fails loudly instead of silently getting the web implementation. Client components execute
during static generation, so this is caught at build time for every prerendered route.

**Fields are added when they have a consumer.** Push, the barcode scanner and navigation
belong in this interface and will land with the app that needs them. Declaring them now would
mean three `null`s nobody reads and a shape guessed before the requirement is known.

The session store is deliberately **not** in here, and that is a structural fact rather than an
omission: `@birlinq/api` is bound to it by `configureApi()` at module load, which happens before
any React context exists. Routing storage through a provider would be a lie about when it is
available.

Which leaves storage, now solved without either app changing shape. Keychain and Keystore have
no synchronous API, while `TokenStore` is synchronous on purpose — making it async would push a
promise into every render path that reads a token. So the native store reads its persisted half
once in `hydrate()`, which `app/_layout.tsx` awaits before mounting the tree, keeps the values
in memory afterwards, and writes back fire-and-forget. A failed write costs the session on next
launch, never a crash mid-flight. The web store is untouched.

Invariant #3 in `CLAUDE.md` holds on both: the access token stays in memory only; it is the
*refresh* token whose home differs — `localStorage` on the web, Keychain/Keystore on device.

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
npm start -w apps/mobile       # Expo dev server; press a / i for a device
npm run typecheck              # all workspaces — the contract check

cd apps/mobile
npx expo-doctor                # dependency and config health — 21 checks
npm run bundle:check           # Metro bundle without a device, catches resolution breaks
```

An edit in `packages/core` hot-reloads in both apps with no rebuild. An API contract change
breaks `npm run typecheck` in both apps simultaneously — that property is the return on the
whole restructuring, and it is not available across two repositories.

> **The gotcha is not Metro.** The widely-copied monorepo recipe — `watchFolders`,
> `nodeModulesPaths`, `disableHierarchicalLookup` — is obsolete: `expo/metro-config`
> understands workspaces on its own, and `expo-doctor` flags the manual overrides. What does
> bite is duplicate copies of React and the native modules, because Expo pins exact versions
> while its transitive tree asks for loose ones. That is why the root manifest pins them; see
> **FE-006**, which also records how to make npm actually re-resolve after a pin changes.
>
> Run `npx expo-doctor` from `apps/mobile` before any mobile release — it is the check that
> catches this class of problem.

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
| 3 | `packages/platform`; `app-env.tsx` grows into it; `/mock` becomes an implementation | `/mock` still renders the real components | **done** |
| 4 | `apps/mobile` scaffold: Expo, Expo Router, NativeWind, JWT via `expo-secure-store` | login works on a device | **built, unverified on device** |
| 5 | cabinet in React Native, pulling `packages/core` out of web components as it goes | interactions and QR lists usable on a device | next |
| 6 | push: `expo-notifications` in the app, against the backend channel | a scenario submission reaches a phone | blocked on backend |

Steps 1–3 were mechanical and are verified by build. Step 4 is built and bundles — `expo export`
produces an Android bundle carrying the shared messages, the design tokens and the Keychain
key — but *bundling is not running*. Sign-in against a live backend, Keychain persistence
across a cold start and refresh-on-401 have not been exercised on hardware, and that is the
gate for calling step 4 done. Step 5 holds no structural surprises, because every boundary is
drawn by then.
Step 6 cannot start until the backend has a push channel; that is their decision to make and
it has not been made.

## Open questions

Tracked in `../decision-log.md` under "Decisions yet to be made": where activation lives
(FE-003), the fate of the web cabinet (FE-004), and line-ending normalisation (FE-005).

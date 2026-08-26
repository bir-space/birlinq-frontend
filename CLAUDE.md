# birlinq Frontend — Claude Code Instructions

## Project Identity

Web frontend for **birlinq** (BirSpace group) — a scenario-based QR platform. A stranger
scans a QR sticker on a car/item/business card and reaches the owner through a scenario
flow, without ever seeing a phone number. This repo is the **consumer** of the Laravel
backend's REST API — it owns no business logic, no database, no auth server. The backend
team's contract is the source of truth: `../birlinq-backend/docs/api/openapi.yaml`.

Built to be **shared with the coming mobile app** (FE-002): the API layer, translations and
design tokens live in `packages/` and are framework-agnostic on purpose — see "The api
package must stay platform-free" below.

**Design source of truth:** Figma file `TjSplk2LZx1iH8hv7WK1y2` ("birlinq"). Brand mark is
final (the "bq" monogram) — see `CONVENTIONS.md` for the full token/logo spec before
touching anything visual.

## Stack (NON-NEGOTIABLE)

- **Next.js 15**, App Router, `apps/web/src/`, TypeScript **strict**
- **Tailwind CSS v4** (`@theme` tokens in `packages/tokens/theme.css`, `@utility` for custom classes — NOT a `tailwind.config.js`)
- **next-intl v3** — RU (default, no URL prefix) / KK / EN
- **No new runtime dependencies without asking first.** No CSS-in-JS libraries, no icon
  packs (icons are inline SVG), no state managers (React state + the two contexts we have
  is enough at this size), no CDNs, no image hotlinking (including Figma asset URLs — they
  expire and are not for production use).
- Package manager: **npm** (there's a `package-lock.json`; don't switch to pnpm/yarn)

## Operating Environment

- **OS:** Windows 11, project lives at `E:\Work\Projects\bir-space\birlinq-frontend`
- Backend runs separately (`php artisan serve`, local OpenServer/Laragon) at
  `http://localhost:8000/api/v1` — set via `NEXT_PUBLIC_API_URL` in `apps/web/.env.local`
  (copy from `apps/web/.env.example`; never commit it)
- Dev: `npm run dev` → `http://localhost:3000`. Verify with `npm run typecheck` and
  `npm run build` before calling anything done — both must be clean.
- If you're an agent running in a cloud sandbox without network access to
  `registry.npmjs.org`: you cannot run `npm install` there. Do the file work, then hand off
  the actual `npm install`/`npm run build` verification to the user's machine — don't claim
  a build is verified if you couldn't run it.

## Architecture

The repo is an npm-workspaces monorepo (FE-001). Run everything from the root — `npm run dev`,
`npm run typecheck` and `npm run build` delegate to the workspace. Full layout, package
boundaries and migration state: `docs/architecture/monorepo.md`.

```
packages/                  # shared by every client; no Next.js, no DOM
├── api/src/               # types.ts (hand-written from openapi.yaml), client.ts (fetch
│                          # wrapper: JWT refresh-on-401, Idempotency-Key), endpoints.ts,
│                          # limits.ts, config.ts (configureApi — see below)
├── i18n/                  # messages/{ru,kk,en}/*.json, locales, NAMESPACES, loadMessages
└── tokens/theme.css       # Tailwind @theme block — the design tokens

apps/web/src/
├── app/[locale]/          # App Router pages, one per route; locale-aware via next-intl
│   └── layout.tsx         # <html>/<body>, NextIntlClientProvider, AuthProvider
├── components/
│   ├── ui/                # Shared design system — Button, Card, Input, Badge, Logo,
│   │                      # LogoMark, Spinner, LangSwitcher. Changes here cascade
│   │                      # everywhere; treat as a mini design-system package.
│   └── {landing,public,auth,activation,dashboard}/   # feature-scoped, own their section only
├── lib/
│   ├── api-config.ts      # configureApi({ baseUrl, tokenStore }) — the web binding
│   ├── app-env.tsx        # AppEnvProvider: which API impl + link prefix (real vs /mock)
│   └── auth/              # token-store.ts (access in memory, refresh in localStorage),
│                          # use-auth.tsx (AuthProvider/useAuth)
├── i18n/                  # routing.ts (next-intl binding), request.ts, navigation.ts
```

### Data flow
`page.tsx` (server component, reads `params.locale`, calls `setRequestLocale`) → feature
components (client components where interactive) → `@birlinq/api` `endpoints` → `apiFetch`
(auth header + refresh + idempotency) → backend.

### The api package must stay platform-free
`packages/api` never reads `process.env` or touches storage. Both arrive through
`configureApi({ baseUrl, tokenStore })`, which `apps/web/src/lib/api-config.ts` calls once at
boot; the mobile app will call the same function with its own values. So: don't import
`next/*`, `react-native`, or DOM globals into `packages/`, and don't reach for
`NEXT_PUBLIC_*` there — add a config field instead.

## Critical Invariants (NEVER violate)

1. **Cursor pagination only**, matching the backend. Never build offset/page-number UI.
2. **`Idempotency-Key` header required** on every state-changing call: `qr/activate`,
   `qr/{id}/pause`, `qr/{id}/resume`, scenario submit, interaction resolve. Already wired in
   `endpoints.ts` via `newIdempotencyKey()` — use those functions, don't hand-roll `fetch`.
3. **JWT handling**: access token lives in memory only (never localStorage/cookies), refresh
   token in localStorage, single-flight refresh-and-retry on 401. Don't "simplify" this by
   storing the access token — it's the one thing the backend's threat model cares about.
4. **Locale mapping**: URL/UI locale is ISO `kk`; the backend expects `kz`. Always go through
   `toApiLocale()` — never send the UI locale string straight to the API.
5. **No hardcoded UI strings.** Every visible string goes through `next-intl` (`useTranslations`/
   `getTranslations`), with RU + KK + EN all filled — never ship a namespace with only RU.
   Brand/product names (birlinq, Move, Business, ID, partner names) are the one exception —
   they're never translated.
6. **Brand color ≠ status color.** `accent` (brand blue) is for interactive/highlight UI.
   `success`/`warn`/`danger` are status semantics (activated, resolved, error) and must stay
   independently adjustable. Don't reuse one for the other just because the hex is close.
7. **PrivacyFilter is a backend concept, not a frontend one** — never render a field the
   public payload didn't send, and never add a client-side toggle that fakes hiding a field
   the API already sent. If something needs hiding, it needs a backend privacy setting.

## Design System — read `CONVENTIONS.md` before touching anything visual

Short version: dark, near-black premium surfaces; the "bq" logo mark (`LogoMark.tsx`) is the
one gradient signature — use it and `text-brand-gradient`/`bg-brand-gradient` sparingly, not
on every button. Vertical sub-brand colors (`move`/`id`/`biz`) are landing-page-only, never
in the dashboard/auth/public product UI. Full token list, component API, and Figma workflow
notes live in `CONVENTIONS.md` — that file is the working reference; this file is the rules.

## Working Approach

### Before building any new page/section:
1. Read `CONVENTIONS.md` in full — tokens, component props, i18n pattern, API layer.
2. Check `../birlinq-backend/docs/api/openapi.yaml` for the actual contract (request/response
   shape, error codes) — don't guess a field name.
3. Check whether a Figma frame exists for it (`mcp__Figma__get_design_context` /
   `get_screenshot`) before inventing a layout. Note: the Figma MCP tool call quota is shared
   and low (Starter plan) — batch reads, don't re-fetch the same frame repeatedly, and if
   rate-limited, ask the user for a screenshot/export instead of retrying.
4. If backend behavior is unclear or missing from the OpenAPI spec, say so — don't invent
   an endpoint or field shape and hope it matches.

### Per-task discipline
- Use the task list (`TaskCreate`/`TaskUpdate` in Cowork, `TodoWrite` in Claude Code) for
  anything with more than 2–3 distinct steps.
- After any non-trivial change: `npm run typecheck`, then re-check that translation keys you
  added exist in all three locale files (mismatched key sets are the most common self-inflicted
  bug in this repo — check by diffing key sets, not by eyeballing).
- Show what changed before large rewrites; prefer editing existing components over
  duplicating them with a new name.

## Anti-Patterns I Will Reject

- Hardcoded copy in JSX (must go through `next-intl`)
- Inline hex colors that duplicate an existing token (`#2e63e0` instead of `bg-accent`/`text-move`/etc.)
- A new npm dependency added without asking first
- Hotlinked Figma asset URLs (`figma.com/api/mcp/asset/...`) left in committed code — they expire
- Re-implementing `fetch` calls instead of using the endpoints from `@birlinq/api`
- Storing the JWT access token in `localStorage` or a cookie
- Offset-based pagination UI (`?page=2`) — the API is cursor-only
- Adding a translation key to `ru` only "for now" — all three locales, every time
- Transcribing a Figma frame as absolute-positioned pixel `<div>`s — rebuild with flex/grid,
  mobile-first, responsive
- Editing anything under `../birlinq-backend/` from this repo's context
- Silent scope creep on design changes — if a request implies a big theme change (like the
  bq rebrand), say what's changing and why before repainting two dozen files

## Files I MUST NOT Touch Without Explicit Permission

- Anything under `../birlinq-backend/` (separate repo, separate team boundary — same rule
  the backend's own `CLAUDE.md` states in reverse)
- `apps/web/.env.local` (only edit `apps/web/.env.example`)
- `apps/web/src/components/ui/*` component **APIs** (props) without checking call sites first — these
  are shared across every feature area; a prop rename cascades everywhere
- `node_modules/`, `.next/`, `package-lock.json` (regenerate via npm, don't hand-edit)

## Output Preferences

- Direct, no fluff — same as the backend repo's convention.
- Russian is fine for discussion; **code, comments, identifiers — English only** (matches
  backend convention, keeps the codebase consistent for anyone touching both repos).
- Show file paths with backslashes when talking about the Windows filesystem location,
  forward slashes in code/imports.
- Use the task list for any multi-step work; update it as you go, not all at once at the end.

## Quick References

| File | Purpose |
|---|---|
| `CONVENTIONS.md` | Design tokens, logo/brand usage, component API, i18n pattern, Figma workflow — read before any UI work |
| `README.md` | What's built, routes ↔ backend endpoints table, setup |
| `docs/decision-log.md` | **This repo's own decisions** (`FE-NNN`, append-only) — structure, client stack, platform choices. Frontend decisions go here, not in the backend's log |
| `docs/architecture/monorepo.md` | Monorepo layout (web + Expo app over shared packages), package boundaries, release model, migration state (FE-001, FE-002) |
| `../birlinq-backend/docs/api/openapi.yaml` | API contract (read-only from here) |
| `../birlinq-backend/docs/decision-log.md` | Backend's own log (`D-NNN`) — read for context, never write to it. Anything binding both sides (contract, notification channels, privacy) is theirs to decide |
| `../birlinq-backend/docs/architecture/overview.md` | System-level architecture (auth flow, scenario engine) |
| `packages/api/src/types.ts` | Hand-written API types — keep in sync with the OpenAPI spec |
| `apps/web/.env.example` | All frontend env vars documented |
| `CLAUDE.md` | This file — read first every session |

## Session Start Checklist

1. Read this file (`CLAUDE.md`)
2. Read `docs/decision-log.md` — check whether the question was already decided, and what is
   still open
3. Read `CONVENTIONS.md` if the task touches anything visual
4. Skim `../birlinq-backend/docs/api/openapi.yaml` if the task touches API calls
5. Confirm scope before a broad restyle or refactor — narrate the plan, then execute

### Deciding something new

If a task needs an architectural decision this repo owns, append an `FE-NNN` entry to
`docs/decision-log.md` **before** implementing it, and get it approved. Never edit a
historical entry — supersede it. If the decision binds the backend too, it is theirs: raise
it with the backend lead rather than writing it down here as settled.

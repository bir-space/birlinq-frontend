# birlinq-frontend — conventions (read before writing any page)

## Stack
Next.js 15 (App Router, `apps/web/src/`), TypeScript strict, Tailwind CSS v4, next-intl v4.
**No new dependencies — the one approved exception is `qrcode` in `apps/web` (FE-010). No external assets/CDNs. Icons = inline SVG. Font = Inter via next/font (already wired).**

## Design tokens (`packages/tokens/theme.css`, @theme)
Brand — aligned to the final "bq" logo (b=10 blue, q=01 violet signal handshake):
`--color-brand-blue` #2e63e0, `--color-brand-violet` #8b5cf6, `--color-brand-ice` #eef1fc
(gradient midpoint). `bg-accent`/`text-accent`/`border-accent` = brand-blue, used for all
interactive/highlight elements (buttons, focus, active nav, links). For the full two-tone
treatment use `text-brand-gradient` (gradient text) or `bg-brand-gradient` (gradient fill) —
reserve these for hero/marketing signature moments, not routine UI chrome. `bg-brand-glow`
adds a restrained radial ambient wash behind hero/auth surfaces.
Logo: `<Logo size="sm"|"md"|"lg" markOnly? />` from `@/components/ui/Logo` (icon + wordmark);
`<LogoMark size={n} />` from `@/components/ui/LogoMark` for icon-only contexts. Never rebuild
the mark ad hoc — always use these two components (or `Wordmark` from `landing/decor.tsx` for
small in-app-screen mockups only, not for large hero display — see below).

Vertical sub-brand colors (marketing/landing only): `move` (blue, alias of brand-blue),
`id` (violet, alias of brand-violet), `biz` (green #22c55e, birlinq Business). Use as
`bg-move/10`, `text-move`, `border-move/30` etc. Do NOT use these for dashboard/auth/public
product UI — those stay on the neutral `accent` (blue) + `success`/`warn`/`danger` semantics.

Card themes (FE-012) are the one scoped exception to that rule. A business card wears one of
ten palettes from `apps/web/src/components/card/themes.ts`; `themeStyle(theme)` sets them as
`--card-*` custom properties on the card's `<article>` only, and everything under
`components/card` reads `bg-(--card-surface)`, `text-(--card-text)`, `border-(--card-border)`
and friends without knowing which theme is on. `default` references the tokens above; the
other nine are literal hex, and that file is the only place literal hex is allowed in product
UI. Nothing outside the article — public header, abuse link, cabinet — takes a theme, and the
vertical colours stay out of it. The QR code is always dark on white, whatever the theme.

Semantic (status only, distinct from brand): `--color-success` #22c55e (verified/resolved/done),
`--color-warn` #f59e0b, `--color-danger` #ef4444. There is no more brand-red token — the old
red dot is retired; any "attention/unresolved" indicator uses `bg-danger`, not a brand color.

Surfaces: `bg-ink` #06070b (app bg, near-black), `bg-ink-soft` #0a0c13,
`bg-card` #10131c + `border-card-border` #232838, `border-line` #2b3143,
`bg-paper` #f8fafc + `border-paper-border` #d6dee9, `border-paper-border-soft` #e5e7eb,
`border-chip-border` #c7d0df, `text-ink-900` #111827 (dark text on light),
`text-muted` #a7b0c2, `text-muted-2` #767f92.
Radii: `rounded-(--radius-btn)` 16px, `rounded-(--radius-card)` 20px, `rounded-(--radius-panel)` 24px.
Dark theme is default (body = bg-ink, white text). Light sections: class `light-surface`.
Voice: premium, simple, secure — restrained gradients (never neon/loud), generous whitespace,
one signature gradient moment per section at most.

## Shared UI (import from `@/components/ui/...`) — do NOT modify these files
- `Button` — variants: primary (white pill), secondary (dark card pill), accent, ghost, danger; sizes sm/md(50px)/lg; `loading` prop.
- `Card` — tone "dark" (default) | "light".
- `Input`, `Textarea` — label/error/hint props, dark styled.
- `Select` — native `<select>` in the same field skin; label/error/hint props, `<option>`s as children.
- `ConfirmModal` — "are you sure?" sheet (bottom sheet on phones, dialog from `sm`); every label is a prop (`title`, `text`, `confirmLabel`, `cancelLabel`), `danger` for a red confirm, `loading`/`error` inline.
- `Logo` — birlinq wordmark with red dot; props size, href.
- `Badge` — tone accent/muted/warn/danger/info.
- `Spinner`, `PageSpinner`.
- `LangSwitcher` — locale pills.

## i18n (next-intl)
- Locales: `ru` (default, no URL prefix), `kk`, `en`. All UI strings MUST come from messages — no hardcoded text. Fill ALL THREE locale files for your namespace.
- Messages live in `packages/i18n/messages/{locale}/{namespace}.json`. Own ONLY your namespace file.
- Server component page: `const { locale } = await params; setRequestLocale(locale);` then `useTranslations("ns")` (sync components) or `await getTranslations("ns")`.
- Client components: `useTranslations("ns")` from `"next-intl"`.
- Navigation ONLY via `@/i18n/navigation`: `import { Link, useRouter, usePathname, redirect } from "@/i18n/navigation";`
- Backend locale code for API calls: use `toApiLocale(locale)` from endpoints (maps kk→kz).
- Legal documents are content, not UI copy (FE-013): the bodies live in `apps/web/src/content/legal/*.ru.json` and are imported by the server component `components/legal/LegalPage.tsx` only — never from `packages/i18n`, never from a client component. The `legal` namespace holds the frame alone (titles, notice, "updated").

## API layer (do NOT modify)
- `@birlinq/api` — endpoints, one object per area; there is no `cardsApi`, a business card is a `personal` entity:
  - `authApi`: `register`, `login`, `logout`, `logoutAll`, `me`, `updateProfile(body)` (PATCH /auth/me), `changePassword(body)`, `verifyEmail`, `forgotPassword`, `resetPassword`.
  - `entitiesApi`: `list({ type?, cursor?, limit? })`, `listAll(params?)`, `create(body, { idempotencyKey? })` — always sends an Idempotency-Key —, `get`, `update(id, { title?, status?, alias? })`, `generateAlias(id)` — a fresh server-made alias, sends an Idempotency-Key —, `remove`, `upsertVehicle`, `upsertContact`, `uploadContactImage(id, "photo" | "cover", file, filename?)`, `updatePrivacy`, `stats(id)`, `createVehicle`.
  - `qrApi`: `lookup`, `activate`, `list`, `listAll`, `get`, `pause`, `resume`.
  - `publicApi`: `scan(code, locale?)`, `card(alias, locale?)`, `vcardUrl(target)` (a string for `<a download>`), `trackEvent(target, body)` (fire-and-forget, `keepalive`), `submitScenario`, `submitLead`, `reportAbuse(target, body)` — `target` is `{ kind: "qr", code }` or `{ kind: "alias", alias }`.
  - `ownerApi`, `pushApi`, `toApiLocale`.
- `@birlinq/api` — `card.ts`: `CARD_THEMES`, `SOCIAL_PLATFORMS`, `CONTACT_CHANNELS`, `ALIAS_RE`, `normalizeAlias`, `isReservedAlias`, `publicPath(target)`; `limits.ts`: field limits mirrored from the backend's Form Requests — put them on `maxLength`.
- `@birlinq/api` — types: all request/response types.
- `@birlinq/api` — client: `ApiRequestError` (fields: status, code, message) — use `err instanceof ApiRequestError` and switch on `err.code` for user-facing errors.
- `@birlinq/core` — headless hooks: `useOverview`, `useInteractions`, `useQrList`, `useCards`, `useCard`, `useCreateCard`, `useCardStats`, `useBusinessOverview`, `useProfile`, plus the privacy presets and `detailsToFieldErrors`. They return codes (`actionError`), never strings — map them onto your namespace in the view.
- Auth state (client): `const { user, loading, isAuthenticated, logout } = useAuth()` from `@birlinq/core`. Login/register via `authApi.login/register` (they persist tokens automatically).

## Auth guard pattern (protected pages)
Protected pages are client components:
```tsx
"use client";
const { loading, isAuthenticated } = useAuth();
const router = useRouter(); // from @/i18n/navigation
useEffect(() => { if (!loading && !isAuthenticated) router.replace("/login"); }, [loading, isAuthenticated, router]);
if (loading) return <PageSpinner />;
```
Cabinet pages get this from `DashboardShell` instead — it also sends a signed-out visitor to `/login?next=<pathname>` so login returns them to the deep link (FE-011). Write the guard by hand only outside the cabinet.

## Figma
File key `TjSplk2LZx1iH8hv7WK1y2`. Fetch frames with `mcp__Figma__get_design_context` (load via ToolSearch first). Look at the rendered image + extract layout/colors/texts. DO NOT transcribe absolute-positioned pixel divs; rebuild with clean flex/grid, mobile-first (390px), responsive up to desktop. DO NOT hotlink figma asset URLs (network-blocked); recreate decor with CSS/SVG.

## General
- Params in Next 15 are Promises: `params: Promise<{ locale: string }>` (await them).
- Mark interactive components `"use client"`; keep pages server components where possible (landing/public), client where stateful (dashboard, forms).
- TypeScript strict — no `any`, handle null/undefined.
- File ownership is strict: write only inside your assigned directories + your message namespace files. Never edit shared files or other sections' files.

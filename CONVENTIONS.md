# birlinq-frontend — conventions (read before writing any page)

## Stack
Next.js 15 (App Router, `apps/web/src/`), TypeScript strict, Tailwind CSS v4, next-intl v3.
**No new dependencies. No external assets/CDNs. Icons = inline SVG. Font = Inter via next/font (already wired).**

## Design tokens (globals.css @theme)
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
- `Logo` — birlinq wordmark with red dot; props size, href.
- `Badge` — tone accent/muted/warn/danger/info.
- `Spinner`, `PageSpinner`.
- `LangSwitcher` — locale pills.

## i18n (next-intl)
- Locales: `ru` (default, no URL prefix), `kk`, `en`. All UI strings MUST come from messages — no hardcoded text. Fill ALL THREE locale files for your namespace.
- Messages live in `apps/web/messages/{locale}/{namespace}.json`. Own ONLY your namespace file.
- Server component page: `const { locale } = await params; setRequestLocale(locale);` then `useTranslations("ns")` (sync components) or `await getTranslations("ns")`.
- Client components: `useTranslations("ns")` from `"next-intl"`.
- Navigation ONLY via `@/i18n/navigation`: `import { Link, useRouter, usePathname, redirect } from "@/i18n/navigation";`
- Backend locale code for API calls: use `toApiLocale(locale)` from endpoints (maps kk→kz).

## API layer (do NOT modify)
- `@/lib/api/endpoints`: `authApi`, `entitiesApi`, `qrApi`, `publicApi`, `ownerApi`, `toApiLocale`.
- `@/lib/api/types`: all request/response types.
- `@/lib/api/client`: `ApiRequestError` (fields: status, code, message) — use `err instanceof ApiRequestError` and switch on `err.code` for user-facing errors.
- Auth state (client): `const { user, loading, isAuthenticated, logout } = useAuth()` from `@/lib/auth/use-auth`. Login/register via `authApi.login/register` (they persist tokens automatically).

## Auth guard pattern (protected pages)
Protected pages are client components:
```tsx
"use client";
const { loading, isAuthenticated } = useAuth();
const router = useRouter(); // from @/i18n/navigation
useEffect(() => { if (!loading && !isAuthenticated) router.replace("/login"); }, [loading, isAuthenticated, router]);
if (loading) return <PageSpinner />;
```

## Figma
File key `TjSplk2LZx1iH8hv7WK1y2`. Fetch frames with `mcp__Figma__get_design_context` (load via ToolSearch first). Look at the rendered image + extract layout/colors/texts. DO NOT transcribe absolute-positioned pixel divs; rebuild with clean flex/grid, mobile-first (390px), responsive up to desktop. DO NOT hotlink figma asset URLs (network-blocked); recreate decor with CSS/SVG.

## General
- Params in Next 15 are Promises: `params: Promise<{ locale: string }>` (await them).
- Mark interactive components `"use client"`; keep pages server components where possible (landing/public), client where stateful (dashboard, forms).
- TypeScript strict — no `any`, handle null/undefined.
- File ownership is strict: write only inside your assigned directories + your message namespace files. Never edit shared files or other sections' files.

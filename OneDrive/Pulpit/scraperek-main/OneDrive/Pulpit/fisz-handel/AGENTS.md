# AGENTS.md

React 18 + Vite marketplace SPA ("u Fisza") bootstrapped via Lovable. Polish UI, Supabase backend, shadcn/ui components.

## Tech Stack

- React 18, Vite 5, TypeScript 5 (ES2020, bundler module resolution)
- React Router DOM v6, TanStack Query, Framer Motion
- Tailwind CSS v3 + `tailwindcss-animate`, shadcn/ui
- Supabase (`@supabase/supabase-js`) for DB/auth/realtime
- `@lovable.dev/cloud-auth-js` for OAuth (Google/Apple/Microsoft)
- Bun lockfiles present (`bun.lock`, `bun.lockb`); `package-lock.json` also exists

## Developer Commands

- `bun dev` — Vite dev server on **port 8080**, host `::`, HMR overlay disabled
- `bun run build` — production build
- `bun run build:dev` — development build
- `bun run lint` — ESLint (flat config, ignores `dist/`)
- `bun run test` — Vitest run once
- `bun run test:watch` — Vitest watch mode
- Playwright E2E: use `npx playwright test` (config via `lovable-agent-playwright-config`)

## TypeScript Quirks

- `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false` in `tsconfig.app.json`
- Path alias `@/*` maps to `./src/*` (Vite + TS both configured)
- Project references: `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`
- Vitest globals enabled; `types` includes `vitest/globals`

## Testing

- **Unit:** Vitest + jsdom. Setup: `src/test/setup.ts`. Pattern: `src/**/*.{test,spec}.{ts,tsx}`.
- **E2E:** Playwright via `lovable-agent-playwright-config`. Custom fixture re-exported from `playwright-fixture.ts`.

## Lint Quirks

- ESLint 9 flat config (`eslint.config.js`)
- `@typescript-eslint/no-unused-vars` is **off**
- `react-refresh/only-export-components` warns but allows constant exports

## Architecture & Entrypoints

- `src/main.tsx` → `src/App.tsx`
- `App.tsx` wraps providers: `QueryClientProvider`, `AuthProvider`, `CookieConsentProvider`, `CompareProvider`, `TooltipProvider`, `BrowserRouter`
- Routes (in `App.tsx`): `/`, `/product/:id`, `/add`, `/edit/:id`, `/auth`, `/profile`, `/messages`, `/messages/:id`, `/about`, `/terms`, `/privacy`, `/admin`, `/history`, `/compare`
- Pages live in `src/pages/`. Shared components in `src/components/`. Hooks in `src/hooks/`.
- `src/lib/utils.ts` exports `cn(...)` for Tailwind class merging.

## Backend & Auth

- **Supabase project:** `kbzbijgiplkpskumfhzz`. URL/key stored in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- **Generated client:** `src/integrations/supabase/client.ts` — auto-generated. Import via `@/integrations/supabase/client`.
- **Generated types:** `src/integrations/supabase/types.ts` — auto-generated DB types.
- **Lovable OAuth:** `src/integrations/lovable/index.ts` is auto-generated. Bridges `@lovable.dev/cloud-auth-js` with Supabase session.
- **Migrations:** `supabase/migrations/` — apply via Supabase CLI (`supabase db push`).
- **Edge Function:** `supabase/functions/suggest-price/index.ts` — Deno runtime, calls Lovable AI gateway for price suggestions.

## Styling

- Tailwind config: `tailwind.config.ts`. Dark mode via `class` strategy.
- Custom CSS variables in `src/index.css` (HSL theme vars, gradients, shadows).
- shadcn/ui aliases (from `components.json`): `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.

## Generated / Do Not Edit

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `src/integrations/lovable/index.ts`

## Vite Config Notes

- `lovable-tagger` plugin is **development-only**.
- `resolve.dedupe` forces single copies of `react`, `react-dom`, and JSX runtimes.

## Polish Domain Context

- Marketplace for used goods. Core entities: listings, offers, messages, follows, favorites, saved searches, notifications, reviews.
- `lovable/plan.md` contains prioritized roadmap (admin roles, DB indexes, offer validation, notification pagination, etc.).

## Dev commands
- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm build:dev` — development build
- `pnpm lint` — ESLint
- `pnpm format` — Prettier
- `pnpm vitest` — run tests (files matching `src/**/*.test.ts` and `src/**/*.test.tsx`)

## Tech stack
- **Framework**: TanStack Start (full-stack, Cloudflare Pages deployment)
- **Package manager**: pnpm
- **Styling**: Tailwind CSS v4 (CSS-based, no tailwind.config.js), shadcn/ui ("new-york" style)
- **Vite config**: `@lovable.dev/vite-tanstack-config` auto-includes: tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only), componentTagger (dev-only), @ alias, React/TanStack dedupe, error logger. **Do NOT add these plugins manually to vite.config.ts or the app will break with duplicates.**
- **Backend**: Supabase (migrations in `supabase/migrations/`, client at `src/integrations/supabase/client.ts`)

## Common pitfalls
- **Tailwind v4 native binding errors** (`@tailwindcss/oxide`): `Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml; pnpm install`
- **`routeTree.gen.ts` is auto-generated** — do not edit manually; it regenerates from `src/routes/`
- **`src/styles.css` is the Tailwind entry point** (configured in `components.json`)
- **Supabase client uses lazy init** via Proxy — direct import from `@/integrations/supabase/client`

## Architecture
- App name: **FISZU** (Polish personal finance tracker)
- Routes: `src/routes/` (auto-registered via TanStack router convention)
- Root layout: `src/routes/__root.tsx`
- Router factory: `src/router.tsx`
- Shared components: `src/components/fiszu/`
- UI primitives: `src/components/ui/` (shadcn/ui)
- Business logic: `src/lib/`
- Env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_*` (see `.env`)

## Testing setup
- `src/test/setup.ts` mocks `sonner` and `@/integrations/supabase/client`
- jsdom environment with `@testing-library/react` + user-event
- Test patterns: `src/**/*.test.ts`, `src/**/*.test.tsx`
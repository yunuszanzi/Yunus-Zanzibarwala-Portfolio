# Portfolio project: Claude memory

Source of truth: `PORTFOLIO_SPEC.md`. Re-read it when unsure. Update this file after every phase.

## Working rules
- Plain JavaScript only (`.jsx` components, `.js` everything else). No TypeScript, no tsconfig.
- Build phase by phase. After each phase: run the app, run `npm run build`, fix issues, give a short summary, then WAIT for the user to say "continue".
- Ask the user for the Supabase URL and anon key when reaching Phase 2/3 (database). Never use the service-role key in client code. Never commit `.env`.
- Files under ~250 lines. Original placeholder copy only; don't copy the reference site.
- Owner details (spec section 12) are real, not placeholders. Everything else is obviously generic placeholder content.
- Ask before adding paid services or heavy dependencies not in the spec.
- Write copy in plain, specific, first-person language (humanizer rules). Avoid "passionate", "cutting-edge", "seamless", "leverage", em-dash overuse.

## Environment notes
- Windows + Git Bash. Big multi-file heredocs with quotes can break; use the Write tool for files.
- Visual checks: `@playwright/test` + chromium are installed. Screenshot/overflow scripts live in the session scratchpad (`shot.cjs`, `overflow.cjs`), run with `NODE_PATH=$(pwd)/node_modules node <script>` against `timeout 60 npx vite preview --port 4173`.
- Tailwind gotcha: `hidden md:inline-flex` on `<Button>` doesn't hide because the base class has `inline-flex`. Wrap in a `div.hidden.md:block` instead. Grid children with long text need `min-w-0`.
- Don't run `taskkill` on all node processes; the auto-mode classifier blocks it. Use `timeout N npx vite` for dev-server checks.
- The auto-mode classifier denied running the ui-ux-pro-max `search.py` script, so design tokens were set by hand from spec section 3 (the documented fallback).

## Installed skills (project-level, `.claude/skills/`, via `npx skills add`)
- ui-ux-pro-max (nextlevelbuilder/ui-ux-pro-max-skill): design decisions. Re-run in Phase 9 if allowed.
- humanizer (blader/humanizer): all written copy.
- seo (addyosmani/web-quality-skills): Phase 9 and pre-deploy.
- playwright-best-practices (currents-dev): Phase 10 e2e tests.

## Stack decisions
- Vite 8, React 18.3, Tailwind v4 (`@tailwindcss/vite`), React Router 6, Framer Motion, TanStack Query, RHF + Zod 4 (`@hookform/resolvers`), Supabase JS, cmdk, react-markdown, react-helmet-async 3, @dnd-kit.
- Fonts via @fontsource-variable: Fraunces (display), Inter Tight (body), JetBrains Mono (labels).
- Theme: CSS variables in `src/styles/index.css` (`--bg`, `--surface`, `--border`, `--fg`, `--muted`, `--accent`); `data-theme` on `<html>`, set by inline script in `index.html` to avoid flash. Tailwind tokens: `bg-bg`, `bg-surface`, `border-line`, `text-fg`, `text-muted`, `text-accent`, `font-display/sans/mono`.
- `npm run build` = `eslint . && vite build`.

## Phase status
- [x] Phase 1 Scaffold: done, build and dev server verified.
- [x] Phase 2 Database: migration + seed run by user in dashboard, owner user created. RLS uses `public.is_owner()` (fixed email yunuszanzi@gmail.com). `.env` uses the new `sb_publishable_...` key under the name VITE_SUPABASE_ANON_KEY (never the `sb_secret_` key).
- [x] Phase 3 Data layer: `src/lib/{supabase,queryClient,utils,schemas}.js`, `src/hooks/useTable.js` (generic CRUD/reorder factory, optimistic delete+reorder), `src/hooks/queries.js` (per-table hooks, settings, projects+images, storage cleanup on delete, contact insert w/ honeypot). Providers wired in App.jsx. `npm run verify:rls` (scripts/verify-rls.mjs) checks RLS with the public key: all pass. Its update check only touches updated_at so a broken policy can't damage content.
- [x] Phase 4 Public site: all sections in `src/components/sections/`, navbar + scroll-spy (tracks 'top' too), cmdk palette (sections, projects, copy email, theme, socials), footer. Theme moved to a context (`ThemeProvider` + `lib/themeContext.js`) so palette and toggle share state. Settings accent color sets `--accent-custom` (dark theme only; light keeps darker accent for contrast). Heading order: h1 hero, h2 sections, h3 categories/sub-blocks, h4 projects. Phase 5 should pass a scroll-driven `gallery` prop into `ProjectShowcase`; `ProjectGallery` (scroll-snap) stays as mobile/reduced-motion fallback.
- [x] Phase 5 Project showcase: `ScrollGallery.jsx` (sticky frame, tall wrapper = n*70vh+100vh, framer `useScroll` progress -> active step, crossfade, clickable step list on lg+, progress bar, aria-live caption). `ProjectMedia.jsx` picks ScrollGallery (md+, motion allowed, >1 image) else `ProjectGallery` (scroll-snap swipe). Tested with mocked images via Playwright route interception (`gallery.cjs` in scratchpad), nothing written to DB. `screenshots/` is gitignored (user may drop raw screenshots there, one subfolder per slug).
- [x] Phase 6 Admin auth + shell: `/admin/*` lazy-loads `pages/admin/AdminApp.jsx` (own chunk, ~142KB; home never loads it). AuthProvider (`components/admin/AuthProvider.jsx` + `lib/authContext.js`, `hooks/useAuth.js`) wraps Supabase session; `RequireAuth` redirects to /admin/login and blocks non-owner emails (`lib/constants.js` OWNER_EMAIL). `AdminLayout` = sidebar (drawer on mobile) + top bar (View site, theme, Log out) + noindex. ToastProvider/useToast, Field/Input/Textarea (`components/ui/Field.jsx`, render-prop for ids). Module routes come from `lib/adminNav.js`; currently all render `ComingSoon` (replace in Phase 7). NotFound page exists (public + admin variant). Real owner login verified by the user on 2026-11-17 (they reset the password via SQL `extensions.crypt`; never ask for or store the password). I tested auth only tested with forged session + mocked API (`shell.cjs`; route must use regex `/supabase\.co/`, glob `**/supabase.co/**` doesn't match the subdomain; mocks need CORS headers).
- Known: main bundle ~836KB (254KB gzip). Trim in Phase 9 (manualChunks, lazy cmdk/react-markdown).
- [x] Phase 7 Admin modules (all done). Simple modules = `components/admin/crud/{CrudPage,CrudForm}.jsx` driven by `lib/adminModules.js` config (fields: text/textarea/url/date/chips/switch; optional toForm/toRow; experience bullets via `bullets_text`). `pages/admin/Messages.jsx` inbox (expand marks read, mark unread, reply mailto, delete, All/Unread filter). Tested with `crud7.cjs`. Earlier parts: Settings (`pages/admin/Settings.jsx` + `components/admin/settings/{SettingsFiles,BackupCard}.jsx`, `lib/backup.js` export/import JSON, messages excluded) and Projects (`ProjectsList.jsx`, `ProjectEdit.jsx`, `components/admin/projects/{ProjectImages,ImageCard,FeatureGroups,ProjectPreview,ProjectExtras,projectForm.js}`). Shared: `ui/Modal` (native <dialog>), `ui/ConfirmDialog`, `admin/SortableList` (dnd-kit, keyboard ok), `admin/ChipInput`, `admin/FormFields` (TextField/Switch/SwitchField/FormSection), `admin/FileUploadCard` (+ProgressBar), `lib/storage.js` (compress to WebP max 2000px, XHR upload w/ progress, removeFiles). Button has `to` prop for router links. Feature-group bullets edited as text lines (`bullets_text`, `linesToArray`). Files/screenshots/cover save immediately and delete replaced files. TODO: categories, stats, services, skills, experience, education, also-shipped, messages (`PAGES` map in AdminApp.jsx).
- Test harness `admin7.cjs`/`upload7.cjs` (scratchpad): forged session, GETs proxied to real DB without auth header, ALL writes/uploads faked.
- [x] Phase 8 Contact form: `components/sections/ContactForm.jsx` (passed as children into Contact in Home.jsx). Zod validation, honeypot `website` (off-screen, aria-hidden, tabIndex -1) + 2.5s time-trap both fake success without sending. Real submit verified: 201 insert, one test row "Claude (automated test)" left in messages for the user to delete. Tab order Name→Email→Message→Send. Phase 9 note: global unlayered `:focus-visible` outline in index.css overrides Tailwind `focus-visible:outline-none` on inputs (double ring) — tidy up.
- [x] Phase 9 Polish / SEO / a11y. Key architecture (don't break):
  - **Pre-render**: `npm run build` = eslint → vite build → `vite build --ssr src/entry-server.jsx --outDir dist-ssr` → `node --env-file-if-exists=.env scripts/prerender.mjs`. Renders `/` with live data into dist/index.html (+ helmet head, dehydrated React Query state `window.__RQ_STATE__`, accent `<style>`, font preloads, Supabase preconnect), writes dist/app.html (shell for other routes), sitemap.xml, robots.txt. `vercel.json` rewrites everything to /app.html (static files win, so / = prerendered). main.jsx hydrates only on `/` with children, else createRoot.
  - **Hydration rules**: no window/document during render; `useMediaQuery` uses useSyncExternalStore (server=false); ThemeToggle renders both icons, CSS picks (`.theme-icon-dark/light`); lazy chunks must not render during SSR (ContactForm behind `useNearViewport`, palette behind `paletteLoaded`, galleries in ProjectMedia only on desktop). Hero uses CSS `.rise-in` (h1 not animated = LCP). `Reveal` = CSS `.reveal` + one shared IntersectionObserver, hidden only under `html.js` + no-preference motion.
  - **Bundle**: main 165 KB (51 KB gz). Supabase loaded on demand via `lib/db.js` (`await db()` inside every queryFn/mutationFn in hooks/queries.js + useTable.js; admin-only files import lib/supabase directly). framer-motion only in lazy galleries + admin toasts. react-markdown replaced by `components/ui/SimpleMarkdown.jsx`. `PUBLIC_QUERIES` in queries.js = what prerender fetches.
  - ContactForm loads when near viewport OR first scroll/tap/key (NOT idle: idle loading dropped Lighthouse mobile 96→79). `useHashAnchor` keeps /#section aligned while desktop galleries grow (uses behavior:'instant').
  - SEO: `components/layout/Seo.jsx` (title, description, canonical, robots, OG, Twitter, JSON-LD WebSite+Person+CreativeWork). `lib/site.js` SITE_URL from VITE_SITE_URL (vite.config falls back to VERCEL_PROJECT_PRODUCTION_URL). public/og.png + apple-touch-icon.png generated (scratchpad og.cjs, fonts embedded as data URIs).
  - Colors: light accent #9a6200 (AA); `--danger` token (dark #f87171 / light #c81e1e) replaces Tailwind red-500 everywhere; danger button bg-red-700. Base styles in `@layer base`.
  - Error handling: router pathless layout route with `errorElement: <RouteError/>` (handles chunk-load failures after deploys).
  - Results (local preview): Lighthouse mobile 93–96 / 100 / 100 / 100, desktop 99–100 all; axe WCAG 2.1 AA: 0 issues on 19 page/theme combos. Lighthouse via `npx lighthouse@12` with CHROME_PATH = Playwright chromium, URL must be 127.0.0.1 (localhost → interstitial).
  - Needs from user: real VITE_SITE_URL (domain) for canonical/sitemap.
- [x] Phase 10 Playwright tests: 67 tests in `tests/e2e/` (`npm run test:e2e`, config `playwright.config.js` builds + serves on 127.0.0.1:4173). Live-safe: `support/fixtures.js` auto fixtures `supa` (SupabaseMock: live GETs w/o auth header, all writes/uploads/deletes faked + recorded; `withImages(n)`, `override()`, `messages`) and `health` (fails on console errors/failed requests; `health.allow(re)`); `loginAs(email?)` fake session. security.spec.js uses real anon client (harmless probes only). Passed twice in a row. Gotchas: wait for `dialog[open]` count 0 before keyboard actions (dialog close returns focus to opener); dnd-kit keyboard needs ~200ms between Space/Arrow/Space; ESLint react-hooks rule disabled for tests (Playwright `use`). App fixes from this phase: main.jsx only hydrates `__RQ_STATE__` on `/` and invalidates it immediately.
- [ ] Phase 11 Deploy docs

## Owner preferences
- Screenshots: 16:9 frames everywhere (`aspect-video`), uploads resized to fit 1600×900 (`SCREENSHOT_SIZE` in lib/storage.js), never cropped (`object-contain`). User found 16:10 crop bad AND letterboxing bad (2026-11-17); their screenshots are 16:9. Scroll-gallery frame width capped by viewport height to stay 16:9. Only the tiny admin list thumbnail uses `object-cover`.

- Gallery style: user set `GALLERY_STYLE = 'crossfade'` themselves on 2026-11-17 after trying 'stack' (don't change it back without asking; StackGallery.jsx kept in case they want it). `GALLERY_STYLE` in `src/lib/galleryConfig.js`. 'stack' = new `StackGallery.jsx` (smaller ~704px frame, cards slide up and pile, earlier ones peek above, dimmed, max 3 deep). 'crossfade' = original `ScrollGallery.jsx`. Revert = set to 'crossfade' (and optionally delete StackGallery.jsx). Swipe gallery capped at md:max-w-2xl.

## Real content from the owner
- Projects (2026-11-17): Bank of Punjab (BOP), Soneri Bank, Fraud Digitization Portal (FRMU), Personal Account Details (PAD), Sharia Compliance Solution (SCS), POS System, Apartment Management System (AMS). In `seed.sql` and the one-off `supabase/update_projects.sql`. User wrote "Panjab"; I used the bank's official spelling "Punjab" (flagged to user). Categories "Banking & finance" / "Business software" are my guess. Descriptions/years/roles/stacks unknown: placeholders. Screenshots coming later from the user.

## Decisions for the remaining phases (user, 2026-11-17)
- Phase 10 tests: **live-safe** only. Tests read the live site; ALL writes/uploads/deletes/messages are intercepted and faked (pattern from scratchpad admin7/crud7/contact-fake scripts: forged owner session in localStorage + route `/supabase\.co/`, GETs proxied without auth header). Plus read-only RLS checks with the public key (scripts/verify-rls.mjs pattern). No separate test Supabase project.
- Deploy: **GitHub + Vercel**. I init git and commit (attribution per system reminder); user creates the GitHub repo and imports into Vercel. Set env vars in Vercel (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Suggest a Deploy Hook to refresh the prerender snapshot.
- Domain: **free *.vercel.app**. Leave VITE_SITE_URL empty; vite.config/prerender fall back to VERCEL_PROJECT_PRODUCTION_URL. After first deploy, verify canonical/sitemap show the vercel.app URL.
- User wants hands-on help deploying once everything is finalized.

## Open items
- Owner RLS approach: fixed email check `auth.jwt() ->> 'email' = 'yunuszanzi@gmail.com'` (decide + document in Phase 2).

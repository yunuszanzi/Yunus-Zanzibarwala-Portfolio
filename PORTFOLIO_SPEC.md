# Portfolio Website + Admin Panel — Build Spec

> Hand this file to Claude Code in VS Code. Start with: "Read PORTFOLIO_SPEC.md and build the project phase by phase. Finish and verify each phase before starting the next."

## 1. Goal

Build a personal portfolio website with a **private admin panel** where the owner can add, edit, reorder and remove all site content without touching code.

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + Storage). No custom server needed.
- **Deploy:** Vercel (static SPA)
- **Design inspiration:** https://usmannadeem.vercel.app/ — a dark, editorial, single-page developer portfolio with scroll-driven project showcases. Take the *structure and feel*, not the text or images. Do not copy any of its copy, project names, screenshots or branding.

## 2. Tech stack

| Concern | Choice |
|---|---|
| Build tool | Vite + React 18 + **plain JavaScript (JSX)** — no TypeScript anywhere |
| Styling | Tailwind CSS v4 (with CSS variables for theme tokens) |
| Routing | React Router v6 |
| Animation | Framer Motion (scroll reveals, pinned/scroll-driven sections) |
| Data fetching | TanStack Query |
| Forms/validation | React Hook Form + Zod |
| Backend | Supabase (`@supabase/supabase-js`) |
| Icons | lucide-react |
| Rich text (optional) | Plain textarea with Markdown, rendered by `react-markdown` |
| Command palette | `cmdk` |
| Lint/format | ESLint + Prettier |

If a package choice is a problem, pick the closest alternative and note it in the README.

## 3. Public site

Single-page layout with smooth anchor scrolling. Sections in order:

1. **Navbar (sticky, blurred background)**
   - Logo/name on the left; links: Work, About, Skills, Experience, Contact.
   - A "Search `Ctrl+K`" button that opens a **command palette** (jump to section, open a project, copy email, open social links).
   - A primary "Say hello" button (mailto).
   - Skip-to-content link for accessibility.
2. **Hero**
   - Small eyebrow: `Name / Job title`.
   - Large headline (one punchy sentence), short subheading, two buttons ("See the work", "Say hello").
   - A 3-item info strip: *Now* (current role), *Based* (location/timezone), *Open to* (availability).
3. **Selected work**
   - Projects grouped by **category** (e.g. Mobile apps, Web & SaaS, Custom software), each category with a short heading and one-line description.
   - Each project is a large showcase block: year, title, description, a **screenshot gallery** that advances as the user scrolls (scroll-driven, with step captions like "01/07 — Sign in"), role, tech-stack chips, optional live link, optional "Private repository" label, and 2–4 feature groups with bullet lists.
   - A project index/jump list near the top lets users jump to any project.
   - Fall back to a simple swipeable gallery on mobile and when `prefers-reduced-motion` is on.
4. **About**
   - Headline, 2–3 paragraphs of bio, a row of 4 big stats (value + label), and a "What I do" list of 3–4 items (title + description).
5. **Skills**
   - Skills grouped by category (Frontend, Backend, Databases, Cloud/DevOps, Tools, etc.), shown as a list of groups with chips. Optional: a decorative rotating tag-cloud/globe (nice-to-have, last phase).
6. **Path (Experience & Education)**
   - Timeline of experience (role, company, date range, bullets), most recent first.
   - Education list (degree, institution, years).
   - "Also shipped" list of smaller projects (title, one-liner, optional link).
7. **Contact**
   - Headline, short pitch, "Say hello" button, "Copy email" button (with copied feedback), and a list of contact methods (email, phone, LinkedIn, GitHub, etc.).
   - Optional contact form that saves messages to the database and appears in the admin inbox.
8. **Footer** — copyright, social links.

### Design language

- **Theme:** dark by default (near-black background like `#0A0B0D`), with a light theme toggle. Persist choice in `localStorage` and respect `prefers-color-scheme` on first visit.
- **Style:** editorial, calm and confident. Generous whitespace, large display headings, thin 1px borders, subtle gradients/glow, muted grey body text, **one** accent color used sparingly (make it a CSS variable so it's easy to change).
- **Typography:** a distinctive display font for headings plus a clean sans for body, and a mono font for small labels/eyebrows. Load via `@fontsource` (no layout shift). Do not use default Inter-only styling.
- **Motion:** fade/translate-in on scroll, smooth section transitions, hover states on every interactive element. Keep it tasteful; always honor `prefers-reduced-motion`.
- **Responsive:** mobile-first; must look good at 360px, 768px, 1280px and 1920px.
- **Accessibility:** semantic landmarks, visible focus rings, alt text on all images, keyboard-operable command palette, WCAG AA contrast.
- **Performance:** lazy-load images, use `width/height` or aspect-ratio boxes, code-split the admin panel (`React.lazy`), target Lighthouse ≥ 90 on all four categories.
- **SEO:** per-site title/description/OG image editable from the admin (Settings), `react-helmet-async` for meta tags, `sitemap.xml` and `robots.txt`.

## 4. Admin panel

Route: `/admin` (login at `/admin/login`). Protected by Supabase Auth (email + password, single owner account). Not linked from the public site. Code-split.

### Layout
Sidebar (collapsible on mobile) + top bar with "View site" link and "Log out". Clean dashboard look consistent with the public theme. Toast notifications for every save/delete. Confirm dialog before any delete. Show loading and empty states everywhere.

### Modules (each with list view + create/edit form + delete)

| Module | Fields |
|---|---|
| **Site Settings** (single record) | site name, hero eyebrow, hero headline, hero subheading, primary/secondary CTA labels, "Now", "Based", "Open to", about headline, about paragraphs (Markdown), contact headline/pitch, email, phone, social links (label+URL, repeatable), SEO title/description, OG image upload, accent color, resume PDF upload |
| **Stats** | value, label, sort order |
| **What I do** | title, description, sort order |
| **Project categories** | title, description, sort order |
| **Projects** | title, slug, category, year, short description, role, tech tags (multi), live URL, repo label/URL, "private repo" toggle, feature groups (repeatable: heading + bullet list), **screenshots** (multi-upload, drag to reorder, caption + step label per image), cover image, featured toggle, published toggle, sort order |
| **Skill groups** | group name, skills (multi-chip input), sort order |
| **Experience** | role, company, start date, end date / "present", bullets (repeatable), sort order |
| **Education** | degree, institution, start year, end year, sort order |
| **Also shipped** | title, one-liner, link (optional), sort order |
| **Messages** | read-only inbox of contact-form submissions (name, email, message, date), mark read, delete |

### Admin UX requirements
- **Drag-and-drop reordering** for every list that has sort order (use `@dnd-kit`). Persist order immediately.
- **Image upload** to Supabase Storage with client-side compression/resizing (max ~2000px wide, WebP when possible), progress indicator, and delete-from-storage when removed.
- **Draft vs published** toggle on projects; drafts are visible only in admin.
- **Live preview:** a "Preview" button on the project form opens the project card as it will look on the site.
- **Form validation** with Zod; inline errors; disable submit while saving.
- **Optimistic updates** via TanStack Query where safe.
- **Export / import:** buttons in Settings to export all content as JSON and import it back (backup).

## 5. Data model (Supabase / Postgres)

Create `supabase/migrations/0001_init.sql` with these tables (all with `id uuid primary key default gen_random_uuid()`, `created_at`, `updated_at`):

- `site_settings` (single row; columns for the Settings fields above, `social_links jsonb`)
- `stats` (`value text`, `label text`, `sort_order int`)
- `services` (`title`, `description`, `sort_order`)
- `project_categories` (`title`, `description`, `sort_order`)
- `projects` (`category_id fk`, `title`, `slug unique`, `year`, `description`, `role`, `tech text[]`, `live_url`, `repo_label`, `repo_url`, `is_private bool`, `feature_groups jsonb`, `cover_image_url`, `featured bool`, `published bool`, `sort_order`)
- `project_images` (`project_id fk on delete cascade`, `image_url`, `storage_path`, `caption`, `step_label`, `sort_order`)
- `skill_groups` (`name`, `skills text[]`, `sort_order`)
- `experiences` (`role`, `company`, `start_date date`, `end_date date null`, `is_current bool`, `bullets text[]`, `sort_order`)
- `education` (`degree`, `institution`, `start_year`, `end_year`, `sort_order`)
- `also_shipped` (`title`, `description`, `url`, `sort_order`)
- `messages` (`name`, `email`, `message`, `is_read bool default false`)

**Row Level Security (mandatory):**
- Public (`anon`) can `SELECT` on all content tables (and only `published = true` rows of `projects`/`project_images`).
- Only the authenticated owner can `INSERT/UPDATE/DELETE` content tables and `SELECT/UPDATE/DELETE` `messages`.
- `anon` can `INSERT` into `messages` only (rate-limit via a simple honeypot field + minimum-length check; document adding Cloudflare Turnstile as a follow-up).
- Identify the owner by a fixed email check in the policies (`auth.jwt() ->> 'email' = '<OWNER_EMAIL>'`) or an `admins` table; document which approach was used.

**Storage:** a public-read bucket `portfolio` with owner-only write policies.

Include `supabase/seed.sql` with realistic **placeholder** content (fake name, 3 sample projects across 2 categories, sample skills/experience) so the site looks complete on first run. Everything must be editable/removable from the admin.

## 6. Project structure

```
portfolio/
├─ PORTFOLIO_SPEC.md
├─ README.md
├─ .env.example              # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├─ supabase/
│  ├─ migrations/0001_init.sql
│  └─ seed.sql
├─ public/                   # favicon, og.jpg, robots.txt
└─ src/
   ├─ main.jsx, App.jsx, router.jsx
   ├─ lib/                   # supabase client, queryClient, utils, zod schemas
   ├─ hooks/                 # useTheme, useScrollSpy, useReducedMotion, queries
   ├─ components/
   │  ├─ ui/                 # Button, Input, Textarea, Dialog, Toast, Chip, Skeleton
   │  ├─ layout/             # Navbar, Footer, CommandPalette, ThemeToggle
   │  └─ sections/           # Hero, Work, ProjectShowcase, About, Skills, Path, Contact
   ├─ pages/
   │  ├─ Home.jsx
   │  └─ admin/              # Login, Dashboard, and one page per module
   └─ styles/index.css       # Tailwind + theme tokens
```

## 7. Build phases (do in order, verify each)

1. **Scaffold:** Vite + React (JavaScript/JSX template, `react` not `react-ts`), Tailwind, ESLint/Prettier, folder structure, theme tokens, fonts, dark/light toggle.
2. **Database:** write migration, RLS policies, storage bucket, seed file. Document how to run them in the Supabase dashboard or CLI in the README.
3. **Data layer:** Supabase client, TanStack Query hooks for every table, Zod schemas (Zod is used for form validation only, in plain JS).
4. **Public site:** build every section reading live from Supabase, with skeleton loaders. Navbar, scroll-spy, command palette.
5. **Project showcase:** scroll-driven gallery with captions, reduced-motion and mobile fallbacks.
6. **Admin auth + shell:** login, protected routes, sidebar layout, logout, session persistence.
7. **Admin modules:** Settings → Projects (most complex: images, reorder, feature groups) → remaining modules → Messages.
8. **Contact form:** public form → `messages` table → admin inbox.
9. **Polish:** animations, SEO/meta, accessibility pass, Lighthouse pass, 404 page, error boundaries, favicon/OG.
10. **Testing:** Playwright end-to-end tests and bug fixing, as described in section 11.
11. **Deploy docs:** README with setup steps, env vars, Supabase setup, how to create the owner user, Vercel deploy (add `vercel.json` SPA rewrite).

## 8. Acceptance criteria

- [ ] `npm install && npm run dev` runs with only `.env` values filled in.
- [ ] Public site renders every section from database content; no hard-coded copy except UI labels.
- [ ] Logged-out visitors cannot reach `/admin`, and cannot write to any table (verify RLS by testing with the anon key).
- [ ] From the admin I can: create, edit, reorder, publish/unpublish and delete projects (including screenshots), and edit every other content type; changes appear on the public site after refresh.
- [ ] Deleting a project/image also removes its files from Storage.
- [ ] Dark/light theme works with no flash of wrong theme on load.
- [ ] Fully usable at 360px width; keyboard navigation works across site and admin.
- [ ] `npm run build` passes with no ESLint errors, and the project contains no `.ts`/`.tsx` files or `tsconfig.json`.
- [ ] Lighthouse ≥ 90 (Performance, Accessibility, Best Practices, SEO) on the public home page.
- [ ] README explains setup in under 10 steps.

## 9. Working rules for Claude Code

- Use plain JavaScript (ES modules, `.jsx` for components, `.js` for everything else). Do not use TypeScript. Document component props with short JSDoc comments where helpful.
- Prefer small, focused components; keep files under ~250 lines.
- Never commit secrets; only the anon key goes in the frontend. Never use the service-role key in client code.
- Don't copy text, images or code from the reference site. Use original placeholder content.
- After each phase: run the dev server, run `npm run build`, and fix issues before moving on.
- Ask me before adding any paid service or heavy dependency not listed here.
- When finished, give a summary of what was built, how to run it, and anything left undone.

## 10. Skills and tools to use in Claude Code

Before starting, check which skills are installed in this project (`.claude/skills/` or the `/skills` menu). If one of the skills below is missing, tell me once, name it, and continue with the fallback. Do not stop the build.

- **UI UX Pro Max skill** — use it for all design decisions: the color palette, font pairing, spacing scale, component styles and layout of the public site and the admin panel. Run it at the start of Phase 1 (to set the theme tokens) and again in Phase 9 (design polish). Fallback: follow section 3 "Design language".
- **Humanizer skill** — use it on every piece of written copy: the seed/placeholder content, hero and about text, button labels, empty states, error messages and the README. Copy should sound like a real person wrote it: specific, plain, first-person where it fits, short sentences. Avoid stock AI phrasing ("passionate about", "cutting-edge", "seamless", "leverage", "delve", "in today's fast-paced world"), em-dash overuse, and lists of three adjectives. Fallback: apply those rules by hand.
- **SEO skill** — use it for all search and sharing setup, in Phase 9 and again before deploy. Scope: unique title and meta description per page, canonical URLs, Open Graph and Twitter cards, JSON-LD structured data (`Person` for the owner, `CreativeWork` for each project), a generated `sitemap.xml` and `robots.txt`, semantic heading order (one `h1`), descriptive image alt text, clean readable URLs and project slugs, and Core Web Vitals (LCP, CLS, INP). Because this is a client-rendered React app, also add prerendering or static generation for the public pages (for example `vite-plugin-ssg` or a prerender step at build time) so crawlers see real content, and document how it works in the README. Fallback: apply this checklist by hand and verify with Lighthouse.
- **Playwright (bug testing)** — use it for end-to-end testing in Phase 11. Install with `npm i -D @playwright/test` and `npx playwright install`.

## 11. Testing phase (Phase 11, after polish)

Write Playwright tests in `tests/e2e/` and add `npm run test:e2e`. Run them, fix every failure, and re-run until green. Cover at least:

1. **Public site:** home page loads with all sections; navbar links scroll to the right section; command palette opens with Ctrl+K and navigates; theme toggle persists after reload; project showcase renders images; "Copy email" works.
2. **Contact form:** valid submit shows success and creates a message; empty/invalid input shows errors; honeypot submissions are rejected.
3. **Admin auth:** `/admin` redirects to login when logged out; wrong password shows an error; correct login reaches the dashboard; logout ends the session.
4. **Admin CRUD:** for each module (settings, stats, services, categories, projects, skill groups, experience, education, also shipped) create, edit, reorder where applicable, and delete an item, then confirm the change appears on the public site. For projects also test image upload, publish/unpublish and that deleting removes the images.
5. **Security:** using the anon key, writes to every content table are rejected; unpublished projects are not returned to the public.
6. **Responsive and accessibility:** run at 360px, 768px and 1280px with no horizontal scroll; keyboard-only navigation through the navbar and admin forms; no serious issues from `@axe-core/playwright`.
7. **SEO:** each public page has a unique title, meta description, canonical link, Open Graph tags and valid JSON-LD; `/sitemap.xml` and `/robots.txt` load; there is exactly one `h1`; `/admin` is marked `noindex`.
8. **Console health:** fail any test that logs an uncaught error or failed network request.

Use a separate Supabase project (or a clearly marked test schema) for tests, never the live data. Finish with a short bug report: what failed, what was fixed, what remains.

## 12. Owner details (use these for real, not as placeholders)

Use these in `seed.sql`, the site settings, the contact section, the footer, the SEO metadata (including the JSON-LD `Person`), and the RLS owner email. Write the hero and about text in the first person as this person.

| Field | Value |
|---|---|
| Owner name | Yunus Mustafa Zanzibarwala (use "Yunus Zanzibarwala" or "Yunus" in short places like the navbar and footer) |
| Job title | Software Developer |
| Location | Karachi, Pakistan (timezone: Asia/Karachi, PKT) |
| Email | yunuszanzi@gmail.com (also the admin owner email in the RLS policies) |
| Phone | +923082352331 |
| LinkedIn | https://www.linkedin.com/in/yunuszanzibar/ |
| GitHub | https://github.com/yunuszanzi |

Everything else (bio, stats, projects, skills, experience, education) stays as clearly marked placeholder content until I replace it from the admin panel. Do not invent employers, degrees, numbers or client names and present them as real; keep placeholders obviously generic (for example "Project One", "Company Name") so nothing fake gets published by accident.

## 13. Placeholders to replace before launch

Bio and about text, stats, accent color, OG image, favicon, resume PDF, real projects and screenshots, experience, education and skills. (Owner name, title, location, contact details and social links are already filled in, see section 12.)

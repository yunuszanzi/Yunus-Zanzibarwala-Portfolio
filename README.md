# Yunus Zanzibarwala: portfolio

My personal portfolio, with a private admin panel for editing everything on it.

- **Front end:** React 18 + Vite, Tailwind CSS v4, plain JavaScript (no TypeScript)
- **Back end:** Supabase (Postgres, Auth, Storage). No custom server.
- **Hosting:** Vercel. The home page is pre-rendered at build time for SEO.
- **Admin:** `/admin` (not linked from the site). Only the owner account can sign in.

## Setup (9 steps)

You need Node.js 22.9 or newer and a free [Supabase](https://supabase.com) account.

1. `npm install`
2. Create a Supabase project. In **SQL Editor**, run `supabase/migrations/0001_init.sql` (tables, security rules, storage bucket).
3. In the same editor, run `supabase/seed.sql` for starter content.
4. **Authentication > Users > Add user > Create new user**: email `yunuszanzi@gmail.com`, a strong password, tick **Auto Confirm User**.
5. **Authentication > Sign In / Providers > Email**: turn off **Allow new users to sign up** (see "How the owner is identified").
6. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings > API Keys**. Use the **publishable** key, never the secret one.
7. `npm run dev`, then open http://localhost:5173 (site) and http://localhost:5173/admin (admin).
8. Push the project to GitHub and import it at [vercel.com/new](https://vercel.com/new). Vercel detects Vite on its own.
9. In Vercel, under **Settings > Environment Variables**, add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then deploy. On a `*.vercel.app` address, leave `VITE_SITE_URL` empty and it's filled in automatically. With your own domain, set it to `https://yourdomain.com`.

Forgot the admin password? In Supabase **SQL Editor** run:

```sql
update auth.users set encrypted_password = extensions.crypt('NEW-PASSWORD', extensions.gen_salt('bf'))
where email = 'yunuszanzi@gmail.com';
```

### Environment variables

| Name                     | Where           | What                                                                                                 |
| ------------------------ | --------------- | ---------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | `.env` + Vercel | Project URL, e.g. `https://xxxx.supabase.co`                                                         |
| `VITE_SUPABASE_ANON_KEY` | `.env` + Vercel | The **publishable** (anon) key. Safe in the browser because Row Level Security protects every table. |
| `VITE_SITE_URL`          | optional        | Your live address, for canonical links and the sitemap. Auto-filled on Vercel.                       |

Never put the secret / service-role key anywhere in this project. `.env` is gitignored.

### Scripts

| Command              | Does                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `npm run dev`        | Local dev server                                                  |
| `npm run build`      | Lint, build, pre-render the home page, write sitemap + robots.txt |
| `npm run preview`    | Serve the production build locally                                |
| `npm run test:e2e`   | Playwright tests (see "Tests")                                    |
| `npm run verify:rls` | Check the security rules with the public key                      |

### Refreshing the SEO snapshot (optional)

Visitors always see your latest edits. Search engines see the snapshot from the last deploy. To refresh it after big edits: in Vercel, open **Settings > Git > Deploy Hooks**, create a hook, and open its URL (or bookmark it) to trigger a rebuild.

### How the owner is identified

The policies call `public.is_owner()`, which checks that the signed-in user's JWT email is `yunuszanzi@gmail.com`. Only that user can write content, read messages, or upload files. Anyone else, signed in or not, can only read published content and send a contact message.

If you also turn on public sign-ups in Supabase, anyone who confirms that exact email would pass the check, so keep sign-ups disabled (**Authentication > Providers > Email > disable "Allow new users to sign up"**) after you create the owner.

### Contact form spam

The form uses a hidden honeypot field and ignores submissions sent within 2.5 seconds of the form appearing. Both get a fake "thanks" and nothing is stored. The database also enforces length and email format checks. Adding Cloudflare Turnstile is a good follow-up if spam shows up.

## How pre-rendering works (SEO)

The site is a React app, but search engines and link previews get real HTML:

1. `npm run build` builds the app, then builds `src/entry-server.jsx` for Node.
2. `scripts/prerender.mjs` fetches the published content from Supabase, renders the home page to HTML, and writes it into `dist/index.html` with the page title, meta description, canonical URL, Open Graph/Twitter tags and JSON-LD (`Person` + one `CreativeWork` per project).
3. It also writes `dist/sitemap.xml` and `dist/robots.txt`, and saves the plain app shell as `dist/app.html`, which `vercel.json` serves for every other route (`/admin`, 404s).
4. In the browser, React takes over the pre-rendered HTML and immediately refetches live data, so visitors always see the latest content.

The HTML snapshot is from the last build. Edits in the admin show up for visitors straight away, but crawlers see them after the next deploy. To refresh it automatically, add a Vercel Deploy Hook and call it after big edits (or on a daily schedule).

Set `VITE_SITE_URL` to your live address so canonical and sitemap URLs are right. If Supabase can't be reached during a build, the build still succeeds and serves the plain app.

## Tests

```bash
npx playwright install chromium   # once
npm run test:e2e                  # builds the site, serves it, runs 67 tests (~2 min)
npm run test:e2e:report           # open the HTML report after a run
npm run verify:rls                # quick security check with the public key
```

The tests run against the real production build and your **live** Supabase project, but they never change it:

- Every browser request to Supabase goes through a mock (`tests/e2e/support/supabaseMock.js`). Reads go to the real database with the public key, so pages show real content. **Every write, upload and delete is faked** and recorded, and the tests check exactly what would have been sent.
- Admin tests use a fake owner session. Sign-in responses are faked too, so no real login attempts are made.
- `security.spec.js` talks to the real database with the public key, like an attacker would, and checks that every write is refused. It only tries harmless changes, so even a broken policy couldn't damage content.
- Every test fails on any console error, uncaught exception or failed request.

| File                      | Covers                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public.spec.js`          | All sections render, navbar scrolling, Ctrl+K palette, theme persistence and no-flash, scroll gallery + mobile swipe gallery, Copy email, 404                            |
| `contact.spec.js`         | Valid send, empty/invalid errors, honeypot, bot-speed submits, server error                                                                                              |
| `admin-auth.spec.js`      | Redirect when logged out, wrong password, correct login, reload keeps session, logout, non-owner blocked                                                                 |
| `admin-crud.spec.js`      | Create, edit, keyboard reorder and delete for every list module; settings; messages                                                                                      |
| `admin-projects.spec.js`  | New project (slug, tech, feature groups), publish toggle, reorder, screenshot upload (WebP, labels, order), deleting screenshots/projects removes storage files, preview |
| `security.spec.js`        | Public key can't write any table or storage, can't read messages, drafts stay hidden, bad messages refused                                                               |
| `responsive-a11y.spec.js` | No sideways scroll at 360/768/1280px, keyboard-only navbar/login/dialogs, axe (WCAG 2.1 AA) on public + admin in both themes                                             |
| `seo.spec.js`             | Title, description, canonical, Open Graph/Twitter, JSON-LD, sitemap/robots, one h1, image alt text, unique titles, noindex on admin/404                                  |

**What these tests can't prove:** because writes are faked, they don't confirm an admin edit really lands in the database and then shows on the public site. That path was checked by hand (you've been saving settings and uploading screenshots on the live project). For fully end-to-end write tests, point `.env` at a separate Supabase project with the same migration and seed.

### Bug report from the test phase

| Found                                                                                                                                                                                                               | Fixed                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Right after a build, the home page kept its build-time data for up to 60 s instead of loading live data                                                                                                             | Pre-rendered data is now marked stale immediately, so the browser always refetches (`src/main.jsx`) |
| When a server serves the pre-rendered `index.html` for `/admin` (e.g. `vite preview`), the admin reused the public snapshot instead of loading fresh data with drafts                                               | Snapshot data is only used on `/`                                                                   |
| Earlier phases (found with the same harness): idle-loading the contact form hurt mobile Lighthouse, `/#contact` links landed short, low-contrast red and badge text in the light theme, double focus ring on inputs | All fixed in Phase 9                                                                                |

Everything else that failed during the test phase was a mistake in the tests themselves (selectors, timing), not the app. Nothing known remains open.

## Notes on packages

- **react-markdown** is replaced by a small built-in renderer (`src/components/ui/SimpleMarkdown.jsx`). The bio only needs paragraphs, bold, italics and links, and this saves about 125 KB.
- The Supabase client, contact form, command palette and desktop galleries load on demand, so the first page load stays small (about 51 KB of gzipped JavaScript).

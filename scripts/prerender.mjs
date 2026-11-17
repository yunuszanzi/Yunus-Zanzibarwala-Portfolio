// Runs after `vite build` + the SSR build (see "build" in package.json).
//  1. Renders the home page with live Supabase data into dist/index.html, so crawlers and
//     link previews see real content and meta tags without running JavaScript.
//  2. Saves the un-rendered shell as dist/app.html for every other route (/admin, 404s).
//  3. Writes dist/sitemap.xml and dist/robots.txt with the site URL.
// If Supabase can't be reached, the build still succeeds with the plain SPA shell.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const dist = path.join(root, 'dist')
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js')

const siteUrl = (
  process.env.VITE_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:5173')
).replace(/\/$/, '')

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
fs.writeFileSync(path.join(dist, 'app.html'), template)

const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c')
let lastmod = new Date().toISOString()

try {
  const { render } = await import(pathToFileURL(ssrEntry).href)
  const result = await render()
  lastmod = result.lastmod || lastmod
  const accent = /^#[0-9a-f]{6}$/i.test(result.accent ?? '')
    ? `<style>:root{--accent-custom:${result.accent}}</style>`
    : ''
  // Preload the Latin display + body fonts. Otherwise the browser only finds them after the
  // CSS has loaded, and the headline (the LCP element) re-renders late when they arrive.
  const assets = fs.readdirSync(path.join(dist, 'assets'))
  const preloads = ['fraunces-latin-wght-normal-', 'inter-tight-latin-wght-normal-']
    .map((prefix) => assets.find((f) => f.startsWith(prefix) && f.endsWith('.woff2')))
    .filter(Boolean)
    .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`)
    .join('')
  // Open the connection to Supabase early; the page refetches live data right after load.
  const supabaseOrigin = process.env.VITE_SUPABASE_URL
    ? `<link rel="preconnect" href="${new URL(process.env.VITE_SUPABASE_URL).origin}" crossorigin>`
    : ''

  const html = template
    // Helmet supplies the real title/description; drop the template defaults.
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace('</head>', `${preloads}${supabaseOrigin}${result.head}${accent}</head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${result.html}</div><script>window.__RQ_STATE__=${json(result.state)}</script>`,
    )
  fs.writeFileSync(path.join(dist, 'index.html'), html)
  console.log(`prerender: rendered / (${Math.round(html.length / 1024)} KB)`)
} catch (err) {
  console.warn('prerender: skipped, serving the plain SPA shell instead.\n ', err.message)
}

fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${lastmod.slice(0, 10)}</lastmod>
  </url>
</urlset>
`,
)
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${siteUrl}/sitemap.xml
`,
)
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerender: sitemap.xml + robots.txt for ${siteUrl}`)
if (siteUrl.startsWith('http://localhost')) {
  console.warn('prerender: VITE_SITE_URL is not set, so canonical/sitemap URLs use localhost.')
}

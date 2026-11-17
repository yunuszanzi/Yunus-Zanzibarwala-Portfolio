import { test, expect } from './support/fixtures.js'

// The raw HTML checks use `request` (no JavaScript), i.e. what a crawler or link preview sees.

test('pre-rendered HTML has title, description, canonical, social tags and content', async ({
  request,
}) => {
  const html = await (await request.get('/')).text()
  const one = (re) => html.match(re)?.[1]

  const title = one(/<title[^>]*>([^<]+)<\/title>/)
  expect(title?.length).toBeGreaterThan(10)
  expect(html.match(/<title/g)).toHaveLength(1)
  expect(one(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)?.length).toBeGreaterThan(50)
  expect(html.match(/name="description"/g)).toHaveLength(1)
  expect(one(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)).toMatch(/^https?:\/\/[^/]+\/$/)
  for (const prop of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    expect(html, prop).toMatch(new RegExp(`property="${prop}"[^>]*content="[^"]+"`))
  }
  expect(html).toMatch(/name="twitter:card"[^>]*content="summary_large_image"/)
  // Real content, not an empty shell.
  expect(html).toMatch(/<h1[^>]*>[^<]{10,}<\/h1>/)
  expect(html.match(/<h1/g)).toHaveLength(1)
  expect(html).toMatch(/id="project-[a-z0-9-]+"/)
})

test('JSON-LD is valid: WebSite, Person, and a CreativeWork per project', async ({ request }) => {
  const html = await (await request.get('/')).text()
  const raw = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1]
  expect(raw).toBeTruthy()
  const data = JSON.parse(raw)
  expect(data['@context']).toBe('https://schema.org')
  const graph = data['@graph']
  const person = graph.find((n) => n['@type'] === 'Person')
  expect(person.name).toBeTruthy()
  expect(person.sameAs.length).toBeGreaterThan(0)
  expect(graph.find((n) => n['@type'] === 'WebSite')).toBeTruthy()
  const works = graph.filter((n) => n['@type'] === 'CreativeWork')
  expect(works.length).toBe((html.match(/<article[^>]*id="project-/g) ?? []).length)
  for (const w of works) {
    expect(w.name).toBeTruthy()
    expect(w.creator['@id']).toBe(person['@id'])
  }
})

test('sitemap.xml and robots.txt load and agree', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  const xml = await sitemap.text()
  const loc = xml.match(/<loc>([^<]+)<\/loc>/)?.[1]
  expect(loc).toMatch(/^https?:\/\/[^/]+\/$/)

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  const txt = await robots.text()
  expect(txt).toMatch(/Disallow: \/admin/)
  expect(txt).toContain(`Sitemap: ${loc}sitemap.xml`)

  // Canonical in the page matches the sitemap.
  const html = await (await request.get('/')).text()
  expect(html).toContain(`rel="canonical" href="${loc}"`)
})

test('rendered page: exactly one h1, alt text on every image', async ({ page, supa }) => {
  supa.withImages(2)
  await page.goto('/')
  await expect(page.locator('h1')).toHaveCount(1)
  const missingAlt = await page.locator('img:not([alt])').count()
  expect(missingAlt).toBe(0)
})

test('each page has a unique title; admin and 404 are noindex', async ({ page }) => {
  await page.goto('/')
  const homeTitle = await page.title()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/)

  await page.goto('/admin/login')
  await expect(page).not.toHaveTitle(homeTitle)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)

  await page.goto('/no-such-page')
  await expect(page).toHaveTitle('Page not found')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

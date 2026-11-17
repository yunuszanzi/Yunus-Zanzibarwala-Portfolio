import { test, expect, scrollThrough } from './support/fixtures.js'

const SECTIONS = [
  { id: 'work', link: 'Work' },
  { id: 'about', link: 'About' },
  { id: 'skills', link: 'Skills' },
  { id: 'experience', link: 'Experience' },
  { id: 'contact', link: 'Contact' },
]

test('home page loads every section from the database', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).not.toHaveText(/loading/i)
  for (const s of SECTIONS) await expect(page.locator(`#${s.id}`)).toBeVisible()
  await expect(page.locator('#work article').first()).toBeVisible()
  await scrollThrough(page)
  await expect(page.locator('#skills li').first()).toBeVisible()
  await expect(page.locator('#experience ol > li').first()).toBeVisible()
  await expect(page.locator('#contact a[href^="mailto:"]').first()).toBeVisible()
  await expect(page.locator('footer')).toContainText(String(new Date().getFullYear()))
})

test('navbar links scroll to the right section', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Main' })
  for (const s of SECTIONS) {
    await nav.getByRole('link', { name: s.link, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`#${s.id}$`))
    await expect
      .poll(() =>
        page.locator(`#${s.id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top)),
      )
      .toBeLessThan(140)
  }
})

test('command palette opens with Ctrl+K and navigates', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  const input = page.getByPlaceholder(/Jump to a section/)
  await expect(input).toBeFocused()
  await input.fill('skills')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#skills$/)
  await expect(input).toBeHidden()

  // Jump to a project by name
  const firstTitle = await page.locator('#work article h4').first().innerText()
  await page.keyboard.press('Control+k')
  await page.getByPlaceholder(/Jump to a section/).fill(firstTitle)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#project-[a-z0-9-]+$/)
})

test('theme toggle persists after reload', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Toggle light and dark theme' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light')
})

test('first visit follows the system theme with no flash', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' })
  const page = await context.newPage()
  await page.goto('/', { waitUntil: 'commit' })
  // Set by the inline script before anything paints.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await context.close()
})

test.describe('project showcase', () => {
  test.beforeEach(({ supa }) => supa.withImages(3))

  test('desktop: scroll-driven gallery renders images and step captions', async ({ page }) => {
    await page.goto('/')
    const gallery = page.getByTestId('scroll-gallery').first()
    await gallery.scrollIntoViewIfNeeded()
    const img = gallery.locator('img').first()
    await expect(img).toBeVisible()
    await expect.poll(() => img.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0)
    await expect(gallery).toContainText('01/03')
    await gallery.getByRole('button', { name: /02\/03/ }).click()
    await expect(gallery.locator('figcaption')).toContainText('02/03')
  })

  test('mobile: swipe gallery instead of the scroll-driven one', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await page.goto('/')
    await expect(page.getByTestId('scroll-gallery')).toHaveCount(0)
    // Live data (with the mocked screenshots on the first project) loads on first scroll.
    const firstProject = page.locator('#work article').first()
    await firstProject.scrollIntoViewIfNeeded()
    const region = firstProject.getByRole('region', { name: /screenshots$/ })
    await region.scrollIntoViewIfNeeded()
    await expect(region.locator('img')).toHaveCount(3)
  })
})

test('"Copy email" copies the address and confirms', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#contact')
  const href = await page.locator('#contact a[href^="mailto:"]').last().getAttribute('href')
  const email = href.replace(/^mailto:/, '')
  await page.getByRole('button', { name: 'Copy email' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(email)
})

test('unknown URLs show the 404 page', async ({ page }) => {
  await page.goto('/this-does-not-exist')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/doesn’t exist/)
  await page.getByRole('link', { name: 'Back to the homepage' }).click()
  await expect(page).toHaveURL(/\/$/)
})

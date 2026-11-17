import AxeBuilder from '@axe-core/playwright'
import { test, expect, scrollThrough } from './support/fixtures.js'
import { CORS } from './support/env.js'

for (const width of [360, 768, 1280]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await scrollThrough(page)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('keyboard: skip link first, then the navbar', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()

  const reached = []
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    reached.push(
      await page.evaluate(
        () =>
          document.activeElement?.textContent?.trim() ||
          document.activeElement?.getAttribute('aria-label'),
      ),
    )
  }
  for (const label of ['Work', 'About', 'Skills', 'Experience', 'Contact'])
    expect(reached).toContain(label)

  // Enter on a nav link moves to that section.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Skills' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#skills$/)
})

test('keyboard: admin login works without a mouse', async ({ page, supa, health }) => {
  health.allow(/status of 400/)
  supa.override(
    (req) => req.url().includes('/auth/v1/token'),
    (route) =>
      route.fulfill({
        status: 400,
        headers: CORS,
        json: { error_code: 'invalid_credentials', msg: 'Invalid login credentials' },
      }),
  )
  await page.goto('/admin/login')
  await expect(page.getByLabel('Email')).toBeFocused() // autofocus
  await page.keyboard.type('yunuszanzi@gmail.com')
  await page.keyboard.press('Tab')
  await page.keyboard.type('nope')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toBeVisible()
})

test('keyboard: admin dialogs trap focus and close with Escape', async ({ page, loginAs }) => {
  await loginAs()
  await page.goto('/admin/stats')
  await page.getByRole('button', { name: 'Add stat' }).click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Tab')
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

async function expectNoSeriousA11yIssues(page) {
  await scrollThrough(page)
  await page.evaluate(() =>
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')),
  )
  await page.waitForTimeout(700) // let reveal transitions finish so colours are final
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact))
  expect(serious.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([])
}

for (const scheme of ['dark', 'light']) {
  test(`axe: home page (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/')
    await expectNoSeriousA11yIssues(page)
  })

  test(`axe: admin settings and projects (${scheme})`, async ({ page, loginAs }) => {
    await loginAs()
    await page.emulateMedia({ colorScheme: scheme })
    for (const path of ['/admin/settings', '/admin/projects']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoSeriousA11yIssues(page)
    }
  })
}

test('axe: admin login and 404', async ({ page }) => {
  for (const path of ['/admin/login', '/missing-page']) {
    await page.goto(path)
    await expectNoSeriousA11yIssues(page)
  }
})

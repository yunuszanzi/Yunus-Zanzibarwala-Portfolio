import { test, expect } from './support/fixtures.js'
import { makePng } from './support/env.js'

// Owner session is fake; every write and upload is faked by the mock and asserted.
test.beforeEach(async ({ loginAs }) => loginAs())

const projectRows = (page) => page.locator('ul > li').filter({ has: page.getByRole('switch') })

test('create a project: slug from title, saved as a draft at the end', async ({ page, supa }) => {
  await page.goto('/admin/projects')
  await expect(projectRows(page).first()).toBeVisible()
  const count = await projectRows(page).count()
  await page.getByRole('link', { name: 'New project' }).click()
  await page.getByLabel('Title').fill('Bank of Punjab — Mobile App!')
  await expect(page.getByLabel('Slug')).toHaveValue('bank-of-punjab-mobile-app')
  const tech = page.getByLabel('Tech')
  await tech.fill('React')
  await tech.press('Enter')
  await page.getByRole('button', { name: 'Add group' }).click()
  await page.getByLabel('Heading').fill('Security')
  await page.getByLabel('Bullets').fill('Two-factor sign-in\n\nAudit log ')
  await page.getByRole('button', { name: 'Create project' }).click()
  await expect(page.getByText('Project created. Now add screenshots.')).toBeVisible()

  const [post] = supa.rest('projects', 'POST')
  expect(post.body).toMatchObject({
    title: 'Bank of Punjab — Mobile App!',
    slug: 'bank-of-punjab-mobile-app',
    tech: ['React'],
    feature_groups: [{ heading: 'Security', bullets: ['Two-factor sign-in', 'Audit log'] }],
    published: false,
    sort_order: count + 1,
  })
  // Lands on the edit page where screenshots can be added.
  await expect(page.getByText('Drop images here')).toBeVisible()
})

test('publish / unpublish only changes `published`', async ({ page, supa }) => {
  await page.goto('/admin/projects')
  const first = projectRows(page).first()
  const wasOn = (await first.getByRole('switch').getAttribute('aria-checked')) === 'true'
  await first.getByRole('switch').click()
  await expect.poll(() => supa.rest('projects', 'PATCH').length).toBe(1)
  expect(supa.rest('projects', 'PATCH')[0].body).toEqual({ published: !wasOn })
})

test('reorder projects with the keyboard', async ({ page, supa }) => {
  await page.goto('/admin/projects')
  await expect(projectRows(page).first()).toBeVisible()
  const count = await projectRows(page).count()
  await projectRows(page)
    .first()
    .getByRole('button', { name: /^Reorder/ })
    .focus()
  for (const key of ['Space', 'ArrowDown', 'Space']) {
    await page.keyboard.press(key)
    await page.waitForTimeout(200)
  }
  await expect.poll(() => supa.rest('projects', 'PATCH').length).toBe(count)
  const orders = supa
    .rest('projects', 'PATCH')
    .map((w) => w.body.sort_order)
    .sort((a, b) => a - b)
  expect(orders).toEqual(Array.from({ length: count }, (_, i) => i + 1))
})

test('upload screenshots: resized to WebP, labelled from file names, appended in order', async ({
  page,
  supa,
}) => {
  await page.goto('/admin/projects')
  await projectRows(page).first().getByRole('link').first().click()
  await expect(page.getByText('Drop images here')).toBeVisible()
  await page.getByLabel('Choose screenshots to upload').setInputFiles([
    { name: '02-dashboard.png', mimeType: 'image/png', buffer: makePng(800, 450) },
    { name: '01-sign-in.png', mimeType: 'image/png', buffer: makePng(3200, 1800) },
  ])
  await expect(page.getByText('2 screenshots added')).toBeVisible()

  const uploads = supa.storage('POST')
  expect(uploads).toHaveLength(2)
  // Large image is shrunk and re-encoded; the small one may stay PNG if WebP is bigger.
  expect(uploads[0].contentType).toBe('image/webp')
  const rows = supa.rest('project_images', 'POST').map((w) => w.body)
  expect(rows.map((r) => r.step_label)).toEqual(['Sign in', 'Dashboard'])
  expect(rows[1].sort_order).toBe(rows[0].sort_order + 1)
})

test.describe('with existing screenshots', () => {
  test.beforeEach(({ supa }) => supa.withImages(2))

  test('deleting a screenshot also removes its file from storage', async ({ page, supa }) => {
    await page.goto('/admin/projects')
    await projectRows(page).first().getByRole('link').first().click()
    await page.getByRole('button', { name: 'Delete screenshot 1' }).click()
    await page.locator('dialog[open]').getByRole('button', { name: 'Delete' }).click()
    await expect.poll(() => supa.rest('project_images', 'DELETE').length).toBe(1)
    await expect.poll(() => supa.storage('DELETE').length).toBe(1)
    expect(JSON.stringify(supa.storage('DELETE')[0].body)).toContain('mock-0.webp')
  })

  test('deleting a project removes all its files from storage', async ({ page, supa }) => {
    await page.goto('/admin/projects')
    const first = projectRows(page).first()
    await expect(first).toContainText('2 screenshots')
    await first.getByRole('button', { name: /^Delete / }).click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toContainText('including the image files in storage')
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect.poll(() => supa.rest('projects', 'DELETE').length).toBe(1)
    await expect.poll(() => supa.storage('DELETE').length).toBe(1)
    const removed = JSON.stringify(supa.storage('DELETE')[0].body)
    expect(removed).toContain('mock-0.webp')
    expect(removed).toContain('mock-1.webp')
  })

  test('preview shows the project as the site renders it', async ({ page }) => {
    await page.goto('/admin/projects')
    await projectRows(page).first().getByRole('link').first().click()
    await page.getByLabel('Year').fill('2031')
    await page.getByRole('button', { name: 'Preview' }).click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog.locator('article')).toContainText('2031')
    await expect(dialog.getByRole('region', { name: /screenshots$/ }).locator('img')).toHaveCount(2)
  })
})

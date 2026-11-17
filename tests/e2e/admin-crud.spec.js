import { test, expect } from './support/fixtures.js'

// Logged in as the owner with a fake session. Lists show REAL data (read with the public
// key); every create/edit/reorder/delete is FAKED by the mock and asserted from supa.writes.
// Because writes are faked, "the change appears on the public site" can't be checked here;
// that's covered by asserting the exact payload the site would save (the public site reads
// those same rows). See the report at the end of the README.

test.beforeEach(async ({ loginAs }) => loginAs())

/** dnd-kit keyboard drag: pick up, move one down, drop, with human-like pauses. */
async function keyboardMoveDown(page) {
  for (const key of ['Space', 'ArrowDown', 'Space']) {
    await page.keyboard.press(key)
    await page.waitForTimeout(200)
  }
}

const MODULES = [
  {
    path: 'categories',
    table: 'project_categories',
    noun: 'category',
    fill: { Title: 'Mobile apps', 'One-line description': 'Apps people carry around.' },
    expect: { title: 'Mobile apps' },
  },
  {
    path: 'stats',
    table: 'stats',
    noun: 'stat',
    fill: { Value: '5+', Label: 'Years building software' },
    expect: { value: '5+', label: 'Years building software' },
  },
  {
    path: 'services',
    table: 'services',
    noun: 'item',
    fill: { Title: 'Web apps', Description: 'Dashboards and portals.' },
    expect: { title: 'Web apps' },
  },
  {
    path: 'skills',
    table: 'skill_groups',
    noun: 'group',
    fill: { 'Group name': 'Mobile' },
    chips: ['Flutter', 'Kotlin'],
    expect: { name: 'Mobile', skills: ['Flutter', 'Kotlin'] },
  },
  {
    path: 'experience',
    table: 'experiences',
    noun: 'role',
    fill: {
      Role: 'Software Developer',
      Company: 'Company Name',
      'Start date': '2024-03-01',
      'End date': '2025-01-31',
      'What you did': 'Built the transfer flow\n\nCut load time in half ',
    },
    expect: {
      role: 'Software Developer',
      end_date: '2025-01-31',
      bullets: ['Built the transfer flow', 'Cut load time in half'],
    },
  },
  {
    path: 'education',
    table: 'education',
    noun: 'entry',
    fill: {
      Degree: 'BS Computer Science',
      Institution: 'Some University',
      'Start year': '2018',
      'End year': '2022',
    },
    expect: { degree: 'BS Computer Science', start_year: '2018' },
  },
  {
    path: 'also-shipped',
    table: 'also_shipped',
    noun: 'project',
    fill: {
      Title: 'CLI tool',
      'One-liner': 'Small helper.',
      'Link (optional)': 'https://example.com',
    },
    expect: { title: 'CLI tool', url: 'https://example.com' },
  },
]

for (const mod of MODULES) {
  test(`${mod.path}: create, edit, reorder and delete`, async ({ page, supa }) => {
    await page.goto(`/admin/${mod.path}`)
    const dialog = page.locator('dialog[open]')
    const rows = page
      .locator('ul > li')
      .filter({ has: page.getByRole('button', { name: /^Reorder/ }) })
    await expect(rows.first()).toBeVisible()
    const count = await rows.count()

    // Create: empty submit is blocked, then a valid one is saved at the end of the list.
    await page
      .getByRole('button', { name: `Add ${mod.noun}` })
      .first()
      .click()
    await dialog.getByRole('button', { name: `Add ${mod.noun}` }).click()
    await expect(dialog.locator('p.text-danger').first()).toBeVisible()
    for (const [label, value] of Object.entries(mod.fill)) {
      await dialog.getByLabel(label, { exact: true }).fill(value)
    }
    for (const chip of mod.chips ?? []) {
      await dialog.getByLabel('Skills').fill(chip)
      await page.keyboard.press('Enter')
    }
    await dialog.getByRole('button', { name: `Add ${mod.noun}` }).click()
    await expect(page.getByText(`Added ${mod.noun}`)).toBeVisible()
    const [created] = supa.rest(mod.table, 'POST')
    expect(created.body).toMatchObject({ ...mod.expect, sort_order: count + 1 })

    // Edit the first row.
    await page
      .getByRole('button', { name: /^Edit / })
      .first()
      .click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Saved', { exact: true })).toBeVisible()
    expect(supa.rest(mod.table, 'PATCH')).toHaveLength(1)

    // Wait for the dialog to close: closing returns focus to the Edit button.
    await expect(dialog).toHaveCount(0)
    // Reorder with the keyboard: every row gets its new sort_order. With a single row there's
    // nowhere to move it, and correctly nothing is saved.
    await rows
      .first()
      .getByRole('button', { name: /^Reorder/ })
      .focus()
    await keyboardMoveDown(page)
    const expectedPatches = count > 1 ? 1 + count : 1
    await expect.poll(() => supa.rest(mod.table, 'PATCH').length).toBe(expectedPatches)

    // Delete asks first.
    await page
      .getByRole('button', { name: /^Delete / })
      .first()
      .click()
    await expect(dialog).toContainText('will be removed from the site')
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect.poll(() => supa.rest(mod.table, 'DELETE').length).toBe(1)
  })
}

test('experience: "I work here now" hides and clears the end date', async ({ page, supa }) => {
  await page.goto('/admin/experience')
  const dialog = page.locator('dialog[open]')
  await page.getByRole('button', { name: 'Add role' }).click()
  await dialog.getByLabel('Role', { exact: true }).fill('Developer')
  await dialog.getByLabel('Company', { exact: true }).fill('Company Name')
  await dialog.getByLabel('Start date').fill('2024-03-01')
  await dialog.getByRole('button', { name: 'Add role' }).click()
  await expect(dialog.getByText('Add an end date or mark this as current')).toBeVisible()
  await dialog.getByRole('switch').click()
  await expect(dialog.getByLabel('End date')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Add role' }).click()
  await expect.poll(() => supa.rest('experiences', 'POST').length).toBe(1)
  expect(supa.rest('experiences', 'POST')[0].body).toMatchObject({
    is_current: true,
    end_date: null,
  })
})

test('settings: validation, then save', async ({ page, supa }) => {
  await page.goto('/admin/settings')
  const headline = page.getByLabel('Headline').first()
  await expect(headline).not.toHaveValue('')
  await headline.fill('')
  await page.getByRole('button', { name: 'Save settings' }).click()
  await expect(page.getByText('Headline is required')).toBeVisible()
  expect(supa.rest('site_settings')).toHaveLength(0)

  await headline.fill('I build software people actually use.')
  await page.getByRole('button', { name: 'Add link' }).click()
  await page.getByLabel('Label').last().fill('Website')
  await page.getByLabel('URL').last().fill('https://example.com')
  await page.getByRole('button', { name: 'Save settings' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()
  const [save] = supa.rest('site_settings', 'PATCH')
  expect(save.body.hero_headline).toBe('I build software people actually use.')
  expect(save.body.social_links.at(-1)).toEqual({ label: 'Website', url: 'https://example.com' })
})

test('messages: opening marks read, delete asks first', async ({ page, supa }) => {
  supa.messages = [
    {
      id: 'm1',
      name: 'Sara Khan',
      email: 'sara@example.com',
      message: 'Are you free for a call next week?',
      is_read: false,
      created_at: '2026-11-16T10:00:00Z',
    },
    {
      id: 'm2',
      name: 'Ali',
      email: 'ali@example.com',
      message: 'Thanks for the quick reply!',
      is_read: true,
      created_at: '2026-11-10T08:30:00Z',
    },
  ]
  await page.goto('/admin/messages')
  await expect(page.getByText('From the contact form on the site. 1 unread.')).toBeVisible()
  await page.getByRole('button', { name: /Sara Khan/ }).click()
  await expect.poll(() => supa.rest('messages', 'PATCH')[0]?.body).toEqual({ is_read: true })
  await expect(page.getByRole('link', { name: 'Reply' })).toHaveAttribute(
    'href',
    /^mailto:sara@example\.com/,
  )
  await page.getByRole('button', { name: 'Delete' }).first().click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Delete' }).click()
  await expect.poll(() => supa.rest('messages', 'DELETE').length).toBe(1)
})

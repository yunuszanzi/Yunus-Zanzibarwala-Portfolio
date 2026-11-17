import { test, expect } from './support/fixtures.js'

// The insert into `messages` is faked by the Supabase mock and recorded in supa.writes,
// so no real messages are created.

async function openForm(page) {
  await page.goto('/#contact')
  const form = page.locator('form[aria-labelledby="contact-form-title"]')
  await expect(form).toBeVisible()
  return form
}

/** The form ignores submits within 2.5s of appearing (bot trap). Wait like a human. */
const humanPause = (page) => page.waitForTimeout(2700)

test('valid message shows success and is sent to the messages table', async ({ page, supa }) => {
  const form = await openForm(page)
  await form.getByLabel('Name').fill('Playwright Test')
  await form.getByLabel('Email').fill('test@example.com')
  await form.getByLabel('Message').fill('Hello! This is an automated end-to-end test.')
  await humanPause(page)
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Thanks, your message is on its way.')).toBeVisible()

  const [insert] = supa.rest('messages', 'POST')
  expect(insert.body).toEqual({
    name: 'Playwright Test',
    email: 'test@example.com',
    message: 'Hello! This is an automated end-to-end test.',
  })
})

test('empty and invalid input show errors and send nothing', async ({ page, supa }) => {
  const form = await openForm(page)
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(form.getByText('Name is required')).toBeVisible()
  await expect(form.getByText('Enter a valid email')).toBeVisible()
  await expect(form.getByText(/at least 10 characters/)).toBeVisible()

  await form.getByLabel('Name').fill('A')
  await form.getByLabel('Email').fill('not-an-email')
  await form.getByLabel('Message').fill('short')
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(form.getByText('Enter a valid email')).toBeVisible()
  await expect(form.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')
  expect(supa.rest('messages')).toHaveLength(0)
})

test('honeypot submissions are rejected silently', async ({ page, supa }) => {
  const form = await openForm(page)
  await form.getByLabel('Name').fill('Spam Bot')
  await form.getByLabel('Email').fill('bot@example.com')
  await form.getByLabel('Message').fill('Cheap followers, best price, click now!!!')
  // A bot fills every field, including the hidden one.
  await page.locator('#contact-website').fill('http://spam.example', { force: true })
  await humanPause(page)
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Thanks, your message is on its way.')).toBeVisible()
  expect(supa.rest('messages')).toHaveLength(0)
})

test('instant (bot-speed) submissions are rejected silently', async ({ page, supa }) => {
  const form = await openForm(page)
  await form.getByLabel('Name').fill('Fast Bot')
  await form.getByLabel('Email').fill('fast@example.com')
  await form.getByLabel('Message').fill('Submitted faster than any person could type.')
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Thanks, your message is on its way.')).toBeVisible()
  expect(supa.rest('messages')).toHaveLength(0)
})

test('a failed send shows an error and keeps the message', async ({ page, supa, health }) => {
  health.allow(/status of 500/)
  supa.override(
    (req) => req.method() === 'POST' && req.url().includes('/rest/v1/messages'),
    (route) =>
      route.fulfill({
        status: 500,
        headers: { 'access-control-allow-origin': '*' },
        json: { message: 'boom' },
      }),
  )
  const form = await openForm(page)
  await form.getByLabel('Name').fill('Playwright Test')
  await form.getByLabel('Email').fill('test@example.com')
  await form.getByLabel('Message').fill('This send is made to fail on purpose.')
  await humanPause(page)
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(form.getByRole('alert')).toContainText('didn’t go through')
  await expect(form.getByLabel('Message')).toHaveValue('This send is made to fail on purpose.')
})

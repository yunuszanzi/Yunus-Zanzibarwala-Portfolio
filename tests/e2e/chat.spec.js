import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './support/fixtures.js'
import { CORS } from './support/env.js'

// Chat settings and replies are faked here so the test doesn't depend on database content.
// Saving the conversation (save_chat RPC) is recorded by the mock, never really sent.

const REPLIES = [
  {
    id: 'r1',
    label: '',
    keywords: ['hi', 'hello'],
    answer: 'Hi there! Ask me anything.',
    sort_order: 1,
  },
  {
    id: 'r2',
    label: 'What do you build?',
    keywords: ['build', 'services'],
    answer: 'Web and mobile apps.',
    sort_order: 2,
  },
  {
    id: 'r3',
    label: 'How much does a project cost?',
    keywords: ['price', 'cost', 'how much'],
    answer: 'It depends on the scope.',
    sort_order: 3,
  },
]

/** site_settings comes back as a one-row array (supabase-js unwraps it). Patch the row. */
const withSettings = (data, extra) =>
  Array.isArray(data) ? data.map((row) => ({ ...row, ...extra })) : { ...data, ...extra }

test.beforeEach(async ({ supa }) => {
  supa.override(
    (req) => req.method() === 'GET' && req.url().includes('/rest/v1/chat_replies'),
    (route) => route.fulfill({ headers: CORS, json: REPLIES }),
  )
  supa.override(
    (req) => req.method() === 'GET' && req.url().includes('/rest/v1/site_settings'),
    async (route) => {
      const res = await route.fetch({ headers: supa.anonHeaders(route.request()) })
      const extra = {
        chat_enabled: true,
        chat_greeting: 'Hello from the test assistant.',
        chat_fallback: 'No answer yet. Yunus will reply.',
      }
      return route.fulfill({ response: res, json: withSettings(await res.json(), extra) })
    },
  )
})

/** Live data (with the chat settings) loads on first interaction. */
async function openChat(page) {
  await page.goto('/')
  await page.mouse.move(300, 300)
  const launcher = page.getByRole('button', { name: 'Chat with Yunus’s assistant' })
  await launcher.click()
  const panel = page.getByRole('dialog', { name: 'Chat with Yunus’s assistant' })
  await expect(panel).toBeVisible()
  return { launcher, panel }
}

test('greets, answers a suggested question and a typed one', async ({ page }) => {
  const { panel } = await openChat(page)
  await expect(panel.getByRole('log')).toContainText('Hello from the test assistant.')
  await expect(panel.getByLabel('Type a message')).toBeFocused()

  await panel.getByRole('button', { name: 'What do you build?' }).click()
  await expect(panel.getByRole('log')).toContainText('Web and mobile apps.')

  await panel.getByLabel('Type a message').fill('So how much would it COST me?')
  await page.keyboard.press('Enter')
  await expect(panel.getByRole('log')).toContainText('It depends on the scope.')
})

test('unknown question: fallback + WhatsApp link with the whole chat', async ({ page }) => {
  const { panel } = await openChat(page)
  await panel.getByLabel('Type a message').fill('Do you do blockchain audits?')
  await page.keyboard.press('Enter')
  await expect(panel.getByRole('log')).toContainText('No answer yet. Yunus will reply.')

  const cta = panel.getByRole('link', { name: 'Send this chat on WhatsApp' })
  await expect(cta).toBeVisible()
  const href = await cta.getAttribute('href')
  expect(href).toMatch(/^https:\/\/wa\.me\/923082352331\?text=/)
  const text = decodeURIComponent(href.split('?text=')[1])
  expect(text).toContain('Me: Do you do blockchain audits?')
  expect(text).toContain('Assistant: No answer yet. Yunus will reply.')
  await expect(panel.getByRole('link', { name: /Continue on WhatsApp/ })).toHaveAttribute(
    'href',
    href,
  )
})

test('conversation is saved through save_chat and survives a reload', async ({ page, supa }) => {
  const { panel } = await openChat(page)
  await panel.getByLabel('Type a message').fill('hello')
  await page.keyboard.press('Enter')
  await expect(panel.getByRole('log')).toContainText('Hi there!')

  await expect.poll(() => supa.rest('rpc', 'POST').length, { timeout: 5000 }).toBeGreaterThan(0)
  const call = supa.rest('rpc', 'POST').at(-1)
  expect(call.url).toContain('/rpc/save_chat')
  expect(call.body.p_token).toMatch(/^[0-9a-f]{48}$/)
  expect(call.body.p_transcript.map((m) => m.from)).toEqual(['user', 'bot'])

  await page.reload()
  await page.mouse.move(310, 310)
  await page.getByRole('button', { name: 'Chat with Yunus’s assistant' }).click()
  await expect(panel.getByRole('log')).toContainText('Hi there!')

  // "New chat" clears it.
  await panel.getByRole('button', { name: 'Start a new chat' }).click()
  await expect(panel.getByRole('log')).not.toContainText('Hi there!')
})

test('Escape closes the chat and returns focus to the button; no a11y issues', async ({ page }) => {
  const { launcher, panel } = await openChat(page)
  const { violations } = await new AxeBuilder({ page }).include('#chat-panel').analyze()
  expect(violations.filter((v) => ['serious', 'critical'].includes(v.impact))).toEqual([])
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(launcher).toBeFocused()
})

test('chat is hidden when switched off in settings', async ({ page, supa }) => {
  supa.override(
    (req) => req.method() === 'GET' && req.url().includes('/rest/v1/site_settings'),
    async (route) => {
      const res = await route.fetch({ headers: supa.anonHeaders(route.request()) })
      return route.fulfill({
        response: res,
        json: withSettings(await res.json(), { chat_enabled: false }),
      })
    },
  )
  await page.goto('/')
  await page.mouse.move(300, 300)
  await page.waitForTimeout(1500)
  await expect(page.getByRole('button', { name: 'Chat with Yunus’s assistant' })).toHaveCount(0)
})

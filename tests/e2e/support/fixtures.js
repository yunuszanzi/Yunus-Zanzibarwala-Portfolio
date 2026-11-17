import { test as base, expect } from '@playwright/test'
import { SupabaseMock } from './supabaseMock.js'
import { AUTH_STORAGE_KEY, fakeSession } from './env.js'

export { expect }

/**
 * Shared fixtures (all tests import `test` from here):
 *  - supa (auto): SupabaseMock on every browser context. Live reads, faked writes. This is
 *    what keeps the suite safe to run against the real project.
 *  - health (auto): fails the test on any uncaught error, console error or failed request.
 *    Call health.allow(/pattern/) for errors a test triggers on purpose.
 *  - loginAs(email?): puts a (fake) Supabase session in localStorage before the page loads.
 */
export const test = base.extend({
  supa: [
    async ({ context }, use) => {
      const mock = new SupabaseMock(context)
      await mock.install()
      await use(mock)
    },
    { auto: true },
  ],

  health: [
    async ({ page }, use) => {
      const problems = []
      const allowed = []
      page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`))
      page.on('console', (m) => {
        if (m.type() === 'error') problems.push(`console.error: ${m.text()}`)
      })
      page.on('requestfailed', (r) => {
        const why = r.failure()?.errorText ?? ''
        // Aborted = navigation away or a lazy image the browser cancelled; not a bug.
        if (!/ERR_ABORTED|NS_BINDING_ABORTED/.test(why))
          problems.push(`request failed: ${r.url()} ${why}`)
      })
      await use({ allow: (re) => allowed.push(re) })
      const unexpected = problems.filter((p) => !allowed.some((re) => re.test(p)))
      expect(unexpected, 'console errors / failed requests').toEqual([])
    },
    { auto: true },
  ],

  loginAs: async ({ context }, use) => {
    await use(async (email) => {
      await context.addInitScript(
        ([key, value]) => localStorage.setItem(key, value),
        [AUTH_STORAGE_KEY, JSON.stringify(fakeSession(email))],
      )
    })
  },
})

/** Scroll the whole page so scroll-reveal content and lazy chunks load, then back to top. */
export async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 30))
    }
    window.scrollTo(0, 0)
  })
}

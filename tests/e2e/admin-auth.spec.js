import { test, expect } from './support/fixtures.js'
import { CORS, OWNER_EMAIL, fakeSession } from './support/env.js'

// Sign-in requests are answered by the mock, so no real login attempts (or rate limits)
// hit Supabase. The UI, routing, session persistence and logout are all real.

const isTokenRequest = (req) => req.url().includes('/auth/v1/token')

test('/admin redirects to login when logged out', async ({ page }) => {
  await page.goto('/admin/projects')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('wrong password shows an error', async ({ page, supa, health }) => {
  health.allow(/status of 400/)
  supa.override(isTokenRequest, (route) =>
    route.fulfill({
      status: 400,
      headers: CORS,
      json: { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' },
    }),
  )
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(OWNER_EMAIL)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toHaveText('That email and password don’t match.')
  await expect(page).toHaveURL(/\/admin\/login$/)
})

test('empty login form shows field errors', async ({ page, supa }) => {
  await page.goto('/admin/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Enter a valid email')).toBeVisible()
  await expect(page.getByText('Enter your password')).toBeVisible()
  expect(supa.writes).toHaveLength(0)
})

test('correct login reaches the dashboard, survives reload, and logout ends it', async ({
  page,
  supa,
}) => {
  supa.override(isTokenRequest, (route) => route.fulfill({ headers: CORS, json: fakeSession() }))
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.getByLabel('Email').fill(OWNER_EMAIL)
  await page.getByLabel('Password').fill('correct-horse-battery-staple')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Returns to the page originally asked for.
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.goto('/admin/settings')
  await expect(page).toHaveURL(/\/admin\/login$/)
})

test('a signed-in account that is not the owner gets no access', async ({ page, loginAs }) => {
  await loginAs('someone.else@example.com')
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible()
  await expect(page.getByText('someone.else@example.com')).toBeVisible()
})
